const ocrService = require('../services/ocrService');
const Translation = require('../models/Translation');
const path = require('path');
const fs = require('fs').promises;

// Upload and process image with OCR
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { projectId, page, section, elementType, elementName } = req.body;

    if (!projectId || !page || !section) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: projectId, page, section'
      });
    }

    // Validate image quality
    const imageBuffer = await fs.readFile(req.file.path);
    const validation = ocrService.validateImageQuality(imageBuffer);

    if (!validation.valid) {
      // Clean up uploaded file
      await fs.unlink(req.file.path);
      return res.status(400).json({ success: false, error: validation.message });
    }

    // Perform OCR
    const ocrResult = await ocrService.extractTextFromImage(req.file.path);

    if (!ocrResult.success) {
      await fs.unlink(req.file.path);
      return res.status(500).json({
        success: false,
        error: 'OCR extraction failed',
        details: ocrResult.message
      });
    }

    // Create translation entry with OCR extracted text
    const translation = new Translation({
      projectId,
      page,
      section,
      elementType: elementType || 'other',
      elementName: elementName || path.basename(req.file.originalname, path.extname(req.file.originalname)),
      content: {
        en: ocrResult.text,
        bm: '',
        zh: ''
      },
      sourceType: 'ocr',
      ocrConfidence: ocrResult.confidence
    });

    await translation.save();

    // Clean up uploaded file
    await fs.unlink(req.file.path);

    res.json({
      success: true,
      data: {
        translation,
        ocr: {
          text: ocrResult.text,
          confidence: ocrResult.confidence,
          message: ocrResult.message
        }
      },
      message: 'Image processed and text extracted successfully'
    });
  } catch (error) {
    // Clean up file if it exists
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }

    res.status(500).json({ success: false, error: error.message });
  }
};

// Batch upload images
exports.batchUploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files uploaded' });
    }

    const { projectId, page, section } = req.body;

    if (!projectId || !page || !section) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: projectId, page, section'
      });
    }

    const results = [];
    const errors = [];

    for (const file of req.files) {
      try {
        const ocrResult = await ocrService.extractTextFromImage(file.path);

        if (ocrResult.success && ocrResult.text.trim()) {
          const translation = new Translation({
            projectId,
            page,
            section,
            elementType: 'other',
            elementName: path.basename(file.originalname, path.extname(file.originalname)),
            content: {
              en: ocrResult.text,
              bm: '',
              zh: ''
            },
            sourceType: 'ocr',
            ocrConfidence: ocrResult.confidence
          });

          await translation.save();
          results.push({
            filename: file.originalname,
            translationId: translation._id,
            text: ocrResult.text,
            confidence: ocrResult.confidence
          });
        } else {
          errors.push({
            filename: file.originalname,
            error: ocrResult.message || 'No text detected'
          });
        }

        // Clean up file
        await fs.unlink(file.path);
      } catch (error) {
        errors.push({
          filename: file.originalname,
          error: error.message
        });

        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error deleting file:', unlinkError);
        }
      }
    }

    res.json({
      success: true,
      data: {
        processed: results.length,
        errors: errors.length,
        results,
        errors
      },
      message: `Batch upload completed: ${results.length} successful, ${errors.length} errors`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Process base64 image (for drag-drop uploads)
exports.processBase64Image = async (req, res) => {
  try {
    const { image, projectId, page, section, elementType, elementName } = req.body;

    if (!image || !projectId || !page || !section) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Perform OCR on base64 image
    const ocrResult = await ocrService.extractTextFromBase64(image);

    if (!ocrResult.success) {
      return res.status(500).json({
        success: false,
        error: 'OCR extraction failed',
        details: ocrResult.message
      });
    }

    // Create translation entry
    const translation = new Translation({
      projectId,
      page,
      section,
      elementType: elementType || 'other',
      elementName: elementName || 'Uploaded Image',
      content: {
        en: ocrResult.text,
        bm: '',
        zh: ''
      },
      sourceType: 'ocr',
      ocrConfidence: ocrResult.confidence
    });

    await translation.save();

    res.json({
      success: true,
      data: {
        translation,
        ocr: {
          text: ocrResult.text,
          confidence: ocrResult.confidence
        }
      },
      message: 'Image processed successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
