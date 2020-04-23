"use strict";

(function () {
  var placeSelect = document.getElementById("place_select");

  function changeRoomList() {
    if (this.value === "") return;else if (this.value === "other") window.location.href = '/request';else window.location.href = "/board/list/".concat(this.value);
  }

  placeSelect.onchange = changeRoomList;
})();

var header = document.querySelector('header');
var vh = window.innerHeight;

function checkScroll() {
  if (window.pageYOffset >= vh) {
    header.classList.remove('transparent');
  } else {
    header.classList.add('transparent');
  }
}

header.classList.add('transparent');
checkScroll();
window.addEventListener('scroll', checkScroll);