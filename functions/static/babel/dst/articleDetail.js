"use strict";

(function (window) {
  /* NodeList foreach pollyfill */
  if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
  }
  /* 이미지 슬라이더 */


  var imageContainer = document.getElementsByClassName("image_container")[0];

  if (dataImages) {
    var sliderCounter = document.getElementsByClassName("slider_counter")[0];
    var imgNum = imageContainer.childElementCount;
    var currentCount = 1;
    var leftBtn = document.getElementsByClassName("slider_btn_l")[0];
    var rightBtn = document.getElementsByClassName("slider_btn_r")[0];
    sliderCounter.innerText = "".concat(currentCount, "/").concat(imgNum);

    var moveL = function moveL() {
      if (currentCount === 1) currentCount = imgNum;else currentCount -= 1;
      imageContainer.style.left = "".concat((currentCount - 1) * -100, "%");
      sliderCounter.innerText = "".concat(currentCount, "/").concat(imgNum);
    };

    var moveR = function moveR() {
      if (currentCount === imgNum) currentCount = 1;else currentCount += 1;
      imageContainer.style.left = "".concat((currentCount - 1) * -100, "%");
      sliderCounter.innerText = "".concat(currentCount, "/").concat(imgNum);
    };

    leftBtn.addEventListener("click", moveL);
    rightBtn.addEventListener("click", moveR);
  }
  /* 연락하기 */


  if (!dataDone) {
    var contactBtn = document.querySelectorAll(".contact"); // pc, 모바일 체크

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
      var contact = this.dataset.contact;
      var type = this.dataset.type;

      if (type === "tel") {
        if (checkBrowser() === "MOBILE") window.location = "tel:".concat(contact);else window.alert("\uBC29\uC774 \uB9C8\uC74C\uC5D0 \uB4DC\uC168\uB098\uC694? :) \uBB38\uC758\uC0AC\uD56D\uC740 ".concat(contact, "\uC73C\uB85C \uC5F0\uB77D\uD574\uC8FC\uC138\uC694. \uBCF4\uC2E0 \uB9C1\uD06C\uB97C \uD568\uAED8 \uBB38\uC790\uB85C \uB0A8\uACA8\uC8FC\uC2DC\uBA74 \uBE60\uB978 \uC0C1\uB2F4\uC744 \uB3C4\uC640\uB4DC\uB9AC\uACA0\uC2B5\uB2C8\uB2E4."));
      } else if (type === "sms") {
        if (checkBrowser() === "MOBILE") window.location = "sms:".concat(contact).concat(checkMobile() === "iphone" ? "&" : "?", "body=").concat(window.location.href, " \uBC29\uB2E8\uAE30\uC5D0\uC11C \uB2E8\uAE30\uC6D0\uB8F8 \uAE00 \uBCF4\uACE0 \uBB38\uC758\uB4DC\uB824\uC694~");else window.alert("\uBC29\uC774 \uB9C8\uC74C\uC5D0 \uB4DC\uC168\uB098\uC694? :) \uBB38\uC758\uC0AC\uD56D\uC740 ".concat(contact, "\uC73C\uB85C \uC5F0\uB77D\uD574\uC8FC\uC138\uC694. \uBCF4\uC2E0 \uB9C1\uD06C\uB97C \uD568\uAED8 \uBB38\uC790\uB85C \uB0A8\uACA8\uC8FC\uC2DC\uBA74 \uBE60\uB978 \uC0C1\uB2F4\uC744 \uB3C4\uC640\uB4DC\uB9AC\uACA0\uC2B5\uB2C8\uB2E4."));
      } else window.location = "".concat(contact);
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

  var share_btn = document.querySelector(".share_btn");
  var kakao_share = document.querySelector(".kakao_link_btn");
  var url_share = document.querySelector(".url_link_btn");
  var names = ["webkitTransitionEnd", "oTransitionEnd", "otransitionend", "transitionend", "transitionEnd"];

  function toggleShare() {
    kakao_share.classList.toggle("kakao_visible");
    url_share.classList.toggle("url_visible");
    if (kakao_share.classList.contains("kakao_visible")) kakao_share.style.opacity = 1;
    if (url_share.classList.contains("url_visible")) url_share.style.opacity = 1;
  }

  function transitionEvent(element, callback) {
    for (var i = 0; i < names.length; i++) {
      element.addEventListener(names[i], callback, false);
    }
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
  url_share.addEventListener("click", copyURL);
  transitionEvent(kakao_share, function () {
    if (!this.classList.contains("kakao_visible")) this.style.opacity = 0;
  });
  transitionEvent(url_share, function () {
    if (!this.classList.contains("url_visible")) this.style.opacity = 0;
  }); // checkImage : url의 orientaion을 확인해서 회전되있으면 target을 정방향으로 회전시킨다

  function checkImage(url, target) {
    loadImage(url, function (img, data) {
      if (data.exif) {
        var flag = data.exif.get("Orientation");
        if (flag === 6) target.style.transform = "rotate(90deg)";else if (flag === 3) target.style.transform = "rotate(180deg)";else if (flag === 8) target.style.transform = "rotate(270deg)";
      }
    }, {
      meta: true
    });
  }

  window.onload = function () {
    document.querySelectorAll(".image_container > div").forEach(function (div) {
      var url = div.style.backgroundImage.replace('url("', "").replace('")', "");
      checkImage(url, div);
    });
  };
})(window);