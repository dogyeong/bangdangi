const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const createError = require('http-errors');
const request = require('request-promise');
const cors = require('cors')({
    origin: true
});
const db = admin.firestore();
const model = require('../modules/model');
// Kakao API request url to retrieve user profile based on access token
const requestMeUrl = 'https://kapi.kakao.com/v2/user/me?secure_resource=true';

router.get('/login', (req, res, next) => {
    // 레퍼러 - 이전페이지의 경로를 저장한다
    const referer = req.headers.referer;
    
    return res.render('login', { referer });
});

router.post('/sessionLogin', async (req, res, next) => {
    // Get the ID token passed and the CSRF token.
    const idToken = req.body.idToken.toString();
    const csrfToken = req.body.csrfToken && req.body.csrfToken.toString();
    const referer = req.body.referer || '/';
    
    /**
    * firebase hosting + functions 조합을 쓰면 서버에서 쿠키를 하나밖에 못 받는다고 한다. 
    * 그래서 csrfToken을 쓸 수가 없다..;
    */
    // Guard against CSRF attacks.
    // if (!req.cookies || csrfToken !== req.cookies.csrfToken) {
    //     res.status(401).send('UNAUTHORIZED REQUEST!');
    //     return;
    // }

    // db에 유저 정보를 업데이트
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { name = null, email = null, picture=null, provider='GOOGLE', uid } = decodedToken; 
    
    await db.collection('/users').doc(uid).set({
        name,
        email,
        picture,
        provider,
        lastLogIn: new Date(),
    }, { merge: true })

    // Set session expiration to 100 minutes.
    const expiresIn = 60 * 100 * 1000;
    return createSession(req, res, idToken, expiresIn, referer);
});

router.post('/kakaoLogin', (req, res) => {
    //console.log(req.body);
    // 액세스 토큰을 받아온다
    const token = req.body.access_token;
    if (!token) return res.status(400).send({error: 'There is no token.'})
    .send({message: 'Access token is a required parameter.'});

    //console.log(`Verifying Kakao token: ${token}`);
    // 액세스 토큰을 파이어베이스 토큰으로 바꾼다
    return createFirebaseToken(token)
    .then((firebaseToken) => {
        //console.log(`Returning firebase token to user: ${firebaseToken}`);
        //return res.render('kakaoLogin', { firebaseToken });
        return res.send(firebaseToken);
    });
})

router.get('/profile', async (req, res) => {
    const user = req.decodedClaims;
    
    // 로그인 안했으면 로그인페이지로 라디이렉션
    if(!user) {
        return res.redirect('/user/login'); 
    }

    const data = await model.getArticles('all', { 
        display: true, 
        done: false, 
        sortBy: 'createdAt', 
        creator: user.uid 
    })

    return res.render('profile', { user, data });
})

/**
 * 사용자 로그아웃 엔드포인트
 */
router.get('/logout', (req, res) => {

    // Clear cookie.
    const sessionCookie = req.cookies.__session || '';
    res.clearCookie('__session');

    // Revoke session too. Note this will revoke all user sessions.
    const decodedClaims = req.decodedClaims;
    if (decodedClaims) {
        return admin.auth()
            .revokeRefreshTokens(decodedClaims.sub)
            .then(() => res.redirect('/')) // Redirect to login page on success.
            .catch(() => res.redirect('/')); // Redirect to login page on error.
    } 
    else {
        // Redirect to login page when no session cookie available.
        return res.redirect('/');
    }
  });

/**
* id토큰으로 세션쿠키를 만들어서 넣고, referer로 리다이렉트
*/
function createSession(req, res, token, expiresIn, referer) {
    // Create the session cookie. This will also verify the ID token in the process.
    // The session cookie will have the same claims as the ID token.
    // To only allow session cookie setting on recent sign-in, auth_time in ID token
    // can be checked to ensure user was recently signed in before creating a session cookie.
    return admin.auth().createSessionCookie(token, { expiresIn })
        .then((sessionCookie) => {
            // Set cookie policy for session cookie.
            const options = { maxAge: expiresIn, httpOnly: true, secure: false/* local 테스트를 위해 */ };

            res.cookie('__session', sessionCookie, options);

            console.log('sesseionCookie : ', sessionCookie);

            return res.redirect(referer);
        }, error => {
            return res.status(401).send('UNAUTHORIZED REQUEST!' + error.message);
        });
}

/**
 * requestMe - Returns user profile from Kakao API
 *
 * @param  {String} kakaoAccessToken Access token retrieved by Kakao Login API
 * @return {Promiise<Response>}      User profile response in a promise
 */
function requestMe(kakaoAccessToken) {
    console.log('Requesting user profile from Kakao API server.');
    return request({
        method: 'GET',
        headers: { 'Authorization': 'Bearer ' + kakaoAccessToken },
        url: requestMeUrl,
    });
}


/**
 * updateOrCreateUser - Update Firebase user with the give email, create if
 * none exists.
 *
 * @param  {String} userId        user id per app
 * @param  {String} email         user's email address
 * @param  {String} displayName   user
 * @param  {String} photoURL      profile photo url
 * @return {Prommise<UserRecord>} Firebase user record in a promise
 */
function updateOrCreateUser(userId, email, displayName, photoURL) {
    console.log('updating or creating a firebase user');
    const updateParams = {
        provider: 'KAKAO',
        displayName: displayName,
    };
    if (displayName) {
        updateParams['displayName'] = displayName;
    } else {
        updateParams['displayName'] = email;
    }
    if (photoURL) {
        updateParams['photoURL'] = photoURL;
    }
    console.log(updateParams);
    return admin.auth().updateUser(userId, updateParams)
        .catch((error) => {
            if (error.code === 'auth/user-not-found') {
                updateParams['uid'] = userId;
                if (email) {
                    updateParams['email'] = email;
                }
                return admin.auth().createUser(updateParams);
            }
            throw error;
        });
}


/**
 * createFirebaseToken - returns Firebase token using Firebase Admin SDK
 *
 * @param  {String} kakaoAccessToken access token from Kakao Login API
 * @return {Promise<String>}                  Firebase token in a promise
 */
function createFirebaseToken(kakaoAccessToken) {
    return requestMe(kakaoAccessToken)
    .then((response) => {
        const body = JSON.parse(response);
        console.log(body);
        const userId = `kakao:${body.id}`;
        if (!userId) {
            return res.status(404)
                .send({ message: 'There was no user with the given access token.' });
        }
        let nickname = null;
        let profileImage = null;
        if (body.properties) {
            nickname = body.properties.nickname;
            profileImage = body.properties.profile_image;
        }
        return updateOrCreateUser(userId, body.kaccount_email, nickname, profileImage);
    }).then((userRecord) => {
        const userId = userRecord.uid;
        console.log(`creating a custom firebase token based on uid ${userId}`);
        return admin.auth().createCustomToken(userId, { provider: 'KAKAO' });
    });
}

module.exports = router;