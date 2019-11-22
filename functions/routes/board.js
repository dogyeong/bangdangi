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
const UNIV_OBJ = {
    pnu: '부산, 부산대',
    cnu: '대전, 충남대',
    mafo: '서울 마포구,서대문구',
    seongdong: '서울 성동구',
    gwanak: '서울 관악구',
    dongdaemun: '서울 동대문구',
}

router.get('/list/:univ', async (req, res, next) => {  
    const univ = req.params.univ;
    const locationKeywords = req.query.locationKeywords;
    const monthLimit = req.query.monthLimit;
    const priceKeywords = req.query.priceKeywords;
    let keywordList;
    let resultArr = [];

    // 선택한 지역의 장소 키워드 리스트를 가져온다
    keywordList = await getKeywordList(univ);
    // 필터가 적용된 매물 리스트를 가져온다
    resultArr = await getFilteredArticleList(univ, locationKeywords, monthLimit, priceKeywords);
    
    let err = false;
    let roomList;
    if (resultArr.length > 0) { // 결과 존재
        roomList = formatRoomList(resultArr);
    }
    else { // 결과 없음
        roomList = resultArr;
        err = '매물이 존재하지 않습니다';
    }   
    let univKo = UNIV_OBJ[univ];
    let filterOption = { 
        location: locationKeywords,
        date: monthLimit,
        price: priceKeywords
     }
    return res.render('articleList', { roomList, keywordList, univ, univKo, filterOption, err });
});

getKeywordList = async (univ) => {
    return await db.doc(`article/keywords/${univ}/locationKeywords`).get()
        .then(doc => { // 불러온 태그들을 저장한다
            if (doc.exists) {
                return doc.data().keywords;
            }
            else {
                return []; 
            }
        });
}

getFilteredArticleList = async (univ, locationKeywords, monthLimit, priceKeywords) => {   
    let result = await getLocationFiltered(univ, locationKeywords); // 장소 필터가 적용된 매물들을 불러온다

    if (monthLimit !== undefined) {
        let dateFiltered = await getDateFilterd(univ, monthLimit);  
        result = opAND(result, dateFiltered); // 장소필터 && 기간필터    
    }
    
    if (priceKeywords !== undefined) {
        let priceFiltered = await getPriceFiltered(univ, priceKeywords); 
        result = opAND(result, priceFiltered); // 장소필터 && 기간필터 && 가격(보증금)필터
    }

    return result;
}

getLocationFiltered = async (univ, locationKeywords) => {
    let result;
    let defaultRef = db.collection(`article/live/${univ}`).where('display','==',true).where('done','==',false);
    
    if (locationKeywords === undefined) {
        result = await defaultRef.get().then(docs => docs.docs);
    } 
    else {
        let queryArr = [];
        for (kwd of locationKeywords) 
            queryArr.push(defaultRef.where(`locationL.${kwd}`, '==', true).get());
        result = await Promise.all(queryArr)
            .then(result => opOR(result.map(docs => docs.docs)));
    }
    return result;
}

getDateFilterd = async (univ, monthLimit) => {
    // 선택한 달의 마지막 날을 구한다
    let lastDay = getLastDayOfMonth(monthLimit);

    // 선택한 달이랑 지금이랑 몇달 차이나는지 구한다
    let dateDiff = getMonthDiff(monthLimit);

    return await Promise.all([
            db.collection(`article/live/${univ}`).where('endDate', '<=', lastDay).get(),
            db.collection(`article/live/${univ}`).where('minTerm', '<=', dateDiff).get()  
        ])
        .then(result => opOR(result.map(docs => docs.docs)));
}

getPriceFiltered = async (univ, priceKeywords) => {
    return await db.collection(`article/live/${univ}`).where('deposit', '<=', 100).get()
        .then(docs => docs.docs);
}

getLastDayOfMonth = (selectedDate) => {
    let currentDate = new Date();
    let month = parseInt(selectedDate);
    let year = (currentDate.getMonth() > month) ? currentDate.getFullYear()+1 : currentDate.getFullYear();

    return new Date(year, month, 0);
}

getMonthDiff = (selectedDate) => {
    let lastDay = getLastDayOfMonth(selectedDate);
    let timeStampDiff = lastDay - new Date();

    if (timeStampDiff < 0) 
        return 0; 
    else 
        return parseInt( timeStampDiff / (3600 * 24 * 30 * 1000) );
}

opAND = (arr1, arr2) => {
    let result = arr1.filter(doc => {
        let id = doc.id;
        for (doc of arr2) 
            if (doc.id === id) return true;
        return false;
    });  
    return result;
}

