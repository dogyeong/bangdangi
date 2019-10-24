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
    
    // 선택된 태그가 없으면 전부다 불러온다
    if (selectedLocation === undefined && selectedDate === undefined) {
        queryArr.push(ref.get());
    }
    if (selectedLocation !== undefined) { // 위치 키워드 필터링
        for (kwd of selectedLocation) queryArr.push(ref.where(`locationL.${kwd}`, '==', true).get());
    }
    if (selectedDate !== undefined) { // 기간 키워드 필터링
        for (kwd of selectedDate) queryArr.push(ref.where(`dateKeywords.${kwd}`, '==', true).get());
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
        if (resultArr !== []) { // 결과 존재
            var roomList = resultArr.map((doc) => doc.data());
            roomList.sort((a,b) => {
                return b.createdAt.toMillis() - a.createdAt.toMillis();
            });
            return res.render('articleList', { roomList, keywords, univ, selectedLocation, selectedDate, err });
        }
        else { // 결과 없음
            err = '결과가 존재하지 않습니다.';
            return res.render('articleList', { keywords, univ, selectedLocation, selectedDate, err });
        }    
    })
    .catch(err => {
        console.log(err);
        return next(createError(500));
    })
});

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
        if (doc.exists) {   
            // 문서 존재함
            data = doc.data();
            if (data.done !== true || ignoreDone !== undefined) { 
                // 거래 완료되지 않은 케이스 : 상세페이지가 보여진다
                // 카카오톡 공유하기 했을 때 공유될 정보
                let title = data.title || '방단기에 좋은 방이 있어요!';
                let description = `${data.locationL ? Object.keys(data.locationL).join(' ') : ''} ${data.locationS ? Object.keys(data.locationS).join(' ') : ''} ${data.deposit || '문의'}/${data.price || '문의'}`;
                let imageUrl = data.images ? data.images[0] : 'https://firebasestorage.googleapis.com/v0/b/bangdangi.appspot.com/o/kakao_share.jpg?alt=media&token=248d577e-16c5-4e74-a64f-2e2413032421';
                let link = data.url || 'https://bangdangi.web.app';
                kakao = { title, description, imageUrl, link };

                return db.collection(`article/live/${univ}`)
                    .where('display', '==', true).where('done', '==', false)
                    .orderBy('createdAt', 'desc').limit(4).get();
            }
            else { 
                // 거래 완료됨
                return res.render('articleDone', { univ });
            }
        }
        else {
            // 문서 존재하지 않음
           return next(createError(404));
        }
    })
    .then((docs) => {
        let filtered = docs.docs.filter(doc => doc.id !== articleNo);
        if (filtered.length === 4) filtered.pop();
        filtered.forEach(doc => {
            let d = doc.data();
            related.push({
                'url': `${d.url}`,
                'img': `${d.images ? d.images[0] : ''}`,
                'line1': `${d.dateKeywords ? Object.keys(d.dateKeywords)[0] : ''} ${d.locationL ? Object.keys(d.locationL).join(' '): ''}`,
                'line2': `${d.deposit ? '보'+d.deposit : ''} ${d.price ? '월'+d.price : ''}`,
            });
        });
       return viewIncrement(docRef);
    })
    .then((newViews) => {
        console.log("views: " + newViews);
        return res.render('articleDetail', { univ, articleNo, data, kakao, related });
    })
    .catch((err) => {
        console.log(err);
        return next(createError(500));
    })
});

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
    // 세션 쿠키 받기
    var sessionCookie = req.cookies.__session || '';
    // 학교 받기
    var univ = req.query.univ;

    // 세션쿠키 검사
    return admin.auth().verifySessionCookie(sessionCookie, true /** check if revoked. */)
        .then((decodedClaims) => {
            // 유효한 세션이면 매물등록 페이지 렌더링
            return res.render('create', { uid: decodedClaims.uid, univ });
        }).catch((error) => {
            console.log(error);
            // 유효하지 않으면 로그인 페이지 렌더링
            res.redirect('../user/login'); 
        });
});

router.post('/create_process', (req, res, next) => {
    var db = admin.firestore();
    var title = req.body.title;
    var text = req.body.text;
    var tradeType = req.body.tradeType;
    var price = parseFloat(req.body.price);
    var deposit = parseFloat(req.body.deposit);
    var expense = parseFloat(req.body.expense);
    var contact = (req.body.contact);
    var roomType = req.body.roomType;
    var totalFloor = parseFloat(req.body.totalFloor);
    var floor = parseFloat(req.body.floor);
    var univ = req.body.univ;
    var sessionCookie = req.cookies.__session || '';

    // 세션쿠키 검사
    return admin.auth().verifySessionCookie(sessionCookie, true /** check if revoked. */)
        .then((decodedClaims) => {
            // 매물데이터 DB에 저장
            return db.collection(`article/live/${univ}`)
            .add({
                createdAt: new Date(), 
                weiter: decodedClaims.uid,
                title,
                text,
                tradeType,
                price,
                deposit,
                expense,
                contact,
                roomType,
                totalFloor,
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
        .then(async (ref) => {
                await db.doc(`article/live/${univ}/${ref.id}`).update({ url: `https://bangdangi.web.app/board/read/${univ}/${ref.id}` });
                return res.redirect(`/read/${univ}/${ref.id}`);
         })
        .catch((error) => {
            console.log(error);
            // 유효하지 않으면 로그인 페이지 렌더링
            res.redirect('../user/login'); 
        });
})

module.exports = router;