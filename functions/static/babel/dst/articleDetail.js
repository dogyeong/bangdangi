"use strict";

(function (window) {
  /* NodeList foreach pollyfill */
  if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
  }
  /* 연락하기 */


  if (!dataDone) {
    // 예약하기 버튼
    var reserveBtn = document.querySelectorAll(".reserve-btn"); // 연락하기, 문의하기 버튼

    var contactBtn = document.querySelectorAll(".contact-btn"); // pc, 모바일 체크

    var checkBrowser = function checkBrowser() {
      var filter = "win16|win32|win64|mac|macintel";

      if (navigator.platform) {
        if (filter.indexOf(navigator.platform.toLowerCase()) < 0) {
          return "MOBILE";
        } else {
          return "PC";
        }
      }

      return "MOBILE";
    };

    var contactCallback = function contactCallback() {
      var contact = '01042311255';
      var type = this.dataset.type;
      if (checkBrowser() === "MOBILE") window.location = "sms:".concat(contact).concat(checkMobile() === "iphone" ? "&" : "?", "body=\uBC29\uB2E8\uAE30\uC5D0\uC11C \uB2E8\uAE30\uC6D0\uB8F8 \uAE00 \uBCF4\uACE0 \uBB38\uC758\uB4DC\uB824\uC694~%0a\uC785\uC8FC\uB0A0\uC9DC:%0a\uAC70\uC8FC\uAE30\uAC04:%0a\uBC29 \uBCF4\uB7EC \uAC08 \uB0A0\uC9DC:%0a\uCD94\uAC00 \uBB38\uC758\uC0AC\uD56D:%0a%0a").concat(window.location.href);else window.alert("\uBC29\uC774 \uB9C8\uC74C\uC5D0 \uB4DC\uC168\uB098\uC694? :) \uBB38\uC758\uC0AC\uD56D\uC740 ".concat(contact, "\uC73C\uB85C \uC5F0\uB77D\uD574\uC8FC\uC138\uC694. \uBCF4\uC2E0 \uB9C1\uD06C\uB97C \uD568\uAED8 \uBB38\uC790\uB85C \uB0A8\uACA8\uC8FC\uC2DC\uBA74 \uBE60\uB978 \uC0C1\uB2F4\uC744 \uB3C4\uC640\uB4DC\uB9AC\uACA0\uC2B5\uB2C8\uB2E4."));
    };

    var checkMobile = function checkMobile() {
      var UA = navigator.userAgent.toLocaleLowerCase();
      if (UA.indexOf("android") > -1) return "android";else if (UA.indexOf("iphone") > -1) return "iphone";else return "other";
    };

    contactBtn.forEach(function (i) {
      return i.addEventListener("click", contactCallback);
    });
  }
  /* 카카오 공유하기 */
  //<![CDATA[
  // // 사용할 앱의 JavaScript 키를 설정해 주세요.


  Kakao.init("07ac8a4da1c7b6aa00a5947dc53f964a"); // // 카카오링크 버튼을 생성합니다. 처음 한번만 호출하면 됩니다.

  Kakao.Link.createDefaultButton({
    container: "#kakao-link-btn",
    // 컨테이너는 아까 위에 버튼이 쓰여진 부분 id
    objectType: "feed",
    content: {
      // 여기부터 실제 내용이 들어갑니다.
      title: dataKakao.title,
      // 본문 제목
      description: dataKakao.description,
      // 본문 바로 아래 들어가는 영역
      imageUrl: dataKakao.imageUrl,
      // 이미지
      link: {
        mobileWebUrl: dataKakao.link.mobileWebUrl,
        webUrl: dataKakao.link.webUrl
      }
    }
  }); //]]>

  /* 공유하기 */

  var share_btn = document.querySelector(".share-btn");
  var url_share = document.querySelector(".url-link-btn");
  var dimmed_close = document.querySelector(".dimmed-close");

  function toggleShare() {
    document.querySelector('.dimmed-share').classList.toggle('visible');
  }

  function copyURL() {
    var t = document.createElement("textarea");
    document.body.appendChild(t);
    t.value = dataKakao.link.mobileWebUrl;
    t.select();
    document.execCommand("copy");
    document.body.removeChild(t);
    window.alert("URL이 복사되었습니다.");
  }

  share_btn.addEventListener("click", toggleShare);
  dimmed_close.addEventListener("click", toggleShare);
  url_share.addEventListener("click", copyURL);
  /* linkify : 상세설명에 url이 포함돼있으면 링크 걸어주기 */

  function linkify(text) {
    /* eslint-disable */
    //URLs starting with http://, https://, or ftp://
    var replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim; //URLs starting with "www." (without // before it, or it'd re-link the ones done above).

    var replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
    /* eslint-enable */

    var regex = new RegExp(replacePattern1);
    var result = regex.exec(text);

    if (result !== null) {
      var url = result[0];
      text = text.replace(url, "<a href=\"".concat(url, "\" target=\"_blank\" rel=\"noopener\">").concat(url, "</a>"));
    } else {
      regex = new RegExp(replacePattern2);
      result = regex.exec(text);

      if (result !== null) {
        var _url = result[0];
        text = text.replace(_url, "<a href=\"".concat(_url, "\" target=\"_blank\" rel=\"noopener\">").concat(_url, "</a>"));
      }
    }

    return text;
  } // 상세설명, 거래후기의 텍스트


  var text = document.querySelector('.detail-container > .text') ? document.querySelector('.detail-container > .text').innerHTML : null;
  var text2 = document.querySelector('.review-container > .text') ? document.querySelector('.review-container > .text').innerHTML : null; // 텍스트의 링크를 찾아서 linkify

  if (text !== null) document.querySelector('.detail-container > .text').innerHTML = linkify(text);
  if (text2 !== null) document.querySelector('.review-container > .text').innerHTML = linkify(text2);

  window.onload = function () {
    document.querySelectorAll(".image_container > div").forEach(function (div) {
      var url = div.style.backgroundImage.replace('url("', "").replace('")', "");
      checkImage(url, div);
    });
    linkify();
  };
  /* 스크롤 할 때 하단고정버튼 visible 변경 */


  var fixedBtn = document.querySelector('.fixed-btn-container');
  var toggleOffset = 360;

  var checkOffset = function checkOffset() {
    var isVisible = fixedBtn.classList.contains('visible');

    if (!isVisible && window.pageYOffset >= toggleOffset) {
      fixedBtn.classList.add('visible');
      setTimeout(300, function () {
        fixedBtn.style.visibility = 'visible';
      });
    } else if (isVisible && window.pageYOffset < toggleOffset) {
      fixedBtn.classList.remove('visible');
      setTimeout(300, function () {
        fixedBtn.style.visibility = 'hidden';
      });
    }
  };

  checkOffset();
  document.addEventListener('scroll', checkOffset);
})(window);