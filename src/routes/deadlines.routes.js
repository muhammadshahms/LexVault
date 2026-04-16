const express = require('express');
const router = express.Router();
const deadlinesController = require('../controllers/deadlines.controller');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// List upcoming deadlines
router.get('/', deadlinesController.listDeadlines);

module.exports = router;
