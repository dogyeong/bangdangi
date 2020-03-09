(window => {
    /* NodeList foreach pollyfill */
    if (window.NodeList && !NodeList.prototype.forEach) {
        NodeList.prototype.forEach = Array.prototype.forEach;
    }


    /* 연락하기 */
    if (!dataDone) {
        // 예약하기 버튼
        var reserveBtn = document.querySelectorAll(".reserve-btn");

        // 연락하기, 문의하기 버튼
        var contactBtn = document.querySelectorAll(".contact-btn");

        // pc, 모바일 체크
        let checkBrowser = function() {
            let filter = "win16|win32|win64|mac|macintel";

            if (navigator.platform) {
                if (filter.indexOf(navigator.platform.toLowerCase()) < 0) {
                    return "MOBILE";
                } else {
                    return "PC";
                }
            }
            return  "MOBILE";
        }

        var contactCallback = function() {
            var contact = this.dataset.contact;
            var type = this.dataset.type;

            if (type === "tel") {
                if (checkBrowser() ===  "MOBILE")
                    window.location = `tel:${contact}`;
                else
                    window.alert(`방이 마음에 드셨나요? :) 문의사항은 ${contact}으로 연락해주세요. 보신 링크를 함께 문자로 남겨주시면 빠른 상담을 도와드리겠습니다.`);
            }
            else if (type === "sms") {
                if (checkBrowser() ===  "MOBILE")
                    window.location = `sms:${contact}${checkMobile() === "iphone" ? "&" : "?"}body=방단기에서 단기원룸 글 보고 문의드려요~%0a입주날짜:%0a거주기간:%0a방 보러 갈 날짜:%0a추가 문의사항:%0a%0a${window.location.href}`;
                else
                    window.alert(`방이 마음에 드셨나요? :) 문의사항은 ${contact}으로 연락해주세요. 보신 링크를 함께 문자로 남겨주시면 빠른 상담을 도와드리겠습니다.`);  
            }
            else window.location = `${contact}`;
        };

        var checkMobile = function() {
            const UA = navigator.userAgent.toLocaleLowerCase();
            if (UA.indexOf("android") > -1) return "android";
            else if (UA.indexOf("iphone") > -1) return "iphone";
            else return "other";
        };

        contactBtn.forEach(i => i.addEventListener("click", contactCallback));
    }

    /* 카카오 공유하기 */
    //<![CDATA[
    // // 사용할 앱의 JavaScript 키를 설정해 주세요.
    Kakao.init("07ac8a4da1c7b6aa00a5947dc53f964a");
    // // 카카오링크 버튼을 생성합니다. 처음 한번만 호출하면 됩니다.
    Kakao.Link.createDefaultButton({
        container: "#kakao-link-btn", // 컨테이너는 아까 위에 버튼이 쓰여진 부분 id
        objectType: "feed",
        content: {
            // 여기부터 실제 내용이 들어갑니다.
            title: dataKakao.title, // 본문 제목
            description: dataKakao.description, // 본문 바로 아래 들어가는 영역
            imageUrl: dataKakao.imageUrl, // 이미지
            link: {
                mobileWebUrl: dataKakao.link.mobileWebUrl,
                webUrl: dataKakao.link.webUrl,
            },
        },
    });
    //]]>

    /* 공유하기 */
    var share_btn = document.querySelector(".share-btn");
    var url_share = document.querySelector(".url-link-btn");
    var dimmed_close = document.querySelector(".dimmed-close");

    function toggleShare() {
        document.querySelector('.dimmed-share').classList.toggle('visible');
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
    dimmed_close.addEventListener("click", toggleShare);
    url_share.addEventListener("click", copyURL);


    /* linkify : 상세설명에 url이 포함돼있으면 링크 걸어주기 */
    function linkify(text) {
        
        /* eslint-disable */
        //URLs starting with http://, https://, or ftp://
        let replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;

        //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
        let replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
        /* eslint-enable */
        
        let regex = new RegExp(replacePattern1);
        let result  = regex.exec(text);
        
        if (result !== null) {
            let url = result[0];
            text = text.replace(url, `<a href="${url}" target="_blank" rel="noopener">${url}</a>`);
        }
        else {
            regex = new RegExp(replacePattern2);
            result = regex.exec(text);

            if (result !== null) {
                let url = result[0];
                text = text.replace(url, `<a href="${url}" target="_blank" rel="noopener">${url}</a>`);
            }
        }

        return text;
    }

    // 상세설명, 거래후기의 텍스트
    let text = document.querySelector('.detail-container > .text') ? document.querySelector('.detail-container > .text').innerHTML : null;
    let text2 = document.querySelector('.review-container > .text') ? document.querySelector('.review-container > .text').innerHTML : null;

    // 텍스트의 링크를 찾아서 linkify
    if (text !== null) document.querySelector('.detail-container > .text').innerHTML = linkify(text);
    if (text2 !== null) document.querySelector('.review-container > .text').innerHTML = linkify(text2);

    window.onload = function() {
        document.querySelectorAll(".image_container > div").forEach(div => {
            let url = div.style.backgroundImage.replace('url("', "").replace('")', "");
            checkImage(url, div);
        });

        linkify();
    };


    /* 스크롤 할 때 하단고정버튼 visible 변경 */
    const fixedBtn = document.querySelector('.fixed-btn-container');
    const toggleOffset = 360;

    var checkOffset = () => {
        let isVisible = fixedBtn.classList.contains('visible');

        if (!isVisible && window.pageYOffset >= toggleOffset) {
            fixedBtn.classList.add('visible');
            setTimeout(300, () => { fixedBtn.style.visibility = 'visible' })
        }
        else if (isVisible && window.pageYOffset < toggleOffset) {
            fixedBtn.classList.remove('visible');
            setTimeout(300, () => { fixedBtn.style.visibility = 'hidden' })
        }
    }
    checkOffset();

    document.addEventListener('scroll', checkOffset);
    
})(window);
