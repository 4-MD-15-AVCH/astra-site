const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;
const FEEDBACK_TABLE = process.env.FEEDBACK_TABLE || 'feedback_requests';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

app.use(cors());
app.use(express.json());

const MEANINGS_RU_MAJOR = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'meanings-ru.json'), 'utf8'));
  } catch (_) {
    return {};
  }
})();
const SUIT_RU = { wands: 'Жезлов', cups: 'Кубков', swords: 'Мечей', pentacles: 'Пентаклей' };
const VALUE_RU = { ace: 'Туз', two: 'Двойка', three: 'Тройка', four: 'Четвёрка', five: 'Пятёрка', six: 'Шестёрка', seven: 'Семёрка', eight: 'Восьмёрка', nine: 'Девятка', ten: 'Десятка', page: 'Паж', knight: 'Рыцарь', queen: 'Королева', king: 'Король' };

function firstSentence(str) {
  if (!str || typeof str !== 'string') return '';
  const end = str.search(/[.!?]\s/);
  return (end > 0 ? str.slice(0, end + 1) : str.slice(0, 100)).trim();
}

function getMeaningRu(card) {
  const m = MEANINGS_RU_MAJOR[card.name_short];
  if (m) return { nameRu: m.nameRu, meaningRu: m.meaningRu };
  if (card.suit && card.value) {
    const nameRu = (VALUE_RU[card.value] || card.value) + ' ' + (SUIT_RU[card.suit] || card.suit);
    const up = firstSentence(card.meaning_up || '');
    const rev = firstSentence(card.meaning_rev || '');
    const lines = [];
    if (up) lines.push(`Прямое положение (классика Waite): ${up}`);
    if (rev) lines.push(`Перевёрнутое: ${rev}`);
    lines.push('В раскладе значение уточняется соседними картами, вопросом и позицией.');
    return { nameRu, meaningRu: lines.join('\n\n') };
  }
  return { nameRu: card.name, meaningRu: 'Толкование по контексту расклада.' };
}

const IMG_BASE = 'https://www.sacred-texts.com/tarot/pkt/img';
const SUIT_CODE = { wands: 'wa', cups: 'cu', swords: 'sw', pentacles: 'pe' };

function getImageUrl(card) {
  if (card.type === 'major') {
    return `${IMG_BASE}/${card.name_short}.jpg`;
  }
  /* Младшие: на sacred-texts имена файлов = name_short (waac, wapa, cu02), а не suit+value_int (ошибочно давало wa11 вместо wapa). */
  if (card.type === 'minor' && card.name_short) {
    return `${IMG_BASE}/${card.name_short}.jpg`;
  }
  const suitCode = SUIT_CODE[card.suit] || 'wa';
  const num = String(card.value_int ?? 0).padStart(2, '0');
  return `${IMG_BASE}/${suitCode}${num}.jpg`;
}

function addImageUrls(cards) {
  return (cards || []).map((c) => ({ ...c, imageUrl: getImageUrl(c) }));
}

let cardsCache = null;

function loadCardsFromFile() {
  try {
    const filePath = path.join(__dirname, 'data', 'cards.json');
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(raw);
      if (data.cards && Array.isArray(data.cards) && data.cards.length >= 3) {
        return addImageUrls(data.cards);
      }
    }
  } catch (_) {}
  return null;
}

const FALLBACK_CARDS = addImageUrls([
  { type: 'major', name_short: 'ar00', name: 'The Fool', value_int: 0, suit: null, meaning_up: 'Folly, mania, extravagance, intoxication, delirium, frenzy.', meaning_rev: 'Negligence, absence, distribution, carelessness, apathy.', desc: 'A young man in gorgeous vestments pauses at the brink of a precipice; he is the spirit in search of experience.' },
  { type: 'major', name_short: 'ar01', name: 'The Magician', value_int: 1, suit: null, meaning_up: 'Skill, diplomacy, address, subtlety; self-confidence, will.', meaning_rev: 'Physician, Magus, mental disease, disgrace, disquiet.', desc: 'A youthful figure in the robe of a magician, having the countenance of divine Apollo. He signifies the divine motive in man, reflecting God.' },
  { type: 'major', name_short: 'ar02', name: 'The High Priestess', value_int: 2, suit: null, meaning_up: 'Secrets, mystery, the future as yet unrevealed; silence, tenacity; mystery, wisdom, science.', meaning_rev: 'Passion, moral or physical ardour, conceit, surface knowledge.', desc: 'She has the lunar crescent at her feet, a horned diadem on her head. She is the Queen of the borrowed light, the Moon nourished by the milk of the Supernal Mother.' },
]);

function loadCards() {
  if (cardsCache && cardsCache.length >= 3) return cardsCache;
  cardsCache = loadCardsFromFile();
  if (!cardsCache || cardsCache.length < 3) {
    console.warn('Using fallback cards (check backend/data/cards.json)');
    cardsCache = FALLBACK_CARDS;
  }
  return cardsCache;
}

function shuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildNarrative(cards) {
  if (!cards || cards.length < 3) return '';
  const names = cards.map((c) => c.name_ru || c.name);
  const intro = 'Ваш расклад на сегодня: ' + names[0] + ', ' + names[1] + ' и ' + names[2] + '. ';
  const m1 = (cards[0].meaning_ru || '').replace(/\s*В перевёрнутом:.*$/i, '').trim();
  const m2 = (cards[1].meaning_ru || '').replace(/\s*В перевёрнутом:.*$/i, '').trim();
  const m3 = (cards[2].meaning_ru || '').replace(/\s*В перевёрнутом:.*$/i, '').trim();
  const s1 = firstSentence(m1) || 'энергия прошлого влияет на сегодня.';
  const s2 = firstSentence(m2) || 'текущий момент несёт важные подсказки.';
  const s3 = firstSentence(m3) || 'перемены уже на подходе.';
  const cap = (str) => str.charAt(0).toUpperCase() + str.slice(1);
  const flow =
    cap(s1) + ' День наполнен этой энергией — вы способны влиять на ситуацию больше, чем кажется. ' +
    cap(s2) + ' Внутренние сомнения могут замедлять решение, однако ' + s3 + ' ' +
    'Доверьтесь себе и не избегайте выбора: сегодняшний шаг может запустить важный поворот в вашу пользу.';
  return intro + flow;
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidPhone(value) {
  return /^\+7 \(\d{3}\) \d{3} - \d{2} - \d{2}$/.test(value);
}

function isMissingColumnError(error, columnName) {
  if (!error || error.code !== 'PGRST204') return false;
  return typeof error.message === 'string' && error.message.includes(`'${columnName}' column`);
}

function getMissingColumnName(error) {
  if (!error || error.code !== 'PGRST204' || typeof error.message !== 'string') return '';
  const match = error.message.match(/'([^']+)' column/);
  return match ? match[1] : '';
}

app.get('/api/health', (_, res) => {
  res.json({ ok: true });
});

app.post('/api/reading', (req, res) => {
  try {
    const cards = loadCards();
    if (cards.length < 3) {
      return res.status(503).json({ error: 'Карты временно недоступны' });
    }
    const { name = '', birthDate = '', gender = '' } = req.body || {};
    const seed =
      [name, birthDate, gender].join('').split('').reduce((a, c) => a + c.charCodeAt(0), 0) ||
      Date.now();
    const shuffled = shuffle(cards, seed);
    const three = shuffled.slice(0, 3).map((c) => {
      const ru = getMeaningRu(c);
      return {
        name: c.name,
        name_short: c.name_short,
        name_ru: ru.nameRu,
        meaning_ru: ru.meaningRu,
        desc: c.desc,
        meaning_up: c.meaning_up,
        meaning_rev: c.meaning_rev,
        imageUrl: c.imageUrl,
        type: c.type,
        suit: c.suit,
      };
    });
    const narrative = buildNarrative(three);
    res.json({ cards: three, narrative });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/feedback', async (req, res) => {
  try {
    const {
      surname = '',
      name = '',
      patronymic = '',
      email = '',
      phone = '',
      question = '',
      consent = false,
    } = req.body || {};

    const payload = {
      surname: String(surname).trim(),
      name: String(name).trim(),
      patronymic: String(patronymic).trim(),
      email: String(email).trim(),
      phone: String(phone).trim(),
      question: String(question).trim(),
      consent: Boolean(consent),
    };

    const requiredStringFields = [
      payload.surname,
      payload.name,
      payload.patronymic,
      payload.email,
      payload.phone,
      payload.question,
    ];
    const hasEmptyField = requiredStringFields.some((value) => !isNonEmptyString(value));
    if (hasEmptyField || !payload.consent) {
      return res.status(400).json({ error: 'Все поля обязательны, согласие должно быть подтверждено.' });
    }
    if (!isValidEmail(payload.email)) {
      return res.status(400).json({ error: 'Некорректный email.' });
    }
    if (!isValidPhone(payload.phone)) {
      return res.status(400).json({ error: 'Некорректный телефон.' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase не настроен на сервере.' });
    }

    const insertPayload = {
      surname: payload.surname,
      name: payload.name,
      patronymic: payload.patronymic,
      email: payload.email,
      phone: payload.phone,
      question: payload.question,
      message: payload.question,
      consent: payload.consent,
    };

    let error = null;
    for (let attempt = 0; attempt < 8; attempt++) {
      ({ error } = await supabase.from(FEEDBACK_TABLE).insert([insertPayload]));
      if (!error) break;
      const missingColumn = getMissingColumnName(error);
      if (!missingColumn || !(missingColumn in insertPayload)) break;
      delete insertPayload[missingColumn];
    }

    if (error) {
      console.error(error);
      if (error.code === 'PGRST205') {
        return res.status(500).json({
          error: `Таблица '${FEEDBACK_TABLE}' не найдена. Создайте её через backend/sql/create_feedback_requests.sql или укажите FEEDBACK_TABLE в .env.`,
        });
      }
      if (isMissingColumnError(error, 'consent')) {
        return res.status(500).json({ error: 'В таблице нет поля consent. Добавьте колонку или измените схему формы.' });
      }
      return res.status(500).json({ error: 'Ошибка сохранения данных.' });
    }

    return res.status(201).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

/* Сайт с того же порта, что и API — без CORS и без блокировок file:// */
const siteRoot = path.join(__dirname, '..');
app.use(express.static(siteRoot));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Сайт + API: http://127.0.0.1:${PORT}/  (откройте в браузере этот адрес)`);
});
