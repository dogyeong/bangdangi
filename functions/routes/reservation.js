const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const url = require('url');
const cors = require('cors')({
    origin: true
});
const db = admin.firestore();
const model = require('../modules/model');
const PLACE_OBJ = {
    pnu: '부산, 부산대',
    cnu: '대전, 충남대',
    mafo: '마포구,서대문구',
    seongdong: '성동구',
    gwanak: '관악구, 동작구, 영등포구',
    dongdaemun: '동대문구',
    gangnam: '서초구, 강남구',
}
const getArticlesPath = (place) => `article/${place}/articles`;
const getLocKeywordsPath = (place) => `article/${place}/keywords/locationKeywords`;

router.get('/:place/:articleId', (req, res, next) => { 
    const place = req.params.place;
    const articleId = req.params.articleId;
    const docRef = db.doc(`${getArticlesPath(place)}/${articleId}`);
    
    docRef.get()
    .then((doc) => {
        if (doc.exists && !doc.data().done) { // 문서 존재하고 거래되지 않은 매물
            let data = doc.data();
            let placeKo = PLACE_OBJ[place];
            
            return res.render('reservation', { place, placeKo, articleId, data });
        }
        else {
            // 문서 존재하지 않거나 거래된 매물
           return next(createError(404));
        }
    })
    .catch((err) => {
        console.log(err);
        return next(createError(500));
    })
});

module.exports = router;