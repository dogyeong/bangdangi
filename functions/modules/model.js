const admin = require("firebase-admin");
const db = admin.firestore();

const COLLECTION_GROUP_ARTICLES = "articles"; //매물 컬렉션 그룹 이름
const getArticlesPath = (place) => `article/${place}/articles`; //place 이름을 받아서 path로 변환
const PLACE_OBJ = {
    pnu: '부산, 부산대',
    cnu: '대전, 충남대',
    mafo: '마포구,서대문구, 은평구',
    seongdong: '성동구, 광진구',
    gwanak: '관악구, 동작구, 영등포구',
    dongdaemun: '동대문구',
    gangnam: '서초구, 강남구',
    yangcheon: '양천구, 강서구',
    yongsan: '용산구',
}

/**
 * getNewArticles
 * 모든 매물중에 display===true, done===false인 매물을 limit 만큼 배열로 반환한다.
 * 
 * @param {number} limit 받아오는 매물 개수 제한
 */
const getNewArticles = (limit) => {
    return db
        .collectionGroup(COLLECTION_GROUP_ARTICLES) // 모든 매물에 대해서
        .where("display", "==", true) // display 여부
        .where("done", "==", false) // done 여부
        .orderBy("createdAt", "desc") // 생성시간에 대해 내림차순으로 == 최신
        .limit(limit) // 개수 설정
        .get()
        .then(result => filterImg(result.docs));
};


/**
 * filterImg
 * docs의 원소 중에 images를 key로 가지지 않는 document를 제거한 배열을 반환한다.
 *  
 * @param {Array} docs 매물 document array
 */
const filterImg = (docs) => {
    return docs.map(doc => doc.data())
        .filter(doc => (doc.images ? true : false));
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

    if (place === 'all') {
        ref = db.collectionGroup(COLLECTION_GROUP_ARTICLES); // 모든 매물에 대해서
    } 
    else {
        ref = db.collection(getArticlesPath(place)); // 특정 지역 매물에 대해서
    }

    ref = ref
        .where("display", "==", true)
        .where("done", "==", true)
        .where("review", ">", "");

    if (limit > 0) {
        ref = ref.limit(limit); // limit이 존재하면 limit 적용
    }

    return await ref
        .get()
        .then(docs => docs.docs);
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
        roomType: null,
        only: null,
        floor: null,
        images: null,
        urlType: null,
        url: null,
        contact: null,
        done: false,
        text: null,
        title: null,
        views: 0,
        position: null,
        review: null,
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
    getNewArticles,
    getReviews,
    addArticle,
    updateArticle,
    deleteArticle
};
