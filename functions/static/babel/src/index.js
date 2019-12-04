(() => {
    var univSelect = document.getElementById('univ_select');

    function changeRoomList() {
        if (this.value === "") return;
        window.location.href = `https://bangdangi.web.app/board/list/${this.value}`;
    }

    univSelect.onchange = changeRoomList;
})();

(() => {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
            .then(() => console.log('serviceWorker is registered!'))
            .catch((err) => console.log(err));
        });
    }
})();
