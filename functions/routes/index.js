const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const createError = require('http-errors');
const url = require('url');
const http = require('http');
const https = require('https');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const request = require('request-promise');
const cors = require('cors')({
  origin: true
});

/* GET home page. */
router.get('/', (req, res, next) => {
  return res.render('notice');
  /*
  var db = admin.firestore();
  // 충남대, 동대문, 마포에서 최신매물 1개씩 들고온다
  Promise.all([
    db.collection('article/live/dongdaemun').where('display', '==', true).where('done', '==', false)
    .orderBy('createdAt', 'desc').limit(3).get(),
    db.collection('article/live/mafo').where('display', '==', true).where('done', '==', false)
    .orderBy('createdAt', 'desc').limit(3).get(),
    db.collection('article/live/cnu').where('display', '==', true).where('done', '==', false)
    .orderBy('createdAt', 'desc').limit(3).get()
  ])
  .then(result => {
    // 들고온 매물들을 배열로 만들고
    let newArticleArr = result.reduce((res, cur) => {
      if (!cur.empty) {
        let arrHasImage = cur.docs.filter(doc => {
          return doc.data().images
        })
        if (arrHasImage.length > 0) {
          res.push(arrHasImage[0].data());
        }
      }
      return res;
    }, []);
    // index 렌더링할 때 넘겨준다
    return res.render('index', { newArticleArr });
  })
  .catch(error => {
    console.log(error);
    return next(createError(500));
  })
  */
});

router.get('/master', (req, res) => {
  return res.render('master');
})

router.get('/master2', (req, res) => {
  return res.render('master2');
})

router.get('/masterLogin', (req, res) => {
  return res.render('masterLogin');
})

router.get('/request', (req, res) => {
  return res.render('notice');
  // return res.render('request');
})

router.get('/register', (req, res) => {
  return res.render('notice');
  // return res.render('register');
})

router.get('/notice', (req, res) => {
  return res.render('notice');
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