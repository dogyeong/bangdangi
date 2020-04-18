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
const PLACE_OBJ = model.PLACE_OBJ;
const getArticlesPath = model.getArticlesPath;

router.get("/list/:place", async (req, res, next) => {
    const user = req.decodedClaims;
    const place = req.params.place;
    const monthLimit = req.query.monthLimit;
    const priceKeywords = req.query.priceKeywords;
    let resultArr = [];
    let review = [];
    let thumbnails;

    // 필터가 적용된 매물 리스트를 가져온다
    // resultArr = await getFilteredArticleList(univ, monthLimit, priceKeywords);

    // 매물 리스트의 썸네일을 가져온다
    // thumbnails = await Promise.all(resultArr.map(doc => model.getThumbnail(doc)));

    // 매물 리스트와 썸네일을 합친다
    // resultArr = resultArr.map((doc, idx) => {
    //     return {
    //         ...doc.data(),
    //         thumbnail: thumbnails[idx],
    //     };
    // });

    // 매물 리스트 가져온다
    resultArr = await model
        .getArticles(place, {
            display: true, 
            done: false, 
            sortBy: 'createdAt'
        })

    // 매물 리스트 데이터 포맷팅
    resultArr = formatRoomList(resultArr);

    // 거래완료된 매물중에 리뷰가 있는 매물들을 가져온다
    // review = await model.getReviews(univ, 0);
    // review = formatRoomList(review.map(r => r.data()));

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
    let placeKo = PLACE_OBJ[place];
    
    let filterOption = {
        date: monthLimit,
        price: priceKeywords,
    };

    return res.render("articleList", { roomList, review, place, placeKo, filterOption, err, user });
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
            id: doc.id,
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
    let arr = []
    doc.sggNm ? arr.push(doc.sggNm) : '';
    doc.emdNm ? arr.push(doc.emdNm) : '';
    return arr.join(" ");
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

router.get("/read/:place/:articleId", async (req, res, next) => {
    const user = req.decodedClaims;
    const place = req.params.place;
    const placeKo = PLACE_OBJ[place];
    const articleId = req.params.articleId;
    let kakao = {}; // 카카오로 공유하기 했을 때 전달될 정보
    let data; // 상세페이지에서 보여질 매물정보
    let related = []; // 관련 매물 정보
    let done = false;
    
    // 매물데이터 받기
    data = await model.getArticleWithId(articleId);

    if (data === null) {
        return createError(404, "찾는 매물이 없습니다");
    }

    // 카카오톡 공유하기 했을 때 공유될 정보 저장
    kakao = getKaKaoShareObject(data);

    // TODO
    // 최신 매물을 4개 가져온다
    // 가져온 최신 매물 4개 중에 현재 조회할 매물이 포함되있으면 제거한다
    // 관련매물 정보를 배열에 담아 저장한다

    if (data.done !== true) { // 거래 완료되지 않은 케이스 : 상세페이지가 보여진다
        model.viewIncrement(articleId); // 조회수 1 증가
    } else { // 거래 완료됨 : 상세페이지 + 거래완료 표시
        done = true;
    }

    return res.render("articleDetail", { place, placeKo, articleId, data, kakao, related, done, user });
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



router.get("/create", (req, res, next) => {
    const user = req.decodedClaims;

    // 로그인 안했으면 로그인페이지로 라디이렉션
    if(!user) {
        return res.redirect('/user/login'); 
    }

    return res.render("create", { user });
});

router.post("/create_process", util.fileParser, (req, res, next) => {
    let { 
        roadFullAddr = null,
        roadAddrPart = null,
        addrDetail = null,
        siNm = null,
        sggNm = null,
        emdNm = null,
        roadNm = null,
        buldNo = null,
        price = null,
        deposit = null,
        expense = null,
        startDate = null,
        endDate = null,
        minTerm = null,
        only = null,
        tradeType = null,
        text = null,
        contact = null,
        termType = null,
    } = req.body;

    var files = req.files;

    // 데이터 타입 검사해서 알맞게 변환
    startDate = startDate && new Date(startDate);
    endDate = endDate && new Date(endDate);
    minTerm = minTerm && parseInt(minTerm);
    price = price && parseInt(price);
    expense = expense && parseInt(expense);
    deposit = deposit && parseInt(deposit);

    // 세션쿠키(로그인) 검사
    const decodedClaims = req.decodedClaims;
    if (!decodedClaims) return res.redirect('/user/login');

    // 로그인한 유저를 작성자로 설정
    const creator = decodedClaims.uid;
    
    // 필드들을 객체에 저장
    let data = {
        roadFullAddr, roadAddrPart, addrDetail, siNm, sggNm, emdNm, roadNm, buldNo, price, deposit, expense, startDate, endDate, minTerm, only, tradeType, text, contact,
        creator,
    }

    // 매물 추가 // data, files, id
    return model.addArticle(data, files)
        .then(id => {
            if (id) {
                console.log(id);
                return res.redirect('/');
            }
            else {
                return createError(500);
            }
        })
        .catch(err => {
            console.error(err);
            return createError(500);
        })
});

router.get("/delete_process", (req, res) => {
    
    try {
        const user = req.decodedClaims;
    
        if (!user) {
            return res.redirect("/");
        }

        console.log(user.uid);

        return res.redirect("/");

        // await model.deleteArticle()

        
    }
    catch(err) {
        console.error(err);
        return createError(500);
    }
    
})

module.exports = router;
