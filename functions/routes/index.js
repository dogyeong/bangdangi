const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const createError = require("http-errors");
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

    const user = req.decodedClaims;

    // 새로 등록된 매물을 4개 불러온다
    //const newArticles = await model.getNewArticles(4);
    const newArticles = await model.getArticles('all', { display: true, done: false, sortBy: 'createdAt', limit: 4 });

    return res.render("index", { newArticles, user });
});


/**
 * 도로명주소 검색 api
 */
router.get("/addrSearch", (req, res, next) => {
    return res.render('addrSearch', { 
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

router.post("/addrSearch", (req, res, next) => {
    return res.render('addrSearch', {
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

router.get("/aboutUs", (req, res) => {
    const user = req.decodedClaims;
    return res.render("aboutUs", { user });
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
    const user = req.decodedClaims;
    return res.render("request", { user });
});

router.get("/register", (req, res) => {
    const user = req.decodedClaims;
    return res.render("register", { user });
});

router.get("/notice", (req, res) => {
    return res.render("notice");
});

module.exports = router;
