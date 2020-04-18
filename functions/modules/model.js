const admin = require("firebase-admin");
const db = admin.firestore();
const storage = admin.storage();
const storageHandler = require('./storageHandler')

const ARTICLES = "articles";
const USERS = 'users';
const COLLECTION_GROUP_ARTICLES = "articles"; //매물 컬렉션 그룹 이름
const getArticlesPath = place => `article/${place}/articles`; //place 이름을 받아서 path로 변환
const getLocKeywordsPath = place => `article/${place}/keywords/locationKeywords`;
const PLACE_OBJ = {
    all: "서울",
    gangnam: "강남구",
    gwanak: '관악구',
};

/**
 * 해당 매물의 썸네일 이미지가 있는지 확인해서 썸네일 이미지들의 링크를 담고있는 배열을 반환한다
 * [
 *  {200: .., 400: .., 600: ..,}, 
 *  {200: .., 400: .., 600: ..,}, 
 * ]
 * 이런식으로 반환된다
 * @param {Ojbect} doc firestore documnet reference object : .data() 하기 전의 객체 
 * @returns {Array}
 */
const getThumbnail = async (doc) => {
    let id = doc.id;

    try {
        // storage에서 썸네일파일 배열을 받는다
        let thumbs = await storage
            .bucket()
            .getFiles({ prefix: `images/${id}/thumbs` })
            .then(data => data[0])

        // 배열이 비어있으면 null 리턴
        if (thumbs.length === 0) {
            return null;
        }

        const config = {
            action: 'read',
            expires: (new Date().getTime() + 6 *  3600 * 1000), // 6 hours?
        };
        
        // 썸네일파일들의 다운로드url을 가져온다
        let tasks = thumbs.map(thumb => thumb.getSignedUrl(config).then(data => data[0]))

        // 3개씩(200,400,600) 묶은 객체로 만들어서 리턴한다.
        return await Promise.all(tasks)
            .then(urls => chunkArray(urls, 3));
    }
    catch (err) {
        console.log(err);
        return null;
    }
}


/**
 * Returns an array with arrays of the given size.
 *
 * @param {Array} myArray array to split
 * @param {Integer} chunk_size Size of every group
 */
const chunkArray = (myArray, chunk_size) => {
    let index = 0;
    let arrayLength = myArray.length;
    let tempArray = [];
    
    for (index = 0; index < arrayLength; index += chunk_size) {
        let myChunk = myArray.slice(index, index+chunk_size);
    
        // Do something if you want with the group
        tempArray.push({
            200: myChunk[0],
            400: myChunk[1],
            600: myChunk[2]
        });
    }

    return tempArray;
}


/**
 * filterImg
 * docs의 원소 중에 images를 key로 가지지 않는 document를 제거한 배열을 반환한다.
 *
 * @param {Array} docs 매물 document array
 */
const filterImg = docs => {
    return docs.map(doc => doc.data()).filter(doc => (doc.images ? true : false));
};

/**
 * getReview
 * 인자로 받은 place의 리뷰가 있는 매물들을 배열로 반환한다
 *
 * @param {string} place 해당 지역 ; all이면 모든 지역의 매물에 대해 동작
 * @param {number} limit 매물 개수 제한 ; 0이면 제한없이 동작
 */
const getReviews = async (place, limit) => {
    let ref;

    if (place === "all") {
        ref = db.collectionGroup(COLLECTION_GROUP_ARTICLES); // 모든 매물에 대해서
    } else {
        ref = db.collection(getArticlesPath(place)); // 특정 지역 매물에 대해서
    }

    ref = ref
        .where("display", "==", true)
        .where("done", "==", true)
        .where("review", ">", "");

    if (limit > 0) {
        ref = ref.limit(limit); // limit이 존재하면 limit 적용
    }

    return await ref.get().then(docs => docs.docs);
};

/**
 * 매물 데이터 리스트를 전체 또는 지역별로 받아온다
 * @param {string} place 지역 : all | 한글 시군구 지역
 * @param {Object} options 옵션 : display, done, sortBy, limit
 *
 * @returns {Array} 매물 데이터 객체들을 담은 배열
 */
const getArticles = async (place, options) => {
    
    try {
        let ref = db.collection(ARTICLES);

        // place의 지역에 있는 매물을 가져온다. place가 all이면 전부 다
        if (place !== 'all') {
            ref = ref.where('sggNm', '==', PLACE_OBJ[place]);
        }

        // display, done 옵션 설정
        if (options) {
            if (options.display === true) 
                ref = ref.where('display', '==', true);
            else if (options.display === false) 
                ref = ref.where('display', '==', false);
            
            if (options.done === true)
                ref = ref.where('done', '==', true);
            else if (options.done === false) 
                ref = ref.where('done', '==', false);
        }

        // 쿼리결과를 배열에 저장
        let docs = (await ref.get()).docs;

        // 정렬, 개수제한 옵션 적용
        if (options) {
            if (options.sortBy === 'createdAt') { // 최신순
                docs.sort((a,b) => {
                    return b.data().createdAt.seconds - a.data().createdAt.seconds;
                })
            }
            else if (options.sortBy === 'views') { // 조회순
                docs.sort((a,b) => {
                    return b.data().views - a.data().views;
                })
            }

            if (options.limit > 0) { // 개수 제한
                docs = docs.slice(0, options.limit);
            }
        }

        // 썸네일 url    
        const thumbnails = await Promise.all(docs.map(doc => getThumbnail(doc)));

        // data() 메소드를 통해 데이터 객체로 바꾸고, 썸네일도 추가해서 배열로 리턴
        return docs.map((doc, idx) => { 
            return { 
                ...doc.data(),
                id: doc.id, 
                thumbnail: thumbnails[idx], 
            } 
        });
    }
    catch (err) {
        console.error(err);
        return [];
    }
};

