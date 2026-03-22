export function initMenu() {
    const header = document.querySelector('.header');
    const burger = document.querySelector('.header__burger');
    const closeBtn = document.querySelector('.header__close');
    const nav = document.getElementById('header-nav');

    if (!header || !burger || !nav) return;

    function openMenu() {
        header.classList.add('menu-open');
        burger.setAttribute('aria-expanded', 'true');
        burger.setAttribute('aria-label', 'Закрыть меню');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        header.classList.remove('menu-open');
        burger.setAttribute('aria-expanded', 'false');
        burger.setAttribute('aria-label', 'Открыть меню');
        document.body.style.overflow = '';
    }

    burger.addEventListener('click', () => {
        if (header.classList.contains('menu-open')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', closeMenu);
    }

    nav.querySelectorAll('.header__link').forEach(link => {
        link.addEventListener('click', closeMenu);
    });
}