const enableSectionOnScroll = (selector, options = { threshold: 0.25 }) => {
    const section = document.querySelector(selector);

    if (!section) {
        return;
    }

    section.classList.remove('is-visible');

    const observer = new IntersectionObserver((entries, sectionObserver) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            section.classList.add('is-visible');
            sectionObserver.unobserve(entry.target);
        });
    }, options);

    observer.observe(section);
};

const enableElementsOnScroll = (selectors, options = { threshold: 0.25 }) => {
    const targets = [
        ...new Set(
            selectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)))
        ),
    ];

    if (!targets.length) {
        return;
    }

    targets.forEach((target) => target.classList.remove('is-visible'));

    const observer = new IntersectionObserver((entries, elementsObserver) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            entry.target.classList.add('is-visible');
            elementsObserver.unobserve(entry.target);
        });
    }, options);

    targets.forEach((target) => observer.observe(target));
};

export const initAnimations = () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion) {
        document.querySelector('#about')?.classList.add('is-visible');
        [
            '.feature__title',
            '.feature__text--left-top',
            '.feature__text--right',
            '.feature__text--left',
            '.feature__text--right_bottom',
            '.feature__btn',
            '.feature-mobile__title',
            '.feature-mobile__item:nth-child(1)',
            '.feature-mobile__item:nth-child(2)',
            '.feature-mobile__item:nth-child(3)',
            '.feature-mobile__item:nth-child(4)',
            '.feature-mobile__btn',
            '.reading__title',
            '.reading__text--top',
            '.reading__text--bottom',
            '.reading__list',
            '.reading__text:not(.reading__text--top):not(.reading__text--bottom)',
            '.reading__form-wrapper',
            '.reading__cards',
            '.reading__result',
            '.feedback__title',
            '.feedback__text',
            '.feedback__form',
            '.geo__wrapper-text',
            '#geo__map',
            '.geo__text--bottom',
            '.geo__text--mobile',
        ].forEach((selector) => document.querySelector(selector)?.classList.add('is-visible'));
        return;
    }

    enableSectionOnScroll('#about', { threshold: 0.25 });
    enableElementsOnScroll(
        [
            '.feature__title',
            '.feature__text--left-top',
            '.feature__text--right',
            '.feature__text--left',
            '.feature__text--right_bottom',
            '.feature__btn',
            '.feature-mobile__title',
            '.feature-mobile__item:nth-child(1)',
            '.feature-mobile__item:nth-child(2)',
            '.feature-mobile__item:nth-child(3)',
            '.feature-mobile__item:nth-child(4)',
            '.feature-mobile__btn',
        ],
        { threshold: 0.3 }
    );
    enableElementsOnScroll(
        [
            '.reading__title',
            '.reading__text--top',
            '.reading__text--bottom',
            '.reading__list',
            '.reading__text:not(.reading__text--top):not(.reading__text--bottom)',
            '.reading__form-wrapper',
            '.reading__cards',
            '.reading__result',
        ],
        { threshold: 0.25 }
    );
    enableElementsOnScroll(
        [
            '.feedback__title',
            '.feedback__text',
            '.feedback__form',
        ],
        { threshold: 0.25 }
    );
    enableElementsOnScroll(
        [
            '.geo__wrapper-text',
            '#geo__map',
            '.geo__text--bottom',
            '.geo__text--mobile',
        ],
        { threshold: 0.2 }
    );
};