opOR = (arrays) => {
    let result = arrays.reduce((res, cur) => {
        if (cur.length > 0)
            return [...res, ...cur];
        else   
            return res;
    }, []);
    return result;
}

formatRoomList = (arr) => {
    var result = arr.map((doc) => doc.data());
    // 일단 등록시간순으로 정렬
    result.sort((a,b) => {
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
            new: formatNewArticle(doc) // boolean
        }
    });
    // 길이가 5 이상이면 '이런방구해요'광고를 넣어준다
    if (result.length > 4) 
        result.splice(5, 0, { ad: true });
    return result;
}
formatDate = (date) => {
    if (date === null) 
        return '';
    let dateObj = date.toDate();
    let y = dateObj.getFullYear();
    let m = dateObj.getMonth() + 1;
    let d = dateObj.getDate();
    return `${m}월 ${d}일`;
}
formatDateKeywords = (doc) => {
    result = [];
    if (doc.minTerm !== null) 
        result.push(`${doc.minTerm}개월이상`);

    if (doc.startDate !== null || doc.endDate !== null)
        result.push(`${formatDate(doc.startDate)}~${formatDate(doc.endDate)}`);
     
    return result;
}
formatDiscout = (doc) => {
    if (doc.discountKeywords === null) 
        return [];
    else 
        return Object.keys(doc.discountKeywords);
}
formatDeposit = (doc) => {
    if (doc.deposit === null)
        return '문의';
    else
        return `${doc.deposit}`
}
formatPrice = (doc) => {
    if (doc.price === null)
        return '문의';
    else
        return `${doc.price}`
}
formatLine1 = (doc) => {
    if (doc.locationS === null)
        return '';
    else
        return Object.keys(doc.locationS).join(' ')
}
formatLine2 = (doc) => {
    let arr = [];
    if (doc.roomType !== null) 
        arr.push(doc.roomType);
    if (doc.floor !== null)
        arr.push(doc.floor+'층');
    if (doc.expense !== null)
        arr.push(`관리비 ${doc.expense}만원`);
    return arr.join(' | ');
}
formatKeywords = (doc) => {
    let arr = [];
    if (doc.keywords !== null)
        arr = Object.keys(doc.keywords);
    if (doc.pic !== null)
        arr.push('사진O');
    if (doc.only !== null)
        arr = arr.concat( Object.keys(doc.only) );
    return arr;
}
formatImageURL = (doc) => {
    if (doc.images === null)
        return null;
    else
        return doc.images[0];
}
formatNewArticle = (doc) => {
    if (doc.createdAt === null)
        return false;
    let today = new Date();
    let date3DaysAgo = today.setDate( today.getDate()-3 );
    let createdAt = doc.createdAt.toDate();
    if (createdAt > date3DaysAgo)
        return true;
    else
        return false;
}

router.get('/read/:univ/:articleNo', (req, res, next) => {
    var univ = req.params.univ;
    var articleNo = req.params.articleNo;
    var ignoreDone = req.query.v; //쿼리스트링을 서용해서 done에 상관없이 상세페이지가 보이도록 한다.
    var kakao = {}; // 카카오로 공유하기 했을 때 전달될 정보
    var data; // 상세페이지에서 보여질 매물정보
    var related = []; // 관련 매물 정보
    var docRef = db.doc(`article/live/${univ}/${articleNo}`);

    docRef.get()
    .then((doc) => {
        if (doc.exists) { // 문서 존재함
            data = doc.data();
            // 카카오톡 공유하기 했을 때 공유될 정보 저장
            kakao = getKaKaoShareObject(data);
            // 최신 매물을 4개 가져온다
            return db.collection(`article/live/${univ}`)
                .where('display', '==', true).where('done', '==', false)
                .orderBy('createdAt', 'desc').limit(4).get();
        }
        else {
            // 문서 존재하지 않음
           return next(createError(404));
        }
    })
    .then((docs) => {
        // 가져온 최신 매물 4개 중에 현재 조회할 매물이 포함되있으면 제거한다
        let filtered = docs.docs.filter(doc => doc.id !== articleNo);
        if (filtered.length === 4) filtered.pop();
        // 관련매물 정보를 배열에 담아 저장한다
        related = getRelatedArray(filtered);

        if (data.done !== true || ignoreDone !== undefined) { 
            // 거래 완료되지 않은 케이스 : 상세페이지가 보여진다
            return viewIncrement(docRef); // 조회수 1 증가
        }
        else { 
            // 거래 완료됨 : 상세페이지 + 거래완료 표시
            return true;
        }
    })
    .then((newViews) => {
        let univKo = UNIV_OBJ[univ];
        let done = false
        if (newViews === true) // true면 거래완료된 상태
            done = true;

        return res.render('articleDetail', { univ, univKo, articleNo, data, kakao, related, done });
    })
    .catch((err) => {
        console.log(err);
        return next(createError(500));
    })
});

