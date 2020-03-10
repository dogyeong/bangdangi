const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const createError = require("http-errors");
const nodemailer = require("nodemailer");
const smtpPool = require("nodemailer-smtp-pool");
const db = admin.firestore();
const model = require("../modules/model");
const PLACE_OBJ = model.PLACE_OBJ;
const getArticlesPath = model.getArticlesPath;


router.post("/application", async (req, res, next) => {

    var transporter = nodemailer.createTransport(
        smtpPool({
            service: "gmail",
            auth: {
                user: "shroad1802@gmail.com",
                pass: process.env.GMAIL_PASSWORD,
            },
        })
    );

    const mailOptions = {
        from: "방단기 <shroad1802@gmail.com>", // Something like: Jane Doe <janedoe@gmail.com>
        to: "shroad1802@naver.com",
        subject: "새 계약요청", // email subject
        html: `<p style="font-size: 16px;">지역 : ${req.body.place}</p><br />
            <p style="font-size: 16px;">매물id : ${req.body.articleId}</p><br />
            <p style="font-size: 16px;">이름 : ${req.body.name}</p><br />
            <p style="font-size: 16px;">휴대폰번호 : ${req.body.phone}</p><br />
        `,
    };

    try {
        await db.collection('reservation').add({
            place: req.body.place,
            articleId: req.body.articleId,
            name: req.body.name,
            phone: req.body.phone,
            identitiy: req.body.id,
            startDate: new Date(req.body.start_date),
            endDate: new Date(req.body.end_date),
            createdAt: new Date(),
            contract: null,
        })

        return transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.log(err);
                return next(createError(500));
            }
            return res.render("reservation-success");
        });
    } catch (err) {
        console.log(err);
        return next(createError(500));
    }
});

router.get("/process", (req, res, next) => {
    const place = req.query.place;
    const id = req.query.id;

    if (!place || !id) {
        return next(createError(404));
    }

    return res.render("reservation-process", { place, id });
});

router.get("/payments/:reservationId", (req, res, next) => {
    const reservationId = req.params.reservationId;
    const rsvRef = db.doc(`reservation/${reservationId}`);

    rsvRef
        .get()
        .then(async doc => {
            if (doc.exists && doc.data().contract) {
                // 문서 존재하고 계약서 링크가 존재하는 가계약
                let rsvData = doc.data();
                let place = rsvData.place;
                let placeKo = PLACE_OBJ[place];
                let articleId = rsvData.articleId;
                let articleData = await db
                    .doc(`${getArticlesPath(place)}/${articleId}`)
                    .get()
                    .then(doc => doc.data());

                return res.render("reservation-payments", { place, placeKo, rsvData, articleData });
            } else {
                // 문서 존재하지 않거나 계약서가 없는 예약
                return next(createError(404));
            }
        })
        .catch(err => {
            console.log(err);
            return next(createError(500));
        });
});

router.get("/:place/:articleId", (req, res, next) => {
    const place = req.params.place;
    const articleId = req.params.articleId;
    const docRef = db.doc(`${getArticlesPath(place)}/${articleId}`);

    docRef
        .get()
        .then(doc => {
            if (doc.exists && !doc.data().done) {
                // 문서 존재하고 거래되지 않은 매물
                let data = doc.data();
                let placeKo = PLACE_OBJ[place];

                return res.render("reservation", { place, placeKo, articleId, data });
            } else {
                // 문서 존재하지 않거나 거래된 매물
                return next(createError(404));
            }
        })
        .catch(err => {
            console.log(err);
            return next(createError(500));
        });
});

module.exports = router;
