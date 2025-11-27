const Translation = require('../models/Translation');
const translationService = require('../services/translationService');

// Get all translations for a project
exports.getProjectTranslations = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, page, section } = req.query;

    const filter = { projectId };

    if (status) filter.status = status;
    if (page) filter.page = page;
    if (section) filter.section = section;

    const translations = await Translation.find(filter)
      .sort({ page: 1, section: 1, createdAt: 1 });

    res.json({ success: true, data: translations });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get single translation
exports.getTranslation = async (req, res) => {
  try {
    const translation = await Translation.findById(req.params.id);

    if (!translation) {
      return res.status(404).json({ success: false, error: 'Translation not found' });
    }

    res.json({ success: true, data: translation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create new translation (manual text input)
exports.createTranslation = async (req, res) => {
  try {
    const {
      projectId,
      page,
      section,
      elementType,
      elementName,
      content
    } = req.body;

    const translation = new Translation({
      projectId,
      page,
      section,
      elementType,
      elementName,
      content: {
        en: content.en,
        bm: '',
        zh: ''
      },
      sourceType: 'text'
    });

    await translation.save();

    res.status(201).json({
      success: true,
      data: translation,
      message: 'Translation created successfully'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Generate AI translation
exports.generateTranslation = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetLang, glossaryVersion } = req.body;

    const translation = await Translation.findById(id);

    if (!translation) {
      return res.status(404).json({ success: false, error: 'Translation not found' });
    }

    // Generate translation using AI service
    const result = await translationService.translateText(
      translation.content.en,
      'en',
      targetLang,
      glossaryVersion || 'v1.0'
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: 'Translation generation failed',
        details: result.warnings
      });
    }

    // Update translation
    translation.content[targetLang] = result.translation;
    translation.glossaryTerms = result.glossaryMatches;

    if (result.warnings && result.warnings.length > 0) {
      translation.warnings = translation.warnings || {};
      translation.warnings[targetLang] = result.warnings.join('; ');
    }

    await translation.save();

    res.json({
      success: true,
      data: translation,
      message: `${targetLang.toUpperCase()} translation generated`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Batch generate translations for project
exports.batchGenerateTranslations = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { targetLang, glossaryVersion } = req.body;

    const translations = await Translation.find({
      projectId,
      [`content.${targetLang}`]: { $in: ['', null] }
    });

    let successCount = 0;
    let errorCount = 0;

    for (const translation of translations) {
      try {
        const result = await translationService.translateText(
          translation.content.en,
          'en',
          targetLang,
          glossaryVersion || 'v1.0'
        );

        if (result.success) {
          translation.content[targetLang] = result.translation;
          translation.glossaryTerms = result.glossaryMatches;

          if (result.warnings && result.warnings.length > 0) {
            translation.warnings = translation.warnings || {};
            translation.warnings[targetLang] = result.warnings.join('; ');
          }

          await translation.save();
          successCount++;
        } else {
          errorCount++;
        }

        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Translation error for ${translation._id}:`, error);
        errorCount++;
      }
    }

    res.json({
      success: true,
      data: {
        total: translations.length,
        success: successCount,
        errors: errorCount
      },
      message: `Batch translation completed: ${successCount} successful, ${errorCount} errors`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update translation (manual edit)
exports.updateTranslation = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, notes } = req.body;

    const translation = await Translation.findById(id);

    if (!translation) {
      return res.status(404).json({ success: false, error: 'Translation not found' });
    }

    if (content) {
      translation.content = { ...translation.content, ...content };
    }

    if (notes !== undefined) {
      translation.notes = notes;
    }

    await translation.save();

    res.json({
      success: true,
      data: translation,
      message: 'Translation updated successfully'
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// Approve translation
exports.approveTranslation = async (req, res) => {
  try {
    const { id } = req.params;
    const { reviewer } = req.body;

    const translation = await Translation.findByIdAndUpdate(
      id,
      {
        status: 'approved',
        reviewer: reviewer || 'Marketing Team',
        reviewedAt: new Date()
      },
      { new: true }
    );

    if (!translation) {
      return res.status(404).json({ success: false, error: 'Translation not found' });
    }

    res.json({
      success: true,
      data: translation,
      message: 'Translation approved'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Reject translation
exports.rejectTranslation = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const translation = await Translation.findByIdAndUpdate(
      id,
      {
        status: 'rejected',
        notes: notes || 'Rejected for review'
      },
      { new: true }
    );

    if (!translation) {
      return res.status(404).json({ success: false, error: 'Translation not found' });
    }

    res.json({
      success: true,
      data: translation,
      message: 'Translation rejected'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Delete translation
exports.deleteTranslation = async (req, res) => {
  try {
    const translation = await Translation.findByIdAndDelete(req.params.id);

    if (!translation) {
      return res.status(404).json({ success: false, error: 'Translation not found' });
    }

    res.json({
      success: true,
      message: 'Translation deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
