const express = require('express');
const router = express.Router();
const glossaryController = require('../controllers/glossaryController');

// Glossary routes
router.get('/', glossaryController.getAllGlossary);
router.get('/versions', glossaryController.getVersions);
router.get('/categories', glossaryController.getCategories);
router.get('/:id', glossaryController.getGlossaryTerm);
router.post('/', glossaryController.createGlossaryTerm);
router.put('/:id', glossaryController.updateGlossaryTerm);
router.delete('/:id', glossaryController.deleteGlossaryTerm);
router.post('/bulk-import', glossaryController.bulkImport);

module.exports = router;
