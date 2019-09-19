const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const createError = require('http-errors');
const url = require('url');
const cors = require('cors')({
    origin: true
});
/*
router.get('/list/:univ', (req, res, next) => {
    var univ = req.params.univ;
    var db = admin.database();

    db.ref('/article/' + univ).once('value', (snapshot) => {
        var data = snapshot.val();
        if (data === null) {
            return next(createError(404));
        }
        else {
            var locationHashtagList = [];
            var dateHashtagList = [];
            var roomList = [];
            var univ = req.params.univ;
            
            for (key in data) {
                // 장소만 따로 해시태그리스트에 추가로 저장한다
                if (data[key]['locationL'] !== undefined) {
                    let place = (data[key]['locationL'] || '').split(',').map((i) => i);
                    if (place !== [""]) {
                        place.forEach((i) => {
                            if (locationHashtagList.includes(i) === false) locationHashtagList.push(i);
                        });
                    }
                }
                // 날짜 키워드도 해시태그리스트에 추가한다
                if (data[key]['dateKeywords'] !== undefined) {
                    let place = (data[key]['dateKeywords'] || '').split(',').map((i) => i);
                    if (place !== [""]) {
                        place.forEach((i) => {
                            if (dateHashtagList.includes(i) === false) dateHashtagList.push(i);
                        });
                    }
                }
                
                // display가 true인 것만 리스트에 넣는다
                if(data[key]['display'] === true) {
                    // 해시태그 리스트
                    var hashtags = [];
                    var locL = (data[key]['locationL']===undefined) ? [] : data[key]['locationL'].split(',');
                    var locS = (data[key]['locationS']===undefined) ? [] : data[key]['locationS'].split(',');
                    var dKwd = (data[key]['dateKeywords']===undefined) ? [] : data[key]['dateKeywords'].split(',');
                    hashtags = hashtags.concat(locL).concat(locS).concat(dKwd);

                    // 카드뷰 설명 첫번째 줄
                    var line1 = [];
                    var period = (data[key]['startDate'] || '') + '~' + (data[key]['endDate'] || '');
                    var loc = (data[key]['locationL'] || '') + (data[key]['locationS'] || '');
                    if (loc !== '') line1.push(loc);
                    if (period !== '~') line1.push(period);
                    
                    // 카드뷰 설명 두번째 줄
                    var line2 = [];
                    data[key]['roomType']===undefined || line2.push(data[key]['roomType']);
                    data[key]['floor']===undefined || line2.push(data[key]['floor']);
                    if (data[key]['expense'] === undefined) ;
                    else if (data[key]['expense'] === '포함') line2.push(`관리비 포함`);
                    else if (data[key]['expense'] === '지원') line2.push(`관리비 지원`);
                    else if (data[key]['expense'] === '??') ;
                    else line2.push(`관리비 ${data[key]['expense']}만원`);

                    // 아이콘 이미지
                    var iconPath = '';
                    if (data[key]['urlType'] === 'everytime') iconPath = '/img/everytime_logo.png';
                    else if (data[key]['urlType'] === 'mypnu') iconPath = '/img/mypnu_logo.png';
                    else if (data[key]['urlType'] === 'peterpanz') iconPath = '/img/peterpanz_logo.png';
                    else iconPath = '/img/bangdangi_logo_2.png';
                    
                    // 카드뷰 상단 키워드 리스트
                    var upperKeywords = [];
                    data[key]['dateKeywords']===undefined || data[key]['dateKeywords'].split(',').forEach((i) => upperKeywords.push(i));
                    if (data[key]['pic']==='true' || data[key]['pic']===true) upperKeywords.push('사진O');
                    data[key]['discount']===undefined || upperKeywords.push(data[key]['discount']);

                    // 카드뷰 하단 키워드 리스트
                    var keywords = [];
                    data[key]['only']===undefined || keywords.push(data[key]['only']);
                    data[key]['keywords']===undefined || data[key]['keywords'].split(',').forEach((i) => keywords.push(i));

                    roomList.push({
                        'key': key,
                        'urlType': data[key]['urlType'],
                        'createdAt': data[key]['createdAt'] || '?',
                        'hashtag': hashtags,
                        'monthly': (data[key]['price']===undefined) ? '문의' : data[key]['price'],
                        'deposit': (data[key]['deposit']===undefined) ? '문의' : data[key]['deposit'],
                        'photo': (data[key]['pic'] === undefined ? false : true),
                        'url': data[key]['url'] || data[key]['openkakao'] || '#',
                        'images': data[key]['images'] || undefined,
                        'line1': line1.join(' | '),
                        'line2': line2.join(' | '),
                        'upperKeywords': upperKeywords,
                        'keywords': keywords,
                        'iconPath': iconPath,
                    });
                }       
              }
            // 생성일을 기준으로 정렬한다
            roomList.sort((a,b) => {
                return b['createdAt'] - a['createdAt'];
            });
            return res.render('articleList', { roomList, locationHashtagList, dateHashtagList, univ });
        }
    })
    .catch((err) => {
        console.log(err);
        return next(createError(500));
    });
});

router.get('/read/:univ/:articleNo', (req, res, next) => {
    var univ = req.params.univ;
    var articleNo = req.params.articleNo;
    var db = admin.database();

    db.ref(`article/${univ}/${articleNo}/`).once('value')
    .then((snapshot) => {
        var data = snapshot.val();
        if (data === null) {
            return next(createError(404));
        }
        else if (data['done'] === true) {
            return res.render('articleDone', { univ });
        }
        else {
            return res.render('articleDetail', { univ, articleNo, data });
        }
    })
    .catch((err) => {
        console.log(err);
        return next(createError(500));
    })
});
*/

