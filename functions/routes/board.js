const express = require("express");
const router = express.Router();
const admin = require("firebase-admin");
const createError = require("http-errors");
const cors = require("cors")({
    origin: true,
});
const db = admin.firestore();
const model = require("../modules/model");
const util = require("../modules/util");
const storageHandler = require("../modules/storageHandler");
const sessionHandler = require("../modules/sessionHandler");
const PLACE_OBJ = model.PLACE_OBJ;
const getArticlesPath = model.getArticlesPath;

router.get("/list/:univ", async (req, res, next) => {
    const univ = req.params.univ;
    const monthLimit = req.query.monthLimit;
    const priceKeywords = req.query.priceKeywords;
    let resultArr = [];
    let review = [];
    let thumbnails;

    // 필터가 적용된 매물 리스트를 가져온다
    resultArr = await getFilteredArticleList(univ, monthLimit, priceKeywords);

    // 매물 리스트의 썸네일을 가져온다
    thumbnails = await Promise.all(resultArr.map(doc => model.getThumbnail(doc)));

    // 매물 리스트와 썸네일을 합친다
    resultArr = resultArr.map((doc, idx) => {
        return {
            ...doc.data(),
            thumbnail: thumbnails[idx],
        };
    });

    // 매물 리스트 데이터 포맷팅
    resultArr = formatRoomList(resultArr);

    // 거래완료된 매물중에 리뷰가 있는 매물들을 가져온다
    review = await model.getReviews(univ, 0);
    review = formatRoomList(review.map(r => r.data()));

    let err = false;
    let roomList;
    if (resultArr.length > 0) {
        // 결과 존재
        roomList = addAd(resultArr); // 광고 삽입
    } else {
        // 결과 없음
        roomList = resultArr;
        err = "앗, 찾는 매물이 존재하지 않습니다.";
    }
    let univKo = PLACE_OBJ[univ];
    let filterOption = {
        date: monthLimit,
        price: priceKeywords,
    };

    return res.render("articleList", { roomList, review, univ, univKo, filterOption, err });
});

getFilteredArticleList = async (univ, monthLimit, priceKeywords) => {
    let result = await getDefaultFiltered(univ); // 기본필터

    if (monthLimit !== undefined) {
        let dateFiltered = await getDateFiltered(univ, monthLimit); // 기간필터
        result = opAND(result, dateFiltered); // 기본필터 && 기간필터
    }

    if (priceKeywords !== undefined) {
        let priceFiltered = await getPriceFiltered(univ, priceKeywords);
        result = opAND(result, priceFiltered); // 기본필터 && 기간필터 && 가격(보증금)필터
    }

    return result;
};

getDefaultFiltered = async univ => {
    let result;
    let defaultRef = db
        .collection(getArticlesPath(univ))
        .where("display", "==", true)
        .where("done", "==", false);

    result = await defaultRef.get().then(docs => docs.docs);

    return result;
};

getDateFiltered = async (univ, monthLimit) => {
    // 선택한 달의 마지막 날을 구한다
    let lastDay = getLastDayOfMonth(monthLimit);

    // 선택한 달이랑 지금이랑 몇달 차이나는지 구한다
    let dateDiff = getMonthDiff(monthLimit);

    return await Promise.all([
        db
            .collection(getArticlesPath(univ))
            .where("endDate", "<=", lastDay)
            .get(),
        db
            .collection(getArticlesPath(univ))
            .where("minTerm", "<=", dateDiff)
            .get(),
    ]).then(result => opOR(result.map(docs => docs.docs)));
};

getPriceFiltered = async (univ, priceKeywords) => {
    return await db
        .collection(getArticlesPath(univ))
        .where("deposit", "<=", 100)
        .get()
        .then(docs => docs.docs);
};

getLastDayOfMonth = selectedDate => {
    let currentDate = new Date();
    let month = parseInt(selectedDate);
    let year = currentDate.getMonth() > month ? currentDate.getFullYear() + 1 : currentDate.getFullYear();

    return new Date(year, month, 0);
};

getMonthDiff = selectedDate => {
    let lastDay = getLastDayOfMonth(selectedDate);
    let timeStampDiff = lastDay - new Date();

    if (timeStampDiff < 0) return 0;
    else return parseInt(timeStampDiff / (3600 * 24 * 30 * 1000));
};

opAND = (arr1, arr2) => {
    let result = arr1.filter(doc => {
        let id = doc.id;
        for (doc of arr2) if (doc.id === id) return true;
        return false;
    });
    return result;
};

opOR = arrays => {
    let result = arrays.reduce((res, cur) => {
        if (cur.length > 0) return [...res, ...cur];
        else return res;
    }, []);
    return result;
};

