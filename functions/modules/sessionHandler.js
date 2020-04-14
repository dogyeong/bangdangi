const admin = require("firebase-admin");

/**
 * checkSession
 * 세션쿠키를 검사해서 로그인되어있는 유저 정보를 구한다
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
const checkSession = (req, res, next) => {

    // 세션 쿠키를 받는다
    const sessionCookie = req.cookies.__session || '';

    if (sessionCookie === '') {
        req.decodedClaims = null;
        return next();
    }
    
    // Get the session cookie and verify it. In this case, we are verifying if the
    // Firebase session was revoked, user deleted/disabled, etc.
    return admin.auth().verifySessionCookie(sessionCookie, true /** check if revoked. */)
        .then((decodedClaims) => {
            // 세션쿠키가 인증된 경우, req 객체에 유저 정보 저장
            req.decodedClaims = decodedClaims;
            return next();
        })
        .catch((error) => {
            
            // 인증과정에서 에러 발생한 경우
            console.error(error);
            req.decodedClaims = null;
            return next();
        });
}

/**
 * Attaches a CSRF token to the request.
 * @param {string} url The URL to check.
 * @param {string} cookie The CSRF token name.
 * @param {string} value The CSRF token value to save.
 * @return {function} The middleware function to run.
 */
function attachCsrfToken(url, cookie, value) {
    return function(req, res, next) {
        if (req.url === url) {
            const expiresIn = 60 * 60 * 24 * 1000;
            console.log("ATTATCH CSRF TOKEN : ", value);
            res.cookie(cookie, value);
        }
        next();
    }
}

module.exports = {
    checkSession,
    attachCsrfToken,
};