const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const createError = require('http-errors');
const url = require('url');
const cors = require('cors')({
    origin: true
});

/* GET home page. */
router.get('/', (req, res, next) => {
  //res.render('index', { title: 'Express' });
  res.render('index');
});

router.get('/getNew', (req, res) => {
  let ref = admin.firestore().doc('article/live');
  ref.getCollections().then(collections => {
      let arr = [];
      return collections.forEach(collection => {
        return res.send(JSON.parse(getArticleList(collection)));
      });
  }).catch(error => console.log(error)); 
  res.send('getNew OK');
})

async function getArticleList(collection) {
  let arr = [];
  await collection.where('done', '==', false).where('display', '==', true).get()
  .then(docs => {
    return arr = docs.map(doc => doc.data());
  })
  .catch(err => console.log(err));

  return arr;
}

module.exports = router;