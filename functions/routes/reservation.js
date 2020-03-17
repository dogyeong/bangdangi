const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const createError = require("http-errors");
const nodemailer = require("nodemailer");
const smtpPool = require("nodemailer-smtp-pool");
const db = admin.firestore();
const model = require("../modules/model");
const storageHandler = require("../modules/storageHandler");
const util = require("../modules/util");
const PLACE_OBJ = model.PLACE_OBJ;
const getArticlesPath = model.getArticlesPath;


router.post("/application", util.fileParser, async (req, res, next) => {

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
        const place = req.body.place;
        const articleId = req.body.articleId;
        const name = req.body.name;
        const phone = req.body.phone;
        const startDate = req.body.start_date;
        const endDate = req.body.end_date;
        
        // 신분증 file
        const file = Object.values(req.files)[0];

        // 신분증 파일을 스토리지에 저장하고 난 뒤 파일의 엑세스 url
        const imageURL = await storageHandler.upload(file, `id/${req.body.phone}/${file.filename}`);
        
        // 계약정보 등록
        await db.collection('reservation').add({
            place,
            articleId,
            name,
            phone,
            identitiy: imageURL,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            createdAt: new Date(),
            contract: null,
        })

        // 메일 발송하고 신청성공페이지 렌더링
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
