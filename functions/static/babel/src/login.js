(function(window, document) {
    var googleBtn = document.querySelector(".google_btn");
    var kakaoBtn = document.querySelector(".kakao_btn");
    const auth = firebase.auth();

    auth.useDeviceLanguage();
    auth.setPersistence(firebase.auth.Auth.Persistence.NONE);

    function googleSignIn() {
        var provider = new firebase.auth.GoogleAuthProvider();

        provider.addScope('profile');
        provider.addScope('email');
        provider.setCustomParameters({ prompt: 'select_account' });

        auth.signInWithPopup(provider)
            .then(result => result.user.getIdToken())
            .then(idToken => postIdTokenToSessionLogin("/user/sessionLogin", { idToken }))
            .then(() => auth.signOut()) // 이 다음 then에서 리다이렉션
            .catch(e => {
                window.alert(e);
                console.log(e);
            });
    }

    function postIdTokenToSessionLogin(action, params) {
        var form = document.createElement("form");
        form.setAttribute("method", "post");
        form.setAttribute("action", action);

        for (var key in params) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);
            form.appendChild(hiddenField);
        }
        document.body.appendChild(form);
        form.submit();
    }

    function getCookie(cname) {
        var name = cname + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(";");
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) === " ") {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }

    // 카카오톡 아이디로 로그인 :: 카카오 액세스 토큰 받아오기
    //<![CDATA[
    // 사용할 앱의 JavaScript 키를 설정
    Kakao.init("07ac8a4da1c7b6aa00a5947dc53f964a");
    function loginWithKakao() {
        // 로그인 창을 띄웁니다.
        Kakao.Auth.login({
            success: function(authObj) {
                console.log(JSON.stringify(authObj));
                fetch("/user/kakaoLogin", {
                    method: "POST",
                    headers: {
                        Accept: "application/json, text/plain, */*",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(authObj),
                })
                    .then(res => res.text())
                    .then(firebaseToken => firebase.auth().signInWithCustomToken(firebaseToken))
                    .then(result => result.user.getIdToken())
                    .then(idToken => postIdTokenToSessionLogin("/user/sessionLogin", { idToken }))
                    .then(() => firebase.auth().signOut())
                    .catch(e => {
                        window.alert("로그인에 실패했습니다.");
                        console.log(e);
                    });
            },
            fail: function(err) {
                console.log(JSON.stringify(err));
            },
        });
    }
    //]]>

    googleBtn.addEventListener("click", googleSignIn);
    kakaoBtn.addEventListener("click", loginWithKakao);
})(window, document);
