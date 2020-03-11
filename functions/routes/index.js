const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const createError = require("http-errors");
const url = require("url");
const http = require("http");
const https = require("https");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const request = require("request-promise");
const cors = require("cors")({
    origin: true,
});
const model = require("../modules/model.js");

// VAPID keys should only be generated only once.
const vapidKeys = {
    publicKey: "BFziFVjWvOlL3yM76YQkZLqX-Nv6T26npdFQKyGa7AhI-fhW_xRqkIXc6_w6QsD0T_Zfn8AJSOO7H7o7BP85UQI",
    privateKey: "Y-I2f6ZQ9tT6tvF7YdPZCUiFiA4fHCNKbBKn3wg-xI0",
};

/* GET home page. */
router.get("/", async (req, res, next) => {
    // 새로 등록된 매물, 후기가 있는 거래완료된 매물을 4개씩 불러온다
    const newArticles = await model.getNewArticles(4);

    console.log(newArticles);

    return res.render("index", { newArticles });
});

router.get("/test", (req, res, next) => {
    return res.render('test');
})

router.get("/testSample", (req, res, next) => {
    return res.render('testSample', { 
        inputYn: 'n',
        roadFullAddr: 'test',
        roadAddrPart1: 'test',
        roadAddrPart2: 'test',
        engAddr: 'test',
        jibunAddr: 'test',
        zipNo: 'test',
        addrDetail: 'test',
        admCd: 'test',
        rnMgtSn: 'test',
        bdMgtSn: 'test',
        detBdNmList: 'test',
        bdNm: 'test',
        bdKdcd: 'test',
        siNm: 'test',
        sggNm: 'test',
        emdNm: 'test',
        liNm: 'test',
        rn: 'test',
        udrtYn: 'test',
        buldMnnm: 'test',
        buldSlno: 'test',
        mtYn: 'test',
        lnbrMnnm: 'test',
        lnbrSlno: 'test',
        emdNo: 'test', 
    });
})

router.post("/testSample", (req, res, next) => {
    return res.render('testSample', {
        inputYn: req.body.inputYn,
        roadFullAddr: req.body.roadFullAddr,
        roadAddrPart1: req.body.roadAddrPart1,
        roadAddrPart2: req.body.roadAddrPart2,
        engAddr: req.body.engAddr,
        jibunAddr: req.body.jibunAddr,
        zipNo: req.body.zipNo,
        addrDetail: req.body.addrDetail,
        admCd: req.body.admCd,
        rnMgtSn: req.body.rnMgtSn,
        bdMgtSn: req.body.bdMgtSn,
        detBdNmList: req.body.detBdNmList,
        bdNm: req.body.bdNm,
        bdKdcd: req.body.bdKdcd,
        siNm: req.body.siNm,
        sggNm: req.body.sggNm,
        emdNm: req.body.emdNm,
        liNm: req.body.liNm,
        rn: req.body.rn,
        udrtYn: req.body.udrtYn,
        buldMnnm: req.body.buldMnnm,
        buldSlno: req.body.buldSlno,
        mtYn: req.body.mtYn,
        lnbrMnnm: req.body.lnbrMnnm,
        lnbrSlno: req.body.lnbrSlno,
        emdNo: req.body.emdNo,
    });
})

router.get("/pwa", (req, res, next) => {
    console.log("key in /pwa", vapidKeys);
    var db = admin.firestore();
    // 충남대, 동대문, 마포에서 최신매물 1개씩 들고온다
    Promise.all([
        db
            .collection("article/live/dongdaemun")
            .where("display", "==", true)
            .where("done", "==", false)
            .orderBy("createdAt", "desc")
            .limit(3)
            .get(),
        db
            .collection("article/live/mafo")
            .where("display", "==", true)
            .where("done", "==", false)
            .orderBy("createdAt", "desc")
            .limit(3)
            .get(),
        db
            .collection("article/live/cnu")
            .where("display", "==", true)
            .where("done", "==", false)
            .orderBy("createdAt", "desc")
            .limit(3)
            .get(),
    ])
        .then(result => {
            // 들고온 매물들을 배열로 만들고
            let newArticleArr = result.reduce((res, cur) => {
                if (!cur.empty) {
                    let arrHasImage = cur.docs.filter(doc => {
                        return doc.data().images;
                    });
                    if (arrHasImage.length > 0) {
                        res.push(arrHasImage[0].data());
                    }
                }
                return res;
            }, []);
            // index 렌더링할 때 넘겨준다
            return res.render("index", {
                newArticleArr,
                vapidPublicKey: vapidKeys.publicKey,
            });
        })
        .catch(error => {
            console.log(error);
            return next(createError(500));
        });
});

router.get("/aboutUs", (req, res) => {
    return res.render("aboutUs");
});

router.get("/master", (req, res) => {
    return res.render("master");
});

router.get("/master2", (req, res) => {
    return res.render("master2");
});

router.get("/masterLogin", (req, res) => {
    return res.render("masterLogin");
});

router.get("/request", (req, res) => {
    return res.render("request");
});

router.get("/register", (req, res) => {
    return res.render("register");
});

router.get("/notice", (req, res) => {
    return res.render("notice");
});

module.exports = router;
