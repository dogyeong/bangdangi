const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const createError = require('http-errors');
const nodemailer = require('nodemailer');
const smtpPool = require('nodemailer-smtp-pool');
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

router.post('/payments', (req, res, next) => {
    var transporter = nodemailer.createTransport(smtpPool({
        service: 'gmail',
        auth: {
            user: 'shroad1802@gmail.com',
            pass: process.env.GMAIL_PASSWORD
        }
      }));

    const mailOptions = {
        from: '방단기 <shroad1802@gmail.com>', // Something like: Jane Doe <janedoe@gmail.com>
        to: 'shroad1802@naver.com',
        subject: '새 계약요청', // email subject
        html: `<p style="font-size: 16px;">지역 : ${req.body.place}</p><br />
            <p style="font-size: 16px;">매물id : ${req.body.articleId}</p><br />
            <p style="font-size: 16px;">이름 : ${req.body.name}</p><br />
            <p style="font-size: 16px;">휴대폰번호 : ${req.body.phone}</p><br />
        ` 
    };



    db.collection('reservation').add({
        place: req.body.place,
        articleId: req.body.articleId,
        name: req.body.name,
        phone: req.body.phone,
        startDate: new Date(req.body.start_date),
        endDate: new Date(req.body.end_date),
        createdAt: new Date(),
    })
    .then(() => {
        return transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                return res.send(err.toString());
            }
            return res.send('OK');
        });
    })
    .catch((err) => {
        console.log(err);
        return next(createError(500));
    });
});

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