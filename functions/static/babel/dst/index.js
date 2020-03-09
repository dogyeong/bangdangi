"use strict";

(function () {
  var univSelect = document.getElementById("univ_select");

  function changeRoomList() {
    if (this.value === "") return;else if (this.value === "other") window.location.href = '/request';else window.location.href = "/board/list/".concat(this.value);
  }

  univSelect.onchange = changeRoomList;
})();

(function () {
  var header = document.querySelector('header');
  var vh = window.innerHeight;
  header.classList.add('transparent');
  window.addEventListener('scroll', function (e) {
    if (window.pageYOffset >= vh) {
      header.classList.remove('transparent');
    } else {
      header.classList.add('transparent');
    }
  });
})();