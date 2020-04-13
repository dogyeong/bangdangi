"use strict";

(function (window, document) {
  var googleBtn = document.querySelector(".google_btn");
  var kakaoBtn = document.querySelector(".kakao_btn");
  var auth = firebase.auth();
  auth.useDeviceLanguage();
  auth.setPersistence(firebase.auth.Auth.Persistence.NONE);

  function googleSignIn() {
    var provider = new firebase.auth.GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    auth.signInWithPopup(provider).then(function (result) {
      return result.user.getIdToken();
    }).then(function (idToken) {
      var csrfToken = getCookie('csrfToken');
      return postIdTokenToSessionLogin("/user/sessionLogin", {
        idToken: idToken,
        csrfToken: csrfToken
      });
    }).then(function () {
      return auth.signOut();
    }) // 이 다음 then에서 리다이렉션
    ["catch"](function (e) {
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
    } // referer가 있을 경우


    if (referer) {
      var _hiddenField = document.createElement("input");

      _hiddenField.setAttribute("type", "hidden");

      _hiddenField.setAttribute("name", 'referer');

      _hiddenField.setAttribute("value", referer);

      form.appendChild(_hiddenField);
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
  } // 카카오톡 아이디로 로그인 :: 카카오 액세스 토큰 받아오기
  //<![CDATA[
  // 사용할 앱의 JavaScript 키를 설정


  Kakao.init("07ac8a4da1c7b6aa00a5947dc53f964a");

  function loginWithKakao() {
    // 로그인 창을 띄웁니다.
    Kakao.Auth.login({
      success: function success(authObj) {
        console.log(JSON.stringify(authObj));
        fetch("/user/kakaoLogin", {
          method: "POST",
          headers: {
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json"
          },
          body: JSON.stringify(authObj)
        }).then(function (res) {
          return res.text();
        }).then(function (firebaseToken) {
          return firebase.auth().signInWithCustomToken(firebaseToken);
        }).then(function (result) {
          return result.user.getIdToken();
        }).then(function (idToken) {
          var csrfToken = getCookie('csrfToken');
          return postIdTokenToSessionLogin("/user/sessionLogin", {
            idToken: idToken,
            csrfToken: csrfToken
          });
        }).then(function () {
          return firebase.auth().signOut();
        })["catch"](function (e) {
          window.alert("로그인에 실패했습니다.");
          console.log(e);
        });
      },
      fail: function fail(err) {
        console.log(JSON.stringify(err));
      }
    });
  } //]]>


  googleBtn.addEventListener("click", googleSignIn);
  kakaoBtn.addEventListener("click", loginWithKakao);
})(window, document);