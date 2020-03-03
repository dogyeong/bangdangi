const express = require('express');
const router = express.Router();
const createError = require('http-errors');
const model = require('../modules/model');


/**
 * GET /articles
 * 
 * 모든 매물 데이터를 리턴한다
 */
router.get('/articles', (req, res, next) => {

        return getArticlesAll();
});


/**
 * GET /articles/:place
 * 
 * place 내의 모든 매물 데이터를 리턴한다
 */
router.get('/articles/:place', (req, res, next) => {

    return getArticlesAll(place);
});


/**
 * GET /articles/:place
 * 
 * 해당 place/id의 매물 데이터를 리턴한다
 */
router.get('/articles/:place/:id', (req, res, next) => {

    return getArticles(place, id);
});


/**
 * POST /articles/:place
 * 
 * place에 매물 추가한다, id는 자동생성된다.
 */
router.post('/articles/:place', (req, res, next) => {
    const place = req.params.place;
    const data  = req.body.data;
    
    // 매물 추가
    model
    .addArticle(place, id, data)
    .then(() => { 
        return res.status(200).send("OK") 
    })
    .catch((err) => {
        return next(createError(500, err));
    });

});


/**
 * POST /articles/:place/:id
 * 
 * place/id에 매물 추가한다.
 */
router.post('/articles/:place/:id', (req, res, next) => {
    const place = req.params.place;
    const id    = req.params.id;
    const data  = req.body.data;
    
    // 매물 추가
    model
    .addArticle(place, id, data)
    .then(() => { 
        return res.status(200).send("OK") 
    })
    .catch((err) => {
        return next(createError(500, err));
    });

});


/**
 * PUT /articles/:place/:id
 * 
 * 매물 데이터를 수정한다.
 */
router.put('/articles/:place/:id', (req, res, next) => {
    const place = req.params.place;
    const id    = req.params.id;

    // 매물 업데이트
    model
    .updateArticle(place, id, data)
    .then(() => { 
        return res.status(200).send("OK") 
    })
    .catch((err) => {
        return next(createError(500, err));
    });
});


/**
 * DELETE /articles/:place/:id
 * 
 * 매물 데이터를 삭제한다.
 */
router.delete('/articles/:place/:id', (req, res, next) => {
    const place = req.params.place;
    const id    = req.params.id;

    // 매물 삭제
    model
    .deleteArticle(place, id)
    .then(() => { 
        return res.status(200).send("OK"); 
    })
    .catch((err) => {
        return next(createError(500, err));
    });
});




module.exports = router;