formatRoomList = arr => {
    var result = arr;

    // 일단 등록시간순으로 정렬
    result.sort((a, b) => {
        return b.createdAt.toMillis() - a.createdAt.toMillis();
    });

    // 화면에 보여질 정보로 포맷을 맞춘다
    result = result.map(doc => {
        return {
            dateKeywords: formatDateKeywords(doc), // array
            discountKeywords: formatDiscout(doc), // array
            tradeType: doc.tradeType, // string or null
            deposit: formatDeposit(doc), // string
            price: formatPrice(doc), // string
            line1: formatLine1(doc), // string
            line2: formatLine2(doc), // string
            keywords: formatKeywords(doc), // array
            imageURL: formatImageURL(doc), // string or null
            urlType: doc.urlType, // string or null
            timeStamp: doc.createdAt.toMillis(), // string
            views: doc.views, // string
            url: doc.url,
            new: formatNewArticle(doc), // boolean
            thumbnail: doc.thumbnail,
        };
    });

    return result;
};

addAd = arr => {
    // 길이가 5 이상이면 '이런방구해요'광고를 넣어준다
    if (arr.length > 4) arr.splice(5, 0, { ad: true });

    return arr;
};

formatDate = date => {
    if (date === null) return "";
    let dateObj = date.toDate();
    let y = dateObj.getFullYear();
    let m = dateObj.getMonth() + 1;
    let d = dateObj.getDate();
    return `${m}월 ${d}일`;
};
formatDateKeywords = doc => {
    result = [];
    if (doc.minTerm !== null) result.push(`${doc.minTerm}개월이상`);

    if (doc.startDate !== null || doc.endDate !== null) result.push(`${formatDate(doc.startDate)}~${formatDate(doc.endDate)}`);

    return result;
};
formatDiscout = doc => {
    if (doc.discountKeywords === null) return [];
    else return Object.keys(doc.discountKeywords);
};
formatDeposit = doc => {
    if (doc.deposit === null) return "문의";
    else return `${doc.deposit}`;
};
formatPrice = doc => {
    if (doc.price === null) return "문의";
    else return `${doc.price}`;
};
formatLine1 = doc => {
    if (doc.locationS === null) return "";
    else return Object.keys(doc.locationS).join(" ");
};
formatLine2 = doc => {
    let arr = [];
    if (doc.floor !== null) arr.push((doc.floor === -1 ? "반지" : doc.floor) + "층");
    if (doc.expense !== null) arr.push(`관리비 ${doc.expense}만원`);
    return arr.join(" | ");
};
formatKeywords = doc => {
    let arr = [];
    if (doc.keywords !== null) arr = Object.keys(doc.keywords);
    if (doc.only !== null) arr = arr.concat(Object.keys(doc.only));
    return arr;
};
formatImageURL = doc => {
    if (doc.images === null) return null;
    else return doc.images[0];
};
formatNewArticle = doc => {
    if (doc.createdAt === null) return false;
    let today = new Date();
    let date3DaysAgo = today.setDate(today.getDate() - 3);
    let createdAt = doc.createdAt.toDate();
    if (createdAt > date3DaysAgo) return true;
    else return false;
};

router.get("/read/:univ/:articleNo", async (req, res, next) => {
    var univ = req.params.univ;
    var articleNo = req.params.articleNo;
    var ignoreDone = req.query.v; //쿼리스트링을 서용해서 done에 상관없이 상세페이지가 보이도록 한다.
    var kakao = {}; // 카카오로 공유하기 했을 때 전달될 정보
    var data; // 상세페이지에서 보여질 매물정보
    var related = []; // 관련 매물 정보
    var docRef = db.doc(`${getArticlesPath(univ)}/${articleNo}`);
    let thumbnails;
    let univKo = PLACE_OBJ[univ];

    let doc = await docRef.get();

    if (!doc.exists) {
        // 문서 존재하지 않음
        return next(createError(404));
    }

    data = doc.data();

    // 카카오톡 공유하기 했을 때 공유될 정보 저장
    kakao = getKaKaoShareObject(data);

    // 썸네일 받아오기
    thumbnails = await model.getThumbnail(doc);

    // 썸네일 존재하면 썸네일로 이미지 교체
    if (thumbnails) {
        data.images = [];
        thumbnails.forEach(thumb => data.images.push(thumb[600]));
    }

    // 최신 매물을 4개 가져온다
    related = await db
        .collection(getArticlesPath(univ))
        .where("display", "==", true)
        .where("done", "==", false)
        .orderBy("createdAt", "desc")
        .limit(4)
        .get();

    // 가져온 최신 매물 4개 중에 현재 조회할 매물이 포함되있으면 제거한다
    let filtered = related.docs.filter(doc => doc.id !== articleNo);

    if (filtered.length === 4) filtered.pop();

    // 관련매물 정보를 배열에 담아 저장한다
    related = getRelatedArray(filtered);

    if (data.done !== true || ignoreDone !== undefined) {
        // 거래 완료되지 않은 케이스 : 상세페이지가 보여진다

        // 조회수 1 증가
        viewIncrement(docRef);

        done = false;
    } else {
        // 거래 완료됨 : 상세페이지 + 거래완료 표시
        done = true;
    }

    return res.render("articleDetail", { univ, univKo, articleNo, data, kakao, related, done });
});

getRelatedArray = arr => {
    let resultArray = arr.map(doc => {
        let d = doc.data();
        return {
            url: `${d.url}`,
            img: `${d.images ? d.images[0] : ""}`,
            line1: `${d.locationS ? Object.keys(d.locationS).join(" ") : ""}`,
            line2: `${
                d.startDate !== null || d.endDate !== null
                    ? (d.startDate ? new Date(d.startDate.toMillis()).toLocaleDateString() : "") +
                      " ~ " +
                      (d.endDate ? new Date(d.endDate.toMillis()).toLocaleDateString() : "")
                    : ""
            } ${d.minTerm ? d.minTerm + "개월 이상" : ""}`,
            line3: `${d.deposit ? "보" + d.deposit : ""} ${d.price ? "월" + d.price : ""}`,
        };
    });
    return resultArray;
};

getKaKaoShareObject = data => {
    let title = data.title || "방단기에 좋은 방이 있어요!";
    let description = `${data.locationS ? Object.keys(data.locationS).join(" ") : ""} ${data.deposit || "문의"}/${data.price || "문의"}`;
    let imageUrl = data.images
        ? data.images[0]
        : "https://firebasestorage.googleapis.com/v0/b/bangdangi.appspot.com/o/kakao_share.jpg?alt=media&token=248d577e-16c5-4e74-a64f-2e2413032421";
    let link = data.url || "https://bangdangi.web.app";
    return { title, description, imageUrl, link };
};

function viewIncrement(docRef) {
    return admin.firestore().runTransaction(transaction => {
        return transaction.get(docRef).then(doc => {
            // 조회수 1 증가
            let newViews = doc.data().views + 1;
            transaction.update(docRef, { views: newViews });
            return Promise.resolve(newViews);
        });
    });
}

router.get("/create", /* sessionHandler.checkSession, */ (req, res, next) => {
    // console.log(req.decodedClaims);
    // console.log(req.query.referrer);

    return res.render("create");
});

router.post("/create_process", util.fileParser, async (req, res, next) => {
    var title = req.body.title || null;
    var roadFullAddr = req.body.roadFullAddr || null;
    var roadAddrPart = req.body.roadAddrPart || null;
    var addrDetail = req.body.addrDetail || null;
    var siNm = req.body.siNm || null;
    var sggNm = req.body.sggNm || null;
    var emdNm = req.body.emdNm || null;
    var roadNm = req.body.roadNm || null;
    var buldNo = req.body.buldNo || null;
    var coords = req.body.coords || null;
    var locationS = req.body.locationS || null;
    var price = parseFloat(req.body.price) || null;
    var deposit = parseFloat(req.body.deposit) || null;
    var expense = parseFloat(req.body.expense) || null;
    var startDate = req.body.startDate || null;
    var endDate = req.body.endDate || null;
    var discountKewords = req.body.discountKewords || null;
    var dateKeywords = req.body.dateKeywords || null;
    var keywords = req.body.keywords || null;
    var only = req.body.only || null;
    var floor = parseFloat(req.body.floor) || null;
    var tradeType = req.body.tradeType || null;
    var text = req.body.text || null;
    var contact = req.body.contact || null;
    var univ = req.body.univ;

    var sessionCookie = req.cookies.__session || "";
    var files = req.files;

    try {

        // TODO: 세션쿠키 검사
        // return admin.auth().verifySessionCookie(sessionCookie, true)
        //     .then((decodedClaims) => {

        // TODO: 필드 검사 ?

        // 매물 id 생성
        // TODO: 지역 받아오기
        const id = db.collection("test").doc().id;

        // file upload 스트림을 처리하는 promise들을 담을 배열
        var tasks = [];

        // 스토리지에 사진 저장 -> resolve url
        for (name in files) {
            // file object
            const image = files[name];

            // upload promise
            const task = storageHandler.upload(image, `${id}/${image.filename}`)

            tasks.push(task);
        }

        // promise는 액세스 url을 resolve
        const images = await Promise.all(tasks);

        // 매물 등록
        // TODO: 데이터 넘겨주기
        await model.addArticle("test", id, { title, images });
        
        // 유저 정보에 등록한 매물 추가
        await db.collection('/users').doc(uid).update({
            articles: admin.firestore.FieldValue.arrayUnion('new value'),
        })

        // TODO: 완료되면, 상세페이지로 redirect
        return res.send("OK");
    }
    catch (err) {
        return next(createError(500, err));
    }
});

module.exports = router;
