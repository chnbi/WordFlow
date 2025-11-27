const Glossary = require('../models/Glossary');

// Get all glossary terms
exports.getAllGlossary = async (req, res) => {
  try {
    const { version, category, active } = req.query;

    const filter = {};

    if (version) filter.version = version;
    if (category) filter.category = category;
    if (active !== undefined) filter.isActive = active === 'true';

    const glossary = await Glossary.find(filter).sort({ category: 1, en: 1 });

    res.json({ success: true, data: glossary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single glossary term
exports.getGlossaryTerm = async (req, res) => {
  try {
    const term = await Glossary.findById(req.params.id);

    if (!term) {
      return res.status(404).json({ success: false, error: 'Glossary term not found' });
    }

    res.json({ success: true, data: term });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create glossary term
exports.createGlossaryTerm = async (req, res) => {
  try {
    const { en, bm, zh, category, doNotTranslate, notes, version } = req.body;

    const term = new Glossary({
      en,
      bm,
      zh,
      category: category || 'general',
      doNotTranslate: doNotTranslate || false,
      notes,
      version: version || 'v1.0',
      isActive: true
    });

    await term.save();

    res.status(201).json({
      success: true,
      data: term,
      message: 'Glossary term created successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'This term already exists in this version'
      });
    }
    res.status(400).json({ success: false, error: error.message });
  }
};

// Update glossary term
exports.updateGlossaryTerm = async (req, res) => {
  try {
    const { en, bm, zh, category, doNotTranslate, notes, isActive } = req.body;

    const term = await Glossary.findByIdAndUpdate(
      req.params.id,
      { en, bm, zh, category, doNotTranslate, notes, isActive },
      { new: true, runValidators: true }
    );

    if (!term) {
      return res.status(404).json({ success: false, error: 'Glossary term not found' });
    }

    res.json({
      success: true,
      data: term,
      message: 'Glossary term updated successfully'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Delete glossary term
exports.deleteGlossaryTerm = async (req, res) => {
  try {
    const term = await Glossary.findByIdAndDelete(req.params.id);

    if (!term) {
      return res.status(404).json({ success: false, error: 'Glossary term not found' });
    }

    res.json({
      success: true,
      message: 'Glossary term deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Bulk import glossary
exports.bulkImport = async (req, res) => {
  try {
    const { terms, version } = req.body;

    if (!Array.isArray(terms) || terms.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid terms array'
      });
    }

    const glossaryVersion = version || 'v1.0';
    const results = [];
    const errors = [];

    for (const termData of terms) {
      try {
        const term = new Glossary({
          ...termData,
          version: glossaryVersion,
          isActive: true
        });

        await term.save();
        results.push(term);
      } catch (error) {
        errors.push({
          term: termData.en,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        imported: results.length,
        errors: errors.length,
        results,
        errors
      },
      message: `Bulk import completed: ${results.length} successful, ${errors.length} errors`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get glossary versions
exports.getVersions = async (req, res) => {
  try {
    const versions = await Glossary.distinct('version');

    res.json({ success: true, data: versions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Glossary.distinct('category');

    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
