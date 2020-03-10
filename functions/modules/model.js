const admin = require("firebase-admin");
const db = admin.firestore();
const storage = admin.storage();

const COLLECTION_GROUP_ARTICLES = "articles"; //매물 컬렉션 그룹 이름
const getArticlesPath = place => `article/${place}/articles`; //place 이름을 받아서 path로 변환
const getLocKeywordsPath = place => `article/${place}/keywords/locationKeywords`;
const PLACE_OBJ = {
    mafo: "마포구,서대문구, 은평구",
    seongdong: "성동구, 광진구",
    gwanak: "관악구, 동작구, 영등포구",
    dongdaemun: "동대문구",
    gangnam: "서초구, 강남구",
    yangcheon: "양천구, 강서구",
    yongsan: "용산구",
};


/**
 * getNewArticles
 * 모든 매물중에 display===true, done===false인 매물을 limit 만큼 배열로 반환한다.
 *
 * @param {number} limit 받아오는 매물 개수 제한
 */
const getNewArticles = async limit => {
    let docs;
    let thumbnails;

    try {
        // 매물데이터
        docs = await db
            .collectionGroup(COLLECTION_GROUP_ARTICLES) // 모든 매물에 대해서
            .where("display", "==", true) // display 여부
            .where("done", "==", false) // done 여부
            .orderBy("createdAt", "desc") // 생성시간에 대해 내림차순으로 == 최신
            .limit(limit) // 개수 설정
            .get()
            .then(result => result.docs);

        // 썸네일 url    
        thumbnails = await Promise.all(docs.map(doc => getThumbnail(doc)));

        return docs.map((doc, idx) => { 
        return { 
            ...doc.data(), 
            thumbnail: thumbnails[idx] 
        } 
        });
    }
    catch (err) {
        console.log(err);
        return [];
    }  
};


const getThumbnail = async (doc) => {
    let place = doc.ref.parent.parent.id;
    let id = doc.id;

    try {
        // storage에서 썸네일파일 배열을 받는다
        let thumbs = await storage
        .bucket()
        .getFiles({ prefix: `images/${place}/${id}/thumbs` })
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

        // 3개씩 묶은 객체로 만들어서 리턴한다.
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
 *
 * @param {string} place
 * @param {string} id
 *
 * @returns {Promise}
 */
const getArticles = (place, id) => {
    return db
        .collection(getArticlesPath(place))
        .doc(id)
        .get();
};

/**
 *
 * @param {string} place
 *
 * @returns {Promise}
 */
const getArticlesAll = place => {
    if (place) {
        // 특정 지역의 매물 리턴
        return db.collection(getArticlesPath(place)).get();
    } else {
        // 모든 매물 리턴
        return db.collectionGroup(COLLECTION_GROUP_ARTICLES).get();
    }
};


/**
 *
 * @param {string} place
 * @param {string} id
 * @param {object} data
 *
 * @returns {Promise}
 */
const addArticle = (place, id, data) => {
    let ref = db.collection(getArticlesPath(place));

    // id도 넘겨주면 해당 id로 문서를 만든다
    ref = id ? ref.doc(id) : ref.doc();

    // 문서 생성. createdAt 필드는 현재 시간으로 해준다.
    return ref.set({
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
        locationL: null,
        locationS: null,
        only: null,
        floor: null,
        images: null,
        url: null,
        contact: null,
        done: false,
        text: null,
        title: null,
        views: 0,
        position: null,
        review: null,
        lastCheck: new Date(),
        ...data,
        createdAt: new Date(),
    });
};

/**
 *
 * @param {string} place
 * @param {string} id
 * @param {object} data
 *
 * @returns {Promise}
 */
const updateArticle = (place, id, data) => {
    // 문서 업데이트
    return db
        .collection(getArticlesPath(place))
        .doc(id)
        .update(data);
};

/**
 *
 * @param {string} place
 * @param {string} id
 *
 * @returns {Promise}
 */
const deleteArticle = (place, id) => {
    // 문서 삭제
    return db
        .collection(getArticlesPath(place))
        .doc(id)
        .delete();
};


module.exports = {
    PLACE_OBJ,
    getArticlesPath,
    getLocKeywordsPath,
    getNewArticles,
    getReviews,
    getArticles,
    getArticlesAll,
    addArticle,
    updateArticle,
    deleteArticle,
    getThumbnail,
};
