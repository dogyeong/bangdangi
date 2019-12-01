(() => {
    var univSelect = document.getElementById('univ_select');

    function changeRoomList() {
      if (this.value === "") return;
      window.location.href = `https://bangdangi.web.app/board/list/${this.value}`;
    }

    univSelect.onchange = changeRoomList;
})();
