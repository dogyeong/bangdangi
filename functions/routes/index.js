const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  //res.render('index', { title: 'Express' });
  res.send("Hi from index routes!")
});

router.get('test', (req, res, next) => {
    res.send('test');
});

module.exports = router;