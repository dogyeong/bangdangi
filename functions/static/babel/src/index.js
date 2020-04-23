(() => {
    var placeSelect = document.getElementById("place_select");

    function changeRoomList() {
        if (this.value === "") return;
        else if (this.value === "other") window.location.href = '/request';
        else window.location.href = `/board/list/${this.value}`;
    }

    placeSelect.onchange = changeRoomList;
})();


const header = document.querySelector('header');
const vh = window.innerHeight;

function checkScroll() {
    if (window.pageYOffset >= vh) {
        header.classList.remove('transparent');
    }
    else {
        header.classList.add('transparent');
    }
}

header.classList.add('transparent');
checkScroll();

window.addEventListener('scroll', checkScroll);