/**
 * id를 받아서 매물 데이터 하나를 리턴한다. 에러가 발생하면 null을 리턴한다
 * @param {String} id 매물 document id
 * @returns {Object} 매물 데이터
 */
const getArticleWithId = async (id) => {
    try {
        let ref = db.collection(ARTICLES).doc(id);

        let doc = await ref.get();

        if (!doc.exists) {
            throw Error("documnet is not exists")  
        }

        let data = doc.data();

        // 썸네일 받아오기
        let thumbnails = await getThumbnail(doc);

        // 썸네일 존재하면 썸네일로 이미지 교체
        if (thumbnails) {
            data.images = [];
            thumbnails.forEach(thumb => data.images.push(thumb[600]));
        }

        return data;
    }
    catch (err) {
        console.log(err);
        return null;
    }
}


/**
 * DB에 매물을 추가한다
 * @param {object} data 매물 데이터
 * @param {Object} files 파일 데이터를 파싱한 객체
 * @param {string} id   firestore 문서 id (optional)
 * 
 * @returns {Promise} 성공적으로 추가되면 매물문서 id를 반환하고, 에러가 발생하면 null을 반환한다
 */
const addArticle = async (data, files, id) => {
    
    try{
        let ref = db.collection(ARTICLES);

        // id도 넘겨주면 해당 id로 문서를 만든다
        ref = id ? ref.doc(id) : ref.doc();

        // file upload 스트림을 처리하는 promise들을 담을 배열
        var tasks = [];

        console.log(files);

        // 스토리지에 사진 저장 -> resolve url
        for (name in files) {
            if (name !== '') {
                // file object
                const image = files[name];

                // upload promise
                const task = storageHandler.upload(image, `images/${ref.id}/${image.filename}`)

                tasks.push(task);
            }
        }

        // promise는 액세스 url을 resolve
        const images = await Promise.all(tasks);

        // 문서 생성. createdAt 필드는 현재 시간으로 해준다.
        await ref.set({
            display: false,
            tradeType: null,
            startDate: null,
            endDate: null,
            minTerm: null,
            dateKeywords: null,
            keywords: null,
            discountKeywords: null,
            price: null,
            deposit: null,
            expense: null,
            locationS: null,
            only: null,
            floor: null,
            contact: null,
            done: false,
            text: null,
            title: null,
            views: 0,
            review: null,
            url: null,
            roadFullAddr: null, 
            roadAddrPart: null,
            addrDetail: null,
            siNm: null,
            sggNm: null,
            emdNm: null,
            roadNm: null,
            buldNo: null,
            coords: null,
            creator: null,
            ...data, // 파라미터로 받은 데이터로 덮어씌우기
            images,
            createdAt: new Date(),
            lastCheck: new Date(),
            id: ref.id,
        })

        // 작성자 정보가 있을 때
        if (data && data.creator) {
            // 유저 정보에 등록한 매물 추가
            await db.collection('/users').doc(data.creator).update({
                articles: admin.firestore.FieldValue.arrayUnion(`${ref.id}`),
            })
        }

        return ref.id;
    }
    catch(err) {
        console.error(err);
        return null;
    }
};

/**
 *
 * @param {string} id
 * @param {object} data
 *
 * @returns {Promise}
 */
const updateArticle = (id, data) => {
    // 문서 업데이트
    return db
        .collection(ARTICLES)
        .doc(id)
        .update(data);
};

/**
 * 매물을 삭제한다.
 * 유저id와 매물id를 파라미터로 받고, 매물 데이터와 유저데이터의 매물리스트 중에서 해당 매물을 삭제한다
 * @param {String} uid 
 * @param {String} articleId 
 * @returns {Object} 결과를 전달하는 객체. 
 *                   success는 성공했을 경우 true, 실패했을 경우 false를 저장하고,
 *                   실패했을 경우 error에 에러메세지를 같이 전달한다
 */
const deleteArticle = (uid, articleId) => {
    
    try {
        let articleRef = db.collection(ARTICLES);
        let userRef = db.collection(USERS);

        // 매물데이터의 creator와 uid 비교

        // 다르면 에러
        throw Error("The user is not creator");

        // 같으면 
        // 매물데이터 삭제

        // 유저데이터의 articles에서 articleId 삭제

        // 성공객체 리턴
        return { success: true }
    }
    catch(err) {
        return {
            success: false,
            error: err
        }
    }
};

/**
 * 해당 id매물의 조회수를 1 증가시킨다
 * @param {String} id 
 */
const viewIncrement = (id) => {
    const docRef = db.collection(ARTICLES).doc(id);

    return admin.firestore().runTransaction(transaction => {
        return transaction.get(docRef).then(doc => {
            // 조회수 1 증가
            let newViews = doc.data().views + 1;
            transaction.update(docRef, { views: newViews });
            return Promise.resolve(newViews);
        });
    });
}


module.exports = {
    PLACE_OBJ,
    getArticlesPath,
    getLocKeywordsPath,
    getReviews,
    getArticles,
    getArticleWithId,
    addArticle,
    updateArticle,
    deleteArticle,
    getThumbnail,
    viewIncrement
};