router.get('/list/:univ', (req, res, next) => {
    var univ = req.params.univ;
    var db = admin.firestore();
    var selectedLocation = req.query.locationKeywords;
    var selectedDate = req.query.dateKeywords;

    var ref = db.collection(`article/live/${univ}`)
        .where('display','==',true).where('done','==',false);
    
    if (selectedLocation !== undefined) { // 위치 키워드 필터링
        for (kwd of selectedLocation) ref = ref.where(`locationL.${kwd}`, '==', true);
    }
    if (selectedDate !== undefined) { // 기간 키워드 필터링
        for (kwd of selectedDate) ref = ref.where(`dateKeywords.${kwd}`, '==', true);
    }
    
    ref.get()
    .then(async (docs) => {
        let err = false;
        let dateKeywords = [];
        let discountKeywords = [];
        let locationKeywords = [];
        let keywords;
        var univ = req.params.univ;
        
        await db.collection(`article/keywords/${univ}`).get()
        .then((keywordLists) => {
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
            });

            keywords = { dateKeywords, discountKeywords, locationKeywords };
            return null;
        })
        .catch((err) => {
            console.log(err);
            return next(createError(500));
        })

        if (!docs.empty) { // 결과 존재
            var roomList = docs.docs.map((doc) => doc.data());
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
    .catch((err) => {
        console.log(err);
        return next(createError(500));
    })
});

router.get('/read/:univ/:articleNo', (req, res, next) => {
    var univ = req.params.univ;
    var articleNo = req.params.articleNo;
    var db = admin.firestore();
    var ignoreDone = req.query.v; //done에 상관없이 상세페이지가 보이도록 한다.

    db.doc(`article/live/${univ}/${articleNo}`).get()
    .then((doc) => {
        if (doc.exists) {   
            // 문서 존재함
            let data = doc.data();
            if (data.done !== true || ignoreDone !== undefined) { 
                // 거래 완료되지 않음
                return res.render('articleDetail', { univ, articleNo, data });
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
    .catch((err) => {
        console.log(err);
        return next(createError(500));
    })
});

router.get('/create', (req, res, next) => {
    return res.render('create');
});

router.post('/create_process', (req, res, next) => {
    return res.render('create');
})



module.exports = router;