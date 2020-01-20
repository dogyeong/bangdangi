(() => {
    const univSelect = document.getElementById("univ_select");
    const filterBtn = document.querySelector(".tune_container");
    const rangeInput = document.querySelector('input[type="range"]');
    const sortBtn = document.querySelectorAll(".sortBtn");

    document.getElementById("lower").style.display = "block";

    function changeRoomList() {
        if (this.value === "") return;
        else if (this.value === "other") window.location.href = '//pf.kakao.com/_HxcGdT/chat';
        else window.location.href = `/board/list/${this.value}`;
    }

    function toggleFilter() {
        let filter = document.querySelector("#hashtag_container");

        if (filter.classList.toggle("visible")) {
            filterBtn.innerHTML = '<i class="xi-close-thin"></i>';
        } else {
            filterBtn.innerHTML = '<i class="xi-tune"></i>';
        }
    }

    function updateRangeValue() {
        let value = this.value;
        document.querySelector(".range_value").innerText = value;
    }

    function sortList() {
        if (this.classList.contains("active")) return;

        let list = Array.from(document.querySelectorAll("#main > a"));
        let ad = list.filter(i => i.classList.contains("request_container"));
        let idx;
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
        }
        let main = document.querySelector("#main");
        main.innerHTML = "";
        main.append(...list);
    }

    function sortByTime(list) {
        return list.sort((a, b) => {
            return parseInt(b.dataset.timestamp) - parseInt(a.dataset.timestamp); // 리스트 정렬
        });
    }

    function sortByView(list) {
        return list.sort((a, b) => {
            return parseInt(b.dataset.views) - parseInt(a.dataset.views); // 리스트 정렬
        });
    }

    univSelect.onchange = changeRoomList;
    filterBtn.addEventListener("click", toggleFilter);
    rangeInput.addEventListener("input", updateRangeValue);
    sortBtn.forEach(i => i.addEventListener("click", sortList));
})();
