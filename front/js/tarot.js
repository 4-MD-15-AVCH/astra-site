const API_URL = 'http://localhost:3001';
const POSITIONS = ['Прошлое', 'Настоящее', 'Будущее'];
const PLACEHOLDER_SRCS = ['assets/img/card1.png', 'assets/img/card2.png', 'assets/img/card3.png'];

const form = document.getElementById('tarot-form');
const submitBtn = document.getElementById('submit-btn');
const cardsEl = document.getElementById('tarot-cards');
const readingTextEl = document.getElementById('tarot-reading-text');
const errorEl = document.getElementById('tarot-error');
const loadingEl = document.getElementById('tarot-loading');
const modal = document.getElementById('tarot-modal');
const modalClose = document.getElementById('modal-close');
const modalImg = document.getElementById('modal-img');
const modalTitle = document.getElementById('modal-title');
const modalMeaning = document.getElementById('modal-meaning');

let typewriterTimer = null;

const showError = (msg) => {
  if (errorEl) {
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  }
};

const hideError = () => {
  if (errorEl) errorEl.style.display = 'none';
};

const renderCards = (cards, animate) => {
  if (!cardsEl) return;
  if (animate && cardsEl.querySelectorAll('.tarot-card').length > 0) {
    cardsEl.classList.add('is-animating');
    setTimeout(() => {
      injectCards(cards);
      cardsEl.classList.remove('is-animating');
      cardsEl.classList.add('is-entering');
      cardsEl.querySelectorAll('.tarot-card').forEach((el) => el.classList.add('tarot-card-in'));
      setTimeout(() => {
        cardsEl.classList.remove('is-entering');
        cardsEl.querySelectorAll('.tarot-card').forEach((el) => el.classList.add('flipped'));
      }, 1800);
    }, 420);
  } else {
    injectCards(cards);
  }
};

const injectCards = (cards) => {
  if (!cardsEl) return;
  cardsEl.innerHTML = '';
  cardsEl.removeAttribute('data-default');
  cards.forEach((card, i) => {
    const nameRu = card.name_ru || card.name;
    const imgSrc = card.imageUrl || PLACEHOLDER_SRCS[i % 3];

    const back = document.createElement('div');
    back.className = 'card-back';
    back.innerHTML = '<span class="card-back-symbol">✦</span>';

    const front = document.createElement('div');
    front.className = 'card-front';
    const placeholder = document.createElement('div');
    placeholder.className = 'card-img-placeholder';
    placeholder.textContent = nameRu;

    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = nameRu;
    img.addEventListener('error', () => {
      img.classList.add('card-img-failed');
      placeholder.classList.add('is-visible');
    });

    front.append(img, placeholder);

    const inner = document.createElement('div');
    inner.className = 'card-flip-inner';
    inner.append(back, front);

    const flipWrap = document.createElement('div');
    flipWrap.className = 'card-flip';
    flipWrap.appendChild(inner);

    const labelEl = document.createElement('div');
    labelEl.className = 'card-label';
    labelEl.textContent = POSITIONS[i];

    const nameEl = document.createElement('div');
    nameEl.className = 'card-name-ru';
    nameEl.textContent = nameRu;

    const div = document.createElement('div');
    div.className = 'tarot-card';
    div.dataset.index = i;
    div.append(flipWrap, labelEl, nameEl);
    div.addEventListener('click', () => openModal(card, nameRu, img, placeholder));

    cardsEl.appendChild(div);
  });
};

const openModal = (card, nameRu, cardImg, cardPlaceholder) => {
  if (!modalTitle || !modalMeaning || !modal) return;
  modalTitle.textContent = nameRu;
  modalMeaning.textContent = card.meaning_ru || card.meaning_up || '—';

  const placeholderEl = document.getElementById('modal-placeholder');
  const hasImg = !cardImg.classList.contains('card-img-failed');

  if (hasImg && cardImg.src) {
    modalImg.src = cardImg.src;
    modalImg.alt = nameRu;
    modalImg.style.display = '';
    modalImg.classList.remove('card-img-failed');
    if (placeholderEl) placeholderEl.style.display = 'none';
  } else {
    modalImg.style.display = 'none';
    if (placeholderEl) {
      placeholderEl.textContent = nameRu;
      placeholderEl.style.display = 'flex';
    }
  }
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
};

const closeModal = () => {
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
};

const renderReadingText = (narrative) => {
  const p = document.getElementById('tarot-narrative');
  if (!p) return;

  const text = narrative || '';
  p.innerHTML = '<span id="typewriter-text"></span><span class="narrative-typewriter-cursor" id="typewriter-cursor" aria-hidden="true"></span>';

  const span = document.getElementById('typewriter-text');
  const cursor = document.getElementById('typewriter-cursor');
  if (!span || !cursor) return;

  if (typewriterTimer) clearTimeout(typewriterTimer);
  let i = 0;
  const delay = 28;

  const typeChar = () => {
    if (i < text.length) {
      span.textContent += text[i];
      i++;
      typewriterTimer = setTimeout(typeChar, delay);
    } else {
      cursor.remove();
      typewriterTimer = null;
    }
  };
  typeChar();
};

const initTarot = () => {
  if (!form || !cardsEl) return;

  cardsEl.addEventListener('click', (e) => {
    const card = e.target.closest('.tarot-card[data-default="1"]');
    if (!card) return;
    const img = card.querySelector('.card-front img');
    if (!img) return;
    modalImg.src = img.src;
    modalImg.alt = card.dataset.name;
    modalImg.style.display = '';
    const ph = document.getElementById('modal-placeholder');
    if (ph) ph.style.display = 'none';
    modalTitle.textContent = card.dataset.name || '';
    modalMeaning.textContent = card.dataset.meaning || '';
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();
    submitBtn.disabled = true;
    loadingEl.style.display = 'block';

    const name = document.getElementById('name')?.value.trim() ?? '';
    const birthDate = document.getElementById('birthDate')?.value ?? '';
    const gender = document.getElementById('gender')?.value ?? '';

    try {
      const res = await fetch(`${API_URL}/api/reading`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, birthDate, gender }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        showError(data.error || 'Ошибка запроса. Убедитесь, что запущен сервер (cd backend && node server.js).');
        return;
      }

      if (!data.cards || data.cards.length === 0) {
        showError('Карты не получены.');
        return;
      }

      let narrative = data.narrative;
      if (!narrative && data.cards.length >= 3) {
        const names = data.cards.map((c) => c.name_ru || c.name);
        narrative = `Ваш расклад на сегодня: ${names[0]}, ${names[1]} и ${names[2]}. ${data.cards[0].meaning_ru || ''} ${data.cards[1].meaning_ru || ''} ${data.cards[2].meaning_ru || ''} Доверьтесь себе и не избегайте выбора: сегодняшний шаг может запустить важный поворот в вашу пользу.`;
      }

      renderCards(data.cards, true);
      renderReadingText(narrative);
      if (readingTextEl) readingTextEl.classList.add('is-revealed');
    } catch (err) {
      showError('Не удалось подключиться к серверу. Запустите: cd backend && node server.js');
    } finally {
      loadingEl.style.display = 'none';
      submitBtn.disabled = false;
    }
  });

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modal) {
    modal.addEventListener('click', (ev) => {
      if (ev.target === modal) closeModal();
    });
  }
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape') closeModal();
  });
};

export { initTarot };
