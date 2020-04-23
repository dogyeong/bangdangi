var toggleBtn = document.querySelector('button.navbar-toggle');
var faIcon = document.querySelector('button.navbar-toggle > i');

function checkIcon() {
    if (toggleBtn.classList.contains('collapsed')) {
        faIcon.classList.replace('fa-bars', 'fa-times'); 
    }
    else {
        faIcon.classList.replace('fa-times', 'fa-bars');       
    }
}

toggleBtn.addEventListener('click', checkIcon);