const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const createError = require('http-errors');
const url = require('url');
const cors = require('cors')({
    origin: true
});

router.get('/login', (req, res, next) => {
    return res.render('login');
});

module.exports = router;