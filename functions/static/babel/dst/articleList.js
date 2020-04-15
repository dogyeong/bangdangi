"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

(function () {
  var placeSelect = document.getElementById("place_select");
  var filterBtn = document.querySelector(".tune");
  var filterCancel = document.querySelector(".filter-cancel");
  var rangeInput = document.querySelector('input[type="range"]');
  var sortBtn = document.querySelectorAll(".sortBtn");
  var filter = document.querySelector(".filter-container");
  document.getElementById("lower").style.display = "block";

  function changeRoomList() {
    if (this.value === "") return;else if (this.value === "other") window.location.href = '//pf.kakao.com/_HxcGdT/chat';else window.location.href = "/board/list/".concat(this.value);
  }

  function toggleFilter() {
    if (filter.classList.toggle("visible")) {
      filterBtn.classList.add('active');
    } else {
      filterBtn.classList.remove('active');
    }

    event.preventDefault();
  }

  function hideFilter() {
    filter.classList.remove("visible");
    filterBtn.classList.remove("active");
    event.preventDefault();
  }

  function updateRangeValue() {
    var value = this.value;
    document.querySelector(".range_value").innerText = value;
  }

  function sortList() {
    if (this.classList.contains("active")) return;
    var list = Array.from(document.querySelectorAll(".article-list a"));
    var ad = list.filter(function (i) {
      return i.classList.contains("request_container");
    });
    var idx;

    if (ad.length > 0) {
      idx = list.indexOf(ad[0]); // 광고의 인덱스를 찾아서

      list.splice(idx, 1); // 리스트 중에서 광고를 제거
    }

    if (this.dataset.sortby === "time") {
      list = sortByTime(list);
      this.classList.toggle("active");
      document.querySelector('.sortBtn[data-sortby="view"]').classList.toggle("active");
    } else {
      list = sortByView(list);
      this.classList.toggle("active");
      document.querySelector('.sortBtn[data-sortby="time"]').classList.toggle("active");
    }

    if (ad.length > 0) {
      list.splice(idx, 0, ad[0]); // 리스트에 광고 삽입
    } // 리스트의 원소들을 다시 article로 감싸준다


    list = list.map(function (a) {
      var article = document.createElement('article');
      article.classList.add('article');
      article.append(a);
      return article;
    });
    var main = document.querySelector(".article-list");
    main.innerHTML = "";
    main.append.apply(main, _toConsumableArray(list));
  }

  function sortByTime(list) {
    return list.sort(function (a, b) {
      return parseInt(b.dataset.timestamp) - parseInt(a.dataset.timestamp); // 리스트 정렬
    });
  }

  function sortByView(list) {
    return list.sort(function (a, b) {
      return parseInt(b.dataset.views) - parseInt(a.dataset.views); // 리스트 정렬
    });
  }

  placeSelect.onchange = changeRoomList;
  filterBtn.addEventListener("click", toggleFilter);
  filterCancel.addEventListener("click", hideFilter);
  rangeInput.addEventListener("input", updateRangeValue);
  sortBtn.forEach(function (i) {
    return i.addEventListener("click", sortList);
  });
})();