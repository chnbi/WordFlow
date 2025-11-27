const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');

// Export routes
router.post('/project/:projectId/excel', exportController.exportExcel);
router.post('/project/:projectId/json', exportController.exportJSON);
router.post('/project/:projectId/package', exportController.exportPackage);
router.get('/download/:filename', exportController.downloadFile);

module.exports = router;
