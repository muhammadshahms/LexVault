const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { redirectIfAuth } = require('../middleware/auth');

// Login
router.get('/login', redirectIfAuth, authController.loginPage);
router.post('/login', redirectIfAuth, authController.login);

// Register
router.get('/register', redirectIfAuth, authController.registerPage);
router.post('/register', redirectIfAuth, authController.register);

// Logout
router.post('/logout', authController.logout);

module.exports = router;