getRelatedArray = (arr) => {
    let resultArray = arr.map(doc => {
        let d = doc.data();
        return {
            'url': `${d.url}`,
            'img': `${d.images ? d.images[0] : ''}`,
            'line1': `${d.dateKeywords ? Object.keys(d.dateKeywords)[0] : ''} ${d.locationL ? Object.keys(d.locationL).join(' '): ''}`,
            'line2': `${d.deposit ? '보'+d.deposit : ''} ${d.price ? '월'+d.price : ''}`,
        };
    });
    return resultArray;
}

getKaKaoShareObject = (data) => {
    let title = data.title || '방단기에 좋은 방이 있어요!';
    let description = `${data.locationL ? Object.keys(data.locationL).join(' ') : ''} ${data.locationS ? Object.keys(data.locationS).join(' ') : ''} ${data.deposit || '문의'}/${data.price || '문의'}`;
    let imageUrl = data.images ? data.images[0] : 'https://firebasestorage.googleapis.com/v0/b/bangdangi.appspot.com/o/kakao_share.jpg?alt=media&token=248d577e-16c5-4e74-a64f-2e2413032421';
    let link = data.url || 'https://bangdangi.web.app';
    return { title, description, imageUrl, link };
}

function viewIncrement(docRef) {
    return admin.firestore().runTransaction((transaction) => {
        return transaction.get(docRef)
        .then((doc) => {
            // 조회수 1 증가
            let newViews = doc.data().views + 1;
            transaction.update(docRef, { views: newViews });
            return Promise.resolve(newViews);
        });
    })
}

router.get('/create', (req, res, next) => {
    console.log(req.query.referrer);
    // 세션 쿠키 받기
    var sessionCookie = req.cookies.__session || '';
    // 학교 받기
    var univ = req.query.univ || '';
    // 학교 검사
    if(univ === '') res.redirect('../user/login?referrer=board/create'); 

    // 키워드 받기
    var keywords = [];
    return admin.firestore().doc(`article/keywords/${univ}/locationKeywords`).get()
        .then(doc => {
            keywords = doc.data().keywords;
            // 세션쿠키 검사
            return admin.auth().verifySessionCookie(sessionCookie, true /** check if revoked. */)
        })
        .then(decodedClaims => {
            // 유효한 세션이면 매물등록 페이지 렌더링
            return res.render('create', { uid: decodedClaims.uid, univ, keywords });
        }).catch((error) => {
            console.log(error);
            // 유효하지 않으면 로그인 페이지 렌더링
            res.redirect('../user/login'); 
        });
});

router.post('/create_process', (req, res, next) => {
    var title = req.body.title || null;
    var text = req.body.text || null;
    var tradeType = req.body.tradeType || null;
    var price = parseFloat(req.body.price) || null;
    var deposit = parseFloat(req.body.deposit) || null;
    var expense = parseFloat(req.body.expense) || null;
    var contact = req.body.contact || null;
    var roomType = req.body.roomType || null;
    var floor = parseFloat(req.body.floor) || null;
    var univ = req.body.univ;
    var sessionCookie = req.cookies.__session || '';

    // 세션쿠키 검사
    return admin.auth().verifySessionCookie(sessionCookie, true /** check if revoked. */)
        .then((decodedClaims) => {
            // 매물데이터 DB에 저장
            return db.collection(`article/live/${univ}`)
            .add({
                createdAt: new Date(), 
                writer: decodedClaims.uid,
                title,
                text,
                tradeType,
                price,
                deposit,
                expense,
                contact,
                roomType,
                floor,
                urlType: 'bangdangi',
                display: true,
                done: false,
                images: null,
                pic: false,
                locationL: null,
                locationS: null,
                startDate: null,
                endDate: null,
            })
        })
        .then(async ref => {
                await db.doc(`article/live/${univ}/${ref.id}`).update({ url: `https://bangdangi.web.app/board/read/${univ}/${ref.id}` });
                return res.redirect(`/board/read/${univ}/${ref.id}`);
        })
        .catch((error) => {
            console.log(error);
            // 유효하지 않으면 로그인 페이지 렌더링
            res.redirect('../user/login'); 
        });
})

module.exports = router;