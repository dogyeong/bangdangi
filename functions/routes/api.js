const express = require('express');
const router = express.Router();
const createError = require('http-errors');
const model = require('../modules/model');


router.post('/article', (req, res, next) => {
    const body = req.body;

    // 지역 검사
    if(!req.body || !body.place) {
        return next(createError(400, 'parameter is missing'));
    }

    const place = body.place;
    const id    = body.id;
    const data  = body.data;

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


router.put('/article', (req, res, next) => {
    const body = req.body;

    // 지역, id 검사
    if(!req.body || !body.place || !body.id) {
        return next(createError(400, 'parameter is missing'));
    }

    const place = body.place;
    const id    = body.id;
    const data  = body.data;

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

router.delete('/article', (req, res, next) => {
    const body = req.body;

    // 지역, id 검사
    if(!req.body || !body.place || !body.id) {
        return next(createError(400, 'parameter is missing'));
    }

    const place = body.place;
    const id    = body.id;

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