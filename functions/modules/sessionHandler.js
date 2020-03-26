const admin = require("firebase-admin");

/**
 * checkSession
 * 세션쿠키를 검사해서 로그인되어있는 유저 정보를 구한다
 * 
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const checkSession = (req, res, next) => {
    // 세션 쿠키를 받는다
    const sessionCookie = req.cookies.__session || '';
    
    // Get the session cookie and verify it. In this case, we are verifying if the
    // Firebase session was revoked, user deleted/disabled, etc.
    admin.auth().verifySessionCookie(sessionCookie, true /** check if revoked. */)
        .then((decodedClaims) => {
            // Serve content for signed in user.decodedClaims.uid
            req.decodedClaims = decodedClaims;
            return next();
        })
        .catch((error) => {
            // Force user to login.
            console.log(error);
            res.redirect('/user/login'); 
        });
}

module.exports = {
    checkSession,
};