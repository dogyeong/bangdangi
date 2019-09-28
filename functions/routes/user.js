const http = require('http');
const https = require('https');
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const createError = require('http-errors');
const url = require('url');
const request = require('request-promise');
const cors = require('cors')({
    origin: true
});
// Kakao API request url to retrieve user profile based on access token
const requestMeUrl = 'https://kapi.kakao.com/v1/user/me?secure_resource=true';

router.get('/login', (req, res, next) => {
    return res.render('login');
});

router.post('/sessionLogin', (req, res, next) => {
    // Get the ID token passed and the CSRF token.
    const idToken = req.body.idToken.toString();
    /* const csrfToken = req.body.csrfToken.toString(); */
    // Guard against CSRF attacks.
    /*
    if (csrfToken !== req.cookies.csrfToken) {
        res.status(401).send('UNAUTHORIZED REQUEST!');
        return;
    }
    */
    // Set session expiration to 10 minutes.
    const expiresIn = 60 * 10 * 1000;
    return createSession(req, res, idToken, expiresIn);
});

router.post('/kakaoLogin', (req, res) => {
    console.log(req.body);
    const token = req.body.access_token;
    if (!token) return res.status(400).send({error: 'There is no token.'})
    .send({message: 'Access token is a required parameter.'});

    console.log(`Verifying Kakao token: ${token}`);

    return createFirebaseToken(token)
    .then((firebaseToken) => {
        console.log(`Returning firebase token to user: ${firebaseToken}`);
        return res.render('kakaoLogin', { firebaseToken });
    });
})

router.get('/profile', (req, res) => {
    // Get session cookie.
    var sessionCookie = req.cookies.__session || '';
    // Get the session cookie and verify it. In this case, we are verifying if the
    // Firebase session was revoked, user deleted/disabled, etc.
    admin.auth().verifySessionCookie(sessionCookie, true /** check if revoked. */)
        .then((decodedClaims) => {
            // Serve content for signed in user.    decodedClaims.uid
            return serveContentForUser('/user/profile', req, res, decodedClaims);
        }).catch((error) => {
            // Force user to login.
            console.log(error);
            res.redirect('/'); 
        });
})

/*
* id토큰으로 세션쿠키를 만들어서 넣고, 프로필 페이지로 리다이렉션된다.
*/
function createSession(req, res, token, expiresIn) {
    // Create the session cookie. This will also verify the ID token in the process.
    // The session cookie will have the same claims as the ID token.
    // To only allow session cookie setting on recent sign-in, auth_time in ID token
    // can be checked to ensure user was recently signed in before creating a session cookie.
    return admin.auth().createSessionCookie(token, { expiresIn })
        .then((sessionCookie) => {
            // Set cookie policy for session cookie.
            const options = { maxAge: expiresIn, httpOnly: true, secure: true };
            res.cookie('__session', sessionCookie, options);
            return res.redirect('/user/profile');
        }, error => {
            return res.status(401).send('UNAUTHORIZED REQUEST!' + error.message);
        });
}

/**
 * Renders the profile page and serves it in the response.
 * @param {string} endpoint The get profile endpoint.
 * @param {!Object} req The expressjs request.
 * @param {!Object} res The expressjs response.
 * @param {!firebase.auth.DecodedIdToken} decodedClaims The decoded claims from verified
 *     session cookies.
 * @return {!Promise} A promise that resolves on success.
 */
function serveContentForUser(endpoint, req, res, decodedClaims) {
    // Lookup the user information corresponding to cookie and return the profile data for the user.
    return admin.auth().getUser(decodedClaims.sub).then((userRecord) => {
        var html = '<!DOCTYPE html>' +
            '<html>' +
            '<meta charset="UTF-8">' +
            '<link href="style.css" rel="stylesheet" type="text/css" media="screen" />' +
            '<meta name="viewport" content="width=device-width, initial-scale=1">' +
            '<title>Profile Page</title>' +
            '<body>' +
            '<div id="container">' +
            '  <h3>Welcome to Session Management Example App, ' + (userRecord.displayName || 'N/A') + '</h3>' +
            '  <div id="loaded">' +
            '    <div id="main">' +
            '      <div id="user-signed-in">' +
            // Show user profile information.
            '        <div id="user-info">' +
            '          <div id="photo-container">' +
            (userRecord.photoURL ? '      <img style="width:50px;" id="photo" src=' + userRecord.photoURL + '>' : '') +
            '          </div>' +
            '          <div id="name">' + userRecord.displayName + '</div>' +
            '          <div id="email">' +
            userRecord.email + ' (' + (userRecord.emailVerified ? 'verified' : 'unverified') + ')</div>' +
            '          <div class="clearfix"></div>' +
            '        </div>' +
            '        <p>' +
            // Append button for sign out.
            '          <button id="sign-out" onClick="window.location.assign(\'/logout\')">Sign Out</button>' +
            // Append button for deletion.
            '          <button id="delete-account" onClick="window.location.assign(\'/delete\')">' +
            'Delete account</button>' +
            '        </p>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '</div>' +
            '</body>' +
            '</html>';
        res.set('Content-Type', 'text/html');
        return res.end(html);
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
    return requestMe(kakaoAccessToken).then((response) => {
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
        return updateOrCreateUser(userId, body.kaccount_email, nickname,
            profileImage);
    }).then((userRecord) => {
        const userId = userRecord.uid;
        console.log(`creating a custom firebase token based on uid ${userId}`);
        return admin.auth().createCustomToken(userId, { provider: 'KAKAO' });
    });
}

module.exports = router;