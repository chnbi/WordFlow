const exportService = require('../services/exportService');
const path = require('path');

// Export project as Excel
exports.exportExcel = async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await exportService.generateExcelExport(projectId);

    res.json({
      success: true,
      data: {
        filename: result.filename,
        size: result.size,
        itemCount: result.itemCount,
        downloadUrl: `/api/export/download/${path.basename(result.filename)}`
      },
      message: 'Excel export generated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Export project as JSON
exports.exportJSON = async (req, res) => {
  try {
    const { projectId } = req.params;

    const result = await exportService.generateJSONExport(projectId);

    res.json({
      success: true,
      data: {
        filename: result.filename,
        size: result.size,
        itemCount: result.itemCount,
        downloadUrl: `/api/export/download/${path.basename(result.filename)}`
      },
      message: 'JSON export generated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Export complete package (ZIP)
exports.exportPackage = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { includeJSON, createZip } = req.body;

    const result = await exportService.generateExportPackage(projectId, {
      includeJSON: includeJSON !== false,
      createZip: createZip !== false
    });

    const response = {
      success: true,
      data: {},
      message: 'Export package generated successfully'
    };

    if (result.excel) {
      response.data.excel = {
        filename: result.excel.filename,
        size: result.excel.size,
        downloadUrl: `/api/export/download/${path.basename(result.excel.filename)}`
      };
    }

    if (result.json) {
      response.data.json = {
        filename: result.json.filename,
        size: result.json.size,
        downloadUrl: `/api/export/download/${path.basename(result.json.filename)}`
      };
    }

    if (result.zip) {
      response.data.zip = {
        filename: result.zip.filename,
        size: result.zip.size,
        downloadUrl: `/api/export/download/${path.basename(result.zip.filename)}`
      };
    }

    res.json(response);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Download exported file
exports.downloadFile = async (req, res) => {
  try {
    const { filename } = req.params;

    const filepath = path.join(process.cwd(), 'exports', filename);

    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ success: false, error: 'Download failed' });
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
