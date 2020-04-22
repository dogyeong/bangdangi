
/**
 * 기존 사진의 제거 버튼을 눌렀을 때 동작하는 콜백 함수
 * @param {} btn 
 */
const removeThumb = (btn) => {
    btn.parentNode.remove();
    document.querySelector(`input[name="originalImage[]"][value="${btn.dataset.image}"]`).remove();
}

/**
 * 사진 추가 시 썸네일 표시
 */
document.getElementById("images").onchange = function () {
    const files = this.files;
    const thumbs = document.querySelector('.thumbs');
    
    document.querySelectorAll('.new-image').forEach(image => image.remove());

    // read the image file as a data URL.
    for (let file of files) {   
        const url = URL.createObjectURL(file);
        thumbs.innerHTML += `
            <div class="thumb new-image" style="background:center / contain no-repeat url('${url}');">
            </div>
        `
    }
};


