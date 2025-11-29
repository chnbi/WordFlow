const express = require('express');
const router = express.Router();
const translationController = require('../controllers/translationController');

// Translation routes
router.get('/project/:projectId', translationController.getProjectTranslations);
router.get('/:id', translationController.getTranslation);
router.post('/', translationController.createTranslation);
router.put('/:id', translationController.updateTranslation);
router.delete('/:id', translationController.deleteTranslation);

// AI translation routes
router.post('/:id/translate', translationController.generateTranslation);
router.post('/project/:projectId/batch-translate', translationController.batchGenerateTranslations);

// Status updates
router.post('/:id/approve', translationController.approveTranslation);
router.post('/:id/reject', translationController.rejectTranslation);

// Bulk operations
router.post('/bulk/approve', translationController.bulkApproveTranslations);
router.post('/bulk/reject', translationController.bulkRejectTranslations);

module.exports = router;
