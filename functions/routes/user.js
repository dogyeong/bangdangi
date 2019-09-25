const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const createError = require('http-errors');
const url = require('url');
const cors = require('cors')({
    origin: true
});

router.get('/login', (req, res, next) => {
    console.log('Cookies in login: ', req.cookies);
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
    // Set session expiration to 5 minutes.
    const expiresIn = 60 * 5 * 1000;
    // Create the session cookie. This will also verify the ID token in the process.
    // The session cookie will have the same claims as the ID token.
    // To only allow session cookie setting on recent sign-in, auth_time in ID token
    // can be checked to ensure user was recently signed in before creating a session cookie.
    return admin.auth().createSessionCookie(idToken, { expiresIn })
        .then((sessionCookie) => {
            // Set cookie policy for session cookie.
            const options = { maxAge: expiresIn, httpOnly: true, secure: true };
            res.cookie('session', sessionCookie, options);
            return res.redirect('/user/profile');
        }, error => {
            return res.status(401).send('UNAUTHORIZED REQUEST!' + error.message);
        });
});

router.get('/profile', (req, res) => {
    // Get session cookie.
    var sessionCookie = req.cookies.session || '';
    console.log('Cookies in profile: ', req.cookies);
    // Get the session cookie and verify it. In this case, we are verifying if the
    // Firebase session was revoked, user deleted/disabled, etc.
    admin.auth().verifySessionCookie(sessionCookie, true /** check if revoked. */)
        .then((decodedClaims) => {
            // Serve content for signed in user.
            console.log("verifySession success.");
            return serveContentForUser('/user/profile', req, res, decodedClaims);
        }).catch((error) => {
            // Force user to login.
            // res.redirect('/');
            console.log(error);
            res.send(error.message);
        });
})


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
            (userRecord.photoURL ? '      <img id="photo" src=' + userRecord.photoURL + '>' : '') +
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

module.exports = router;