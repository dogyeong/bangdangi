/**
 * Service Worker
 */

const _version = 'v6';
const cacheName = 'v3';
const cacheList = [
  '/',
  '/manifest.json',
  '/css/common.css',
  '/css/index.css',
  '/css/headerBar.css',
  '/css/footer.css',
  '/img/main_bg.jpg',
  '/img/bangdangi_logo_2.png',
  'http://cdn.jsdelivr.net/npm/xeicon@2.3.3/xeicon.min.css',
  'https://cdn.jsdelivr.net/npm/xeicon@2.3.3/fonts/xeicon.woff2?3ka2yj',
  '/babel/dst/index.js',
  'http://cdn.polyfill.io/v3/polyfill.min.js',
  // 'https://www.googletagmanager.com/gtag/js?id=UA-141137545-1',
  // 'https://www.googletagmanager.com/gtm.js?id=GTM-TC8GC5C',
  // 'https://www.google-analytics.com/analytics.js',
  // 'https://www.google-analytics.com/r/collect?v=1&_v=j79&a=1463990558&t=pageview&_s=1&dl=http%3A%2F%2Flocalhost%2F&ul=ko-kr&de=UTF-8&dt=%EB%8B%A8%EA%B8%B0%EC%9B%90%EB%A3%B8%20%EC%B0%BE%EC%95%84%EB%8B%A4%EB%8B%90%20%ED%95%84%EC%9A%94%EC%97%86%EC%9D%B4%20%ED%95%9C%EB%B2%88%EC%97%90%20%7C%20%EB%B0%A9%EB%8B%A8%EA%B8%B0&sd=24-bit&sr=1440x900&vp=666x788&je=0&_u=QACAAEAB~&jid=1028660909&gjid=2083258155&cid=490682002.1566892324&tid=UA-141137545-1&_gid=804642286.1575350324&_r=1&gtm=2wgav9TC8GC5C&z=593919854',
  'https://fonts.googleapis.com/earlyaccess/notosanskr.css',
  'https://fonts.gstatic.com/s/notosanskr/v12/Pby7FmXiEBPT4ITbgNA5CgmOelzI7bgWsWdx3Ch_M9uykRdOOoSdBjU92zqHxA.118.woff2',
  'https://fonts.gstatic.com/s/notosanskr/v12/Pby6FmXiEBPT4ITbgNA5CgmOsn7twpAcuSUhxCwaN8allRh_AYWeASEkw16X.118.woff2',
  'https://fonts.gstatic.com/s/notosanskr/v12/PbykFmXiEBPT4ITbgNA5Cgm203Tq4JJWq209pU0DPdWuqxJFA4GNDCBYtw.119.woff2',
  'https://fonts.gstatic.com/s/notosanskr/v12/Pby7FmXiEBPT4ITbgNA5CgmOelzI7bgWsWdx3Ch_M9uykRdOOoSdBjU92zqHxA.119.woff2',
  'https://fonts.gstatic.com/s/notosanskr/v12/PbykFmXiEBPT4ITbgNA5Cgm203Tq4JJWq209pU0DPdWuqxJFA4GNDCBYtw.118.woff2',
  'https://fonts.gstatic.com/s/notosanskr/v12/PbykFmXiEBPT4ITbgNA5Cgm203Tq4JJWq209pU0DPdWuqxJFA4GNDCBYtw.115.woff2',
  'https://fonts.gstatic.com/s/notosanskr/v12/PbykFmXiEBPT4ITbgNA5Cgm203Tq4JJWq209pU0DPdWuqxJFA4GNDCBYtw.117.woff2',
  'https://fonts.gstatic.com/s/notosanskr/v12/PbykFmXiEBPT4ITbgNA5Cgm203Tq4JJWq209pU0DPdWuqxJFA4GNDCBYtw.116.woff2',
  'https://fonts.gstatic.com/s/notosanskr/v12/PbykFmXiEBPT4ITbgNA5Cgm203Tq4JJWq209pU0DPdWuqxJFA4GNDCBYtw.111.woff2',
  'https://fonts.gstatic.com/s/notosanskr/v12/Pby7FmXiEBPT4ITbgNA5CgmOelzI7bgWsWdx3Ch_M9uykRdOOoSdBjU92zqHxA.117.woff2',
  'https://fonts.gstatic.com/s/notosanskr/v12/Pby7FmXiEBPT4ITbgNA5CgmOelzI7bgWsWdx3Ch_M9uykRdOOoSdBjU92zqHxA.116.woff2',
  'https://fonts.gstatic.com/s/notosanskr/v12/Pby7FmXiEBPT4ITbgNA5CgmOelzI7bgWsWdx3Ch_M9uykRdOOoSdBjU92zqHxA.114.woff2',
  'https://fonts.gstatic.com/s/notosanskr/v12/Pby7FmXiEBPT4ITbgNA5CgmOelzI7bgWsWdx3Ch_M9uykRdOOoSdBjU92zqHxA.111.woff2',
  'https://fonts.gstatic.com/s/notosanskr/v12/PbykFmXiEBPT4ITbgNA5Cgm203Tq4JJWq209pU0DPdWuqxJFA4GNDCBYtw.114.woff2',
  'https://fonts.gstatic.com/s/notosanskr/v12/PbykFmXiEBPT4ITbgNA5Cgm203Tq4JJWq209pU0DPdWuqxJFA4GNDCBYtw.112.woff2',
  'https://fonts.gstatic.com/s/notosanskr/v12/Pby6FmXiEBPT4ITbgNA5CgmOsn7twpAcuSUhxCwaN8allRh_AYWeASEkw16X.119.woff2',
  'https://fonts.gstatic.com/s/notosanskr/v12/Pby6FmXiEBPT4ITbgNA5CgmOsn7twpAcuSUhxCwaN8allRh_AYWeASEkw16X.117.woff2',
  'https://fonts.gstatic.com/s/notosanskr/v12/Pby6FmXiEBPT4ITbgNA5CgmOsn7twpAcuSUhxCwaN8allRh_AYWeASEkw16X.116.woff2',
  'https://fonts.gstatic.com/s/notosanskr/v12/Pby6FmXiEBPT4ITbgNA5CgmOsn7twpAcuSUhxCwaN8allRh_AYWeASEkw16X.115.woff2',
  // 'https://cdn.channel.io/plugin/ch-plugin-web.js',
  // 'https://cdn.channel.io/plugin/images/ch-new-launcher-icon-68.png'
]

const log = msg => {
  console.log(`[ServiceWorker ${_version}] ${msg}`);
}

// Life cycle: INSTALL
self.addEventListener('install', event => {
  self.skipWaiting();
  log('INSTALL');
  event.waitUntil(
    caches.open(cacheName)
      .then(cache => {
        log('caching app shell');
        return cache.addAll(cacheList);
      })
      .catch(err => console.log(err))
  );
});

// Life cycle: ACTIVATE
self.addEventListener('activate', event => {
  log('Activate');
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== cacheName) {
          log('Removing old cache ' + key);
          return caches.delete(key);
        }
      }));
    })
  );
});

// Functional: FETCH
self.addEventListener('fetch', event => {
  log('Fetch ' + event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then(response => (response || fetch(event.request)))
  );
});

// Functional: PUSH
self.addEventListener('push', event => {
  let payload = event.data.json();
  const title = payload.title;
  const options = {
    body: payload.body,
    vibrate: [200, 100, 200, 100, 200, 100, 400],
    data: payload.params,
    icon: '/img/icons/icon-512x512.png',
    // badge: 'images/badge.png'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Functional: push click listener 푸시 알림에서 클릭 리스너
self.addEventListener('notificationclick', event => {
	var data = event.notification.data;
	event.notification.close();
	event.waitUntil( clients.openWindow( data.url ) );
});
