const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const createError = require('http-errors');
const url = require('url');
const http = require('http');
const https = require('https');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const request = require('request-promise');
const webpush = require('web-push');
const cors = require('cors')({
    origin: true
});

// VAPID keys should only be generated only once.
const vapidKeys = {
    publicKey: 'BFziFVjWvOlL3yM76YQkZLqX-Nv6T26npdFQKyGa7AhI-fhW_xRqkIXc6_w6QsD0T_Zfn8AJSOO7H7o7BP85UQI',
    privateKey: 'Y-I2f6ZQ9tT6tvF7YdPZCUiFiA4fHCNKbBKn3wg-xI0'
};

// FCM key
webpush.setGCMAPIKey('AAAAjDwYUL0:APA91bF8VJqcxFxyoJdqQ7VdYOPffG066xbkeQGHIcz7cRHbFf1yv0WkKciMyyi8k_cKEyEjUwDGgMsPSmk17mW7n3HQ4kcy0rvQZnH_I841jiRjFO4KzDBkcExD-MY43-8CIVdCUEI_');

router.post('/save-subscription', (req, res) => {
    const db = admin.firestore();
    const subscription = req.body.subscription;

    // 구독 정보를 db에 저장한다
    db.collection('subscription')
        .add({
            subscription,
            createdAt: new Date()
        })
        .then(result => res.status(200).send('OK'))
        .catch(err => console.log(err));
})

router.post('/send', (req, res) => {
    const subscription = req.body.subscription;
    const data = JSON.stringify(req.body.data);
    const options = {
        TTL: 24 * 60 * 60,
        vapidDetails: {
            subject: 'https://bangdangi.web.app/',
            publicKey: vapidKeys.publicKey,
            privateKey: vapidKeys.privateKey
        }
    };

    webpush.sendNotification(subscription, data, options)
        .then(result => {
            console.log(result);
            return res.status(200).send('OK');
        })
        .catch(err => {
            console.log(err);
            return res.status(200).send('OK');
        });
});

module.exports = router;
