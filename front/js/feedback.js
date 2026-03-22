import { API_BASE_URL } from './api-config.js';

const toastEl = document.getElementById('feedback-toast');
const toastTextEl = document.getElementById('feedback-toast-text');
const toastCloseEl = document.getElementById('feedback-toast-close');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+7 \(\d{3}\) \d{3} - \d{2} - \d{2}$/;
let toastTimer = null;

const showError = (errorEl, successEl, message) => {
  if (!errorEl) return;
  errorEl.textContent = message;
  errorEl.style.display = 'block';
  if (successEl) successEl.style.display = 'none';
};

const showSuccess = (errorEl, successEl, message) => {
  if (successEl) {
    successEl.textContent = message;
    successEl.style.display = 'none';
  }
  if (errorEl) errorEl.style.display = 'none';
  if (!toastEl || !toastTextEl) return;
  toastTextEl.textContent = message;
  toastEl.classList.add('is-visible');
  toastEl.setAttribute('aria-hidden', 'false');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('is-visible');
    toastEl.setAttribute('aria-hidden', 'true');
  }, 3500);
};

const clearMessages = (errorEl, successEl) => {
  if (errorEl) errorEl.style.display = 'none';
  if (successEl) successEl.style.display = 'none';
};

const INLINE_ERROR_CLASS = 'feedback__field-error';

const getFieldElement = (targetForm, fieldName) => targetForm?.elements[fieldName] ?? null;
const getErrorElement = (targetForm, fieldName) =>
  targetForm?.querySelector(`.${INLINE_ERROR_CLASS}[data-field="${fieldName}"]`) ?? null;

const showFieldError = (targetForm, fieldName, message) => {
  const field = getFieldElement(targetForm, fieldName);
  const error = getErrorElement(targetForm, fieldName);
  if (!field) return;
  if (!error) return;
  error.textContent = message;
  error.classList.add('is-visible');
  field.classList.add('is-invalid');
};

const clearFieldErrors = (targetForm) => {
  if (!targetForm) return;
  const invalidFields = targetForm.querySelectorAll('.is-invalid');
  invalidFields.forEach((field) => field.classList.remove('is-invalid'));
  const errors = targetForm.querySelectorAll(`.${INLINE_ERROR_CLASS}`);
  errors.forEach((el) => {
    el.textContent = '';
    el.classList.remove('is-visible');
  });
};

const validateFormData = (payload) => {
  const errors = {};
  const requiredMessages = {
    surname: 'Заполните фамилию.',
    name: 'Заполните имя.',
    patronymic: 'Заполните отчество.',
    email: 'Заполните почту.',
    phone: 'Заполните телефон.',
    question: 'Заполните вопрос.',
    consent: 'Подтвердите согласие на обработку данных.',
  };

  const requiredFields = ['surname', 'name', 'patronymic', 'email', 'phone', 'question'];
  for (const field of requiredFields) {
    if (!payload[field] || !String(payload[field]).trim()) {
      errors[field] = requiredMessages[field];
    }
  }

  if (!payload.consent) {
    errors.consent = requiredMessages.consent;
  }

  if (!errors.email && !EMAIL_RE.test(payload.email)) {
    errors.email = 'Укажите корректный email.';
  }

  if (!errors.phone && !PHONE_RE.test(payload.phone)) {
    errors.phone = 'Укажите корректный телефон.';
  }

  return errors;
};

const formatPhone = (rawValue) => {
  const digits = String(rawValue || '').replace(/\D/g, '');
  const normalized = digits.startsWith('8') ? `7${digits.slice(1)}` : digits;
  const phoneDigits = normalized.startsWith('7') ? normalized.slice(1, 11) : normalized.slice(0, 10);
  const d = phoneDigits.padEnd(10, '_').split('');
  const formatted = `+7 (${d[0]}${d[1]}${d[2]}) ${d[3]}${d[4]}${d[5]} - ${d[6]}${d[7]} - ${d[8]}${d[9]}`;
  return formatted.includes('_') ? formatted.replace(/[_\s\-()]+$/g, '').trimEnd() : formatted;
};

const collectPayload = (targetForm) => ({
  surname: targetForm.elements.surname?.value.trim() ?? '',
  name: targetForm.elements.name?.value.trim() ?? '',
  patronymic: targetForm.elements.patronymic?.value.trim() ?? '',
  email: targetForm.elements.email?.value.trim() ?? '',
  phone: targetForm.elements.phone?.value.trim() ?? '',
  question: targetForm.elements.question?.value.trim() ?? '',
  consent: Boolean(targetForm.elements.consent?.checked),
});

const initFeedback = () => {
  const forms = document.querySelectorAll('.feedback__form');
  if (!forms.length) return;

  forms.forEach((form) => {
    const submitBtn = form.querySelector('button[type="submit"]');
    const errorEl = form.querySelector('.feedback__status--error');
    const successEl = form.querySelector('.feedback__status--success');
    const phoneField = form.elements.phone ?? null;

    if (phoneField) {
      phoneField.placeholder = '+7 (999) 999 - 99 - 99';
      phoneField.maxLength = 22;
      phoneField.addEventListener('focus', () => {
        if (!phoneField.value) {
          phoneField.value = '+7 (';
        }
      });
      phoneField.addEventListener('input', () => {
        phoneField.value = formatPhone(phoneField.value);
      });
      phoneField.addEventListener('blur', () => {
        if (phoneField.value === '+7 (') {
          phoneField.value = '';
        }
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearMessages(errorEl, successEl);
      clearFieldErrors(form);

      const payload = collectPayload(form);
      const validationErrors = validateFormData(payload);
      if (Object.keys(validationErrors).length > 0) {
        Object.entries(validationErrors).forEach(([field, message]) => {
          showFieldError(form, field, message);
        });
        if (errorEl) errorEl.style.display = 'none';
        return;
      }

      if (submitBtn) submitBtn.disabled = true;

      try {
        const res = await fetch(`${API_BASE_URL}/api/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          showError(errorEl, successEl, data.error || 'Не удалось отправить форму. Попробуйте позже.');
          return;
        }

        form.reset();
        if (phoneField) {
          phoneField.value = '';
        }
        showSuccess(errorEl, successEl, 'Спасибо! Ваше сообщение отправлено.');
      } catch (_) {
        const hint =
          typeof window !== 'undefined' && window.location.protocol === 'https:'
            ? ' Сайт по HTTPS не может обратиться к http:// API — HTTPS у бэкенда, прокси /api или смените API_BASE_URL в js/api-config.js.'
            : ' Убедитесь, что backend слушает порт 3002; при открытии сайта с другого устройства в meta укажите http://ВАШ_IP:3002.';
        showError(
          errorEl,
          successEl,
          `Сервер недоступен.${hint}`,
        );
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });

    ['surname', 'name', 'patronymic', 'email', 'phone', 'question', 'consent'].forEach((fieldName) => {
      const field = getFieldElement(form, fieldName);
      const error = getErrorElement(form, fieldName);
      field?.addEventListener('input', () => {
        if (error) error.classList.remove('is-visible');
        field.classList.remove('is-invalid');
      });
      field?.addEventListener('change', () => {
        if (error) error.classList.remove('is-visible');
        field.classList.remove('is-invalid');
      });
    });
  });

  toastCloseEl?.addEventListener('click', () => {
    if (!toastEl) return;
    toastEl.classList.remove('is-visible');
    toastEl.setAttribute('aria-hidden', 'true');
    if (toastTimer) clearTimeout(toastTimer);
  });
};

export { initFeedback };
