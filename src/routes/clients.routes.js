const express = require('express');
const router = express.Router();
const clientsController = require('../controllers/clients.controller');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleGuard');

router.use(requireAuth);

// List clients
router.get('/', requireRole('admin', 'attorney'), clientsController.listClients);

// Assign client to case
router.post('/cases/:id/assign', requireRole('admin', 'attorney'), clientsController.assignClient);

module.exports = router;
