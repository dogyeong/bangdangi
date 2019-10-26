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
  var db = admin.firestore();
  // 충남대, 동대문, 마포에서 최신매물 1개씩 들고온다
  Promise.all([
    db.collection('article/live/cnu').where('display', '==', true).where('done', '==', false)
    .orderBy('createdAt', 'desc').limit(1).get(),
    db.collection('article/live/dongdaemun').where('display', '==', true).where('done', '==', false)
    .orderBy('createdAt', 'desc').limit(1).get(),
    db.collection('article/live/mafo').where('display', '==', true).where('done', '==', false)
    .orderBy('createdAt', 'desc').limit(1).get()
  ])
  .then(result => {
    // 들고온 매물들을 배열로 만들고
    let newArticleArr = result.reduce((res, cur) => {
      if (!cur.empty) res.push(cur.docs[0].data());
      return res;
    }, []);
    // index 렌더링할 때 넘겨준다
    return res.render('index', { newArticleArr });
  })
  .catch(error => {
    console.log(error);
    return next(createError(500));
  })
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