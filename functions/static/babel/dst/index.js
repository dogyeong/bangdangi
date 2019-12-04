"use strict";

(function () {
  var univSelect = document.getElementById('univ_select');

  function changeRoomList() {
    if (this.value === "") return;
    window.location.href = "https://bangdangi.web.app/board/list/".concat(this.value);
  }

  univSelect.onchange = changeRoomList;
})();

(function () {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/service-worker.js').then(function () {
        return console.log('serviceWorker is registered!');
      })["catch"](function (err) {
        return console.log(err);
      });
    });
  }
})();