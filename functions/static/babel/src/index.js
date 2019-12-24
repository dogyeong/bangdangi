(() => {
    var univSelect = document.getElementById("univ_select");

    function changeRoomList() {
        if (this.value === "") return;
        window.location.href = `https://bangdangi.web.app/board/list/${this.value}`;
    }

    univSelect.onchange = changeRoomList;
})();

(() => {
    let appServerPublicKey = vapidPublicKey;
    let isSubscribed = false;
    let swRegist = null;

    function urlB64ToUint8Array(base64String) {
        const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding)
            // eslint-disable-next-line no-useless-escape
            .replace(/\-/g, "+")
            .replace(/_/g, "/");

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Push 초기화
    function initPush() {
        // const pushButton = document.getElementById('subscribe')
        // pushButton.addEventListener('click', () => {
        //     if (isSubscribed) {
        //         // TODO: 구독 취소 처리
        //     } else {
        //         subscribe();
        //     }
        // });

        swRegist.pushManager
            .getSubscription()
            .then(subscription => {
                isSubscribed = !(subscription === null);
                updateSubscription(subscription);

                if (isSubscribed) {
                    console.log("User is subscribed.");
                } else {
                    console.log("User is NOT subscribed.");
                    subscribe();
                }

                return null;
            })
            .catch(err => console.log(err));
    }

    // function updateButton() {
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
    }

    // 알림 구독
    function subscribe() {
        const applicationServerKey = urlB64ToUint8Array(appServerPublicKey);
        swRegist.pushManager
            .subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey,
            })
            .then(subscription => {
                console.log("User is subscribed.");
                updateSubscription(subscription);
                isSubscribed = true;

                return fetch("https://bangdangi.web.app/notification/save-subscription", {
                    method: "POST",
                    headers: {
                        Accept: "application/json, text/plain, */*",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ subscription }),
                });
            })
            .then(res => res.text())
            .then(res => console.log(res))
            .catch(err => {
                console.log("Failed to subscribe the user: ", err);
            });
    }

    if ("serviceWorker" in navigator && "PushManager" in window) {
        // 서비스워커 등록
        window.addEventListener("load", () => {
            navigator.serviceWorker
                .register("./service-worker.js")
                .then(regist => {
                    swRegist = regist;
                    console.log("Service Worker Registered");

                    // TODO: Push 기능 초기화
                    initPush();

                    return regist.addEventListener("updatefound", () => {
                        const newWorker = regist.installing;
                        console.log("Service Worker update found!");

                        newWorker.addEventListener("statechange", function() {
                            console.log("Service Worker state changed:", this.state);
                        });
                    });
                })
                .catch(err => console.log(err));

            navigator.serviceWorker.addEventListener("controllerchange", () => {
                console.log("Controller changed");
            });
        });
    }
})();
