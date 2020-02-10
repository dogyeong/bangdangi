const admin = require("firebase-admin");
const db = admin.firestore();
const COL_GROUP_ARTICLES = "articles"; //매물 컬렉션 그룹 이름
const getArticlesPath = (place) => `article/${place}/articles`;

const getLatestArticles = limit => {
    return db
        .collectionGroup(COL_GROUP_ARTICLES) // 모든 매물에 대해서
        .where("display", "==", true) // display 여부
        .where("done", "==", false) // done 여부
        .orderBy("createdAt", "desc") // 생성시간에 대해 내림차순으로 = 최신
        .limit(limit) // 갯수 설정
        .get()
        .then(result => checkImg(result.docs));
};

const checkImg = docs => docs.map(doc => doc.data()).filter(doc => (doc.images ? true : false));


/* 
// display === true
// done === true
// review !== null
// 위 조건을 만족하는 (리뷰가 있는 거래완료된) 매물들을 불러와서 배열로 반환한다
*/
const getReview = async place => {
    return await db.collection(getArticlesPath(place))
        .where("display", "==", true)
        .where("done", "==", true)
        .where("review", ">", "")
        .get()
        .then(docs => docs.docs)
};

module.exports = {
    getLatestArticles,
    getReview,
};
