const express = require('express');
const router = express.Router();
const casesController = require('../controllers/cases.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

// All routes require auth
router.use(requireAuth);

// List all cases (filtered by role)
router.get('/', casesController.listCases);

// Create case form — attorney / admin only
router.get('/create', requireRole('admin', 'attorney'), casesController.createPage);

// Create case
router.post('/', requireRole('admin', 'attorney'), casesController.createCase);

// Case detail
router.get('/:id', casesController.caseDetail);

// Edit case form
router.get('/:id/edit', requireRole('admin', 'attorney'), casesController.editPage);

// Update case
router.put('/:id', requireRole('admin', 'attorney'), casesController.updateCase);

// Delete case
router.delete('/:id', requireRole('admin', 'attorney'), casesController.deleteCase);

module.exports = router;
