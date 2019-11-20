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
const UNIV_OBJ = {
    pnu: '부산, 부산대',
    cnu: '대전, 충남대',
    mafo: '서울 마포구,서대문구',
    seongdong: '서울 성동구',
    gwanak: '서울 관악구',
    dongdaemun: '서울 동대문구',
}

router.get('/list/:univ', (req, res, next) => {  
    var univ = req.params.univ;
    var db = admin.firestore();
    var selectedLocation = req.query.locationKeywords;
    var selectedDate = req.query.dateKeywords;

    var err = false;
    var dateKeywords = [];
    var discountKeywords = [];
    var locationKeywords = [];
    var keywords;
    var queryArr = [];
    var resultArr = [];

    var ref = db.collection(`article/live/${univ}`)
        .where('display','==',true).where('done','==',false);
    
    if (selectedLocation !== undefined) { 
        if (selectedDate !== undefined) { // 장소, 기간 둘 다 선택한 경우
            for (kwd of selectedLocation) {
                let lRef = ref.where(`locationL.${kwd}`, '==', true);
                for (kwd of selectedDate) queryArr.push(lRef.where(`dateKeywords.${kwd}`, '==', true).get());
            }
        }
        else // 장소 키워드만 선택한 경우 
            for (kwd of selectedLocation) queryArr.push(ref.where(`locationL.${kwd}`, '==', true).get());
    } 
    else {
        if (selectedDate !== undefined) // 기간 키워드만 선택한 경우
            for (kwd of selectedDate) queryArr.push(ref.where(`dateKeywords.${kwd}`, '==', true).get());
            
        else // 선택된 태그가 없으면 전부다 불러온다
            queryArr.push(ref.get());    
    }

    Promise.all(queryArr)
    .then(res => { // resolve된 결과배열들을 다 합친다
        return res.reduce((result, current) => { 
            if (current.docs !== undefined) return result.concat(current.docs); 
            else return result; 
        }, []);
    })
    .then((arr) => { // 합쳐진 배열에서 중복된 원소들을 제거한다
        return arr.reduce((result, current) => {
            id = current.id;
            if (result.findIndex((doc) => doc.id === id) < 0) result.push(current);
            return result;
        }, []);
    })
    .then(arr => { // 결과 배열을 저장하고, 태그들을 불러온다
        resultArr = arr;
        return db.collection(`article/keywords/${univ}`).get();
    })
    .then(keywordLists => { // 불러온 태그들을 저장한다
        keywordLists.forEach((keywordList) => {
            if (keywordList.id === 'dateKeywords') { 
                dateKeywords = keywordList.data().keywords || [];
            }    
            else if (keywordList.id === 'discountKeywords') { 
                discountKeywords = keywordList.data().keywords || [];
            }
            else if (keywordList.id === 'locationKeywords') { 
                locationKeywords = keywordList.data().keywords || [];
            }  
        })
        keywords = { dateKeywords, discountKeywords, locationKeywords };
        return null;
    })
    .then(() => {
        var roomList = [];
        if (resultArr.length > 0) { // 결과 존재
            roomList = getRoomList(resultArr);
        }
        else { // 결과 없음
            roomList = resultArr;
            err = '매물이 존재하지 않습니다';
            console.log(roomList);
        }   
        let univKo = UNIV_OBJ[univ];
        return res.render('articleList', { roomList, keywords, univ, univKo, selectedLocation, selectedDate, err });
    })
    .catch(err => {
        console.log(err);
        return next(createError(500));
    })
});
getRoomList = (arr) => {
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
    var db = admin.firestore();
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
    var db = admin.firestore();
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