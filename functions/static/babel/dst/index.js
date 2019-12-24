"use strict";

(function () {
  var univSelect = document.getElementById("univ_select");

  function changeRoomList() {
    if (this.value === "") return;
    window.location.href = "https://bangdangi.web.app/board/list/".concat(this.value);
  }

  univSelect.onchange = changeRoomList;
})();

(function () {
  var appServerPublicKey = vapidPublicKey;
  var isSubscribed = false;
  var swRegist = null;

  function urlB64ToUint8Array(base64String) {
    var padding = "=".repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding). // eslint-disable-next-line no-useless-escape
    replace(/\-/g, "+").replace(/_/g, "/");
    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);

    for (var i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  } // Push 초기화


  function initPush() {
    // const pushButton = document.getElementById('subscribe')
    // pushButton.addEventListener('click', () => {
    //     if (isSubscribed) {
    //         // TODO: 구독 취소 처리
    //     } else {
    //         subscribe();
    //     }
    // });
    swRegist.pushManager.getSubscription().then(function (subscription) {
      isSubscribed = !(subscription === null);
      updateSubscription(subscription);

      if (isSubscribed) {
        console.log("User is subscribed.");
      } else {
        console.log("User is NOT subscribed.");
        subscribe();
      }

      return null;
    })["catch"](function (err) {
      return console.log(err);
    });
  } // function updateButton() {
  //     // TODO: 알림 권한 거부 처리
  //     const pushButton = document.getElementById('subscribe')
  //     if (isSubscribed) {
  //         pushButton.textContent = 'Disable Push Messaging';
  //     } else {
  //         pushButton.textContent = 'Enable Push Messaging';
  //     }
  //     pushButton.disabled = false;
  // }
  // 구독 정보 갱신


  function updateSubscription(subscription) {
    // TODO: 구독 정보 서버로 전송
    try {
      console.log(JSON.stringify(subscription));
    } catch (err) {
      console.log(err);
    }
  } // 알림 구독


  function subscribe() {
    var applicationServerKey = urlB64ToUint8Array(appServerPublicKey);
    swRegist.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    }).then(function (subscription) {
      console.log("User is subscribed.");
      updateSubscription(subscription);
      isSubscribed = true;
      return fetch("https://bangdangi.web.app/notification/save-subscription", {
        method: "POST",
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          subscription: subscription
        })
      });
    }).then(function (res) {
      return res.text();
    }).then(function (res) {
      return console.log(res);
    })["catch"](function (err) {
      console.log("Failed to subscribe the user: ", err);
    });
  }

  if ("serviceWorker" in navigator && "PushManager" in window) {
    // 서비스워커 등록
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("./service-worker.js").then(function (regist) {
        swRegist = regist;
        console.log("Service Worker Registered"); // TODO: Push 기능 초기화

        initPush();
        return regist.addEventListener("updatefound", function () {
          var newWorker = regist.installing;
          console.log("Service Worker update found!");
          newWorker.addEventListener("statechange", function () {
            console.log("Service Worker state changed:", this.state);
          });
        });
      })["catch"](function (err) {
        return console.log(err);
      });
      navigator.serviceWorker.addEventListener("controllerchange", function () {
        console.log("Controller changed");
      });
    });
  }
})();