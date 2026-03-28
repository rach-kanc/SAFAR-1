(function (global) {
  const LANG_STORAGE_KEY = 'safar_lang';
  const LANG_CYCLE = ['en', 'hi', 'sa'];
  const LANG_META = {
    en: { label: 'EN', flag: '🇮🇳', name: 'English' },
    hi: { label: 'हि', flag: '🇮🇳', name: 'हिन्दी' },
    sa: { label: 'सं', flag: '🇮🇳', name: 'संस्कृतम्' },
  };
  const GITA_QUOTES = [
    {
      sa: 'कर्मण्येवाधिकारस्ते\nमा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
      hi: 'तुम्हारा अधिकार केवल कर्म करने पर है, उसके फल पर नहीं।',
      en: 'You have a right to perform your duties, but not to the fruits of action.',
      ref: 'Bhagavad Gita 2.47',
    },
    {
      sa: 'योगस्थः कुरु कर्माणि सङ्गं त्यक्त्वा धनञ्जय।\nसिद्ध्यसिद्ध्योः समो भूत्वा समत्वं योग उच्यते॥',
      hi: 'समभाव से कर्म करो; यही योग है।',
      en: 'Perform action with balance and detachment. Equanimity is called yoga.',
      ref: 'Bhagavad Gita 2.48',
    },
    {
      sa: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।\nआत्मैव ह्यात्मनो बन्धुरात्मैव रिपुरात्मनः॥',
      hi: 'अपने आपको ऊपर उठाओ, स्वयं को गिराओ मत; मन ही मित्र है, मन ही शत्रु।',
      en: 'Lift yourself by your own mind; the mind can be your greatest friend or enemy.',
      ref: 'Bhagavad Gita 6.5',
    },
  ];

  let currentLang = localStorage.getItem(LANG_STORAGE_KEY) || 'en';
  let currentQuote = 0;
  let quoteInterval = null;
  let observer = null;
  let suppressObserverUntil = 0;
  let currentConfig = null;
  let currentRecords = [];

  function getManualTranslation(text, lang) {
    return (
      (currentConfig.manualTranslations &&
        currentConfig.manualTranslations[lang] &&
        currentConfig.manualTranslations[lang][text]) ||
      null
    );
  }

  function normalizeLang(lang) {
    return LANG_CYCLE.includes(lang) ? lang : 'en';
  }

  function updateToggleBtn() {
    document.querySelectorAll('#lang-toggle-btn').forEach((btn) => {
      const flagEl = btn.querySelector('.lang-flag');
      const labelEl = btn.querySelector('.lang-label');
      if (flagEl) flagEl.textContent = LANG_META[currentLang].flag;
      if (labelEl) labelEl.textContent = LANG_META[currentLang].label;
      btn.title = `Switch to ${LANG_META[LANG_CYCLE[(LANG_CYCLE.indexOf(currentLang) + 1) % LANG_CYCLE.length]].name}`;
    });
  }

  function applyKeyedTranslations(lang) {
    const dict = (currentConfig.keyedTranslations && currentConfig.keyedTranslations[lang]) || {};

    document.querySelectorAll('[data-i18n]').forEach((element) => {
      const key = element.dataset.i18n;
      if (!key || !dict[key]) return;
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        element.placeholder = dict[key];
      } else {
        element.textContent = dict[key];
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
      const key = element.dataset.i18nPlaceholder;
      if (key && dict[key]) {
        element.placeholder = dict[key];
      }
    });
  }

  function ensureDocumentRecords() {
    const docEl = document.documentElement;
    if (typeof docEl.__safarOriginalTitle === 'undefined') {
      docEl.__safarOriginalTitle = document.title;
    }

    const description = document.querySelector('meta[name="description"]');
    if (description && typeof description.__safarOriginalDescription === 'undefined') {
      description.__safarOriginalDescription = description.getAttribute('content') || '';
    }

    return [
      {
        key: `title:${docEl.__safarOriginalTitle || ''}`,
        source: docEl.__safarOriginalTitle || '',
        apply(value) {
          document.title = value;
        },
      },
      description
        ? {
            key: `meta:${description.__safarOriginalDescription || ''}`,
            source: description.__safarOriginalDescription || '',
            apply(value) {
              description.setAttribute('content', value);
            },
          }
        : null,
    ].filter((record) => record && global.SafarDictionaryAgent.hasLatinLetters(record.source));
  }

  function rebuildRecords() {
    const scanned = global.SafarDictionaryAgent.collect(document.body, currentConfig || {});
    currentRecords = [...ensureDocumentRecords(), ...scanned];
  }

  function resolveTranslation(text, lang) {
    if (lang === 'en') return text;
    return getManualTranslation(text, lang) || text;
  }

  function renderRecords(lang) {
    currentRecords.forEach((record) => {
      const translated = resolveTranslation(record.source, lang);
      record.apply(translated);
    });
  }

  function renderGitaBar(index) {
    const bar = document.getElementById('gita-quote-bar');
    if (!bar) return;

    const quote = GITA_QUOTES[index];
    const saEl = bar.querySelector('.gita-sanskrit');
    const transEl = bar.querySelector('.gita-translation');
    const refEl = bar.querySelector('.gita-ref');

    if (saEl) saEl.textContent = `${quote.sa.split('\n')[0]}...`;
    if (transEl) {
      transEl.textContent =
        currentLang === 'hi' ? quote.hi : currentLang === 'sa' ? quote.sa.split('\n')[0] : quote.en;
    }
    if (refEl) refEl.textContent = quote.ref;
  }

  function cycleGita() {
    const bar = document.getElementById('gita-quote-bar');
    if (bar) bar.classList.add('fading');
    setTimeout(() => {
      currentQuote = (currentQuote + 1) % GITA_QUOTES.length;
      renderGitaBar(currentQuote);
      if (bar) bar.classList.remove('fading');
    }, 350);
  }

  function openGitaModal() {
    const modal = document.getElementById('gita-full-modal');
    if (!modal) return;

    const quote = GITA_QUOTES[currentQuote];
    const saEl = modal.querySelector('.gita-modal-sanskrit');
    const hiEl = modal.querySelector('.gita-modal-hindi');
    const enEl = modal.querySelector('.gita-modal-english');
    const refEl = modal.querySelector('.gita-modal-ref');

    if (saEl) saEl.textContent = quote.sa;
    if (hiEl) hiEl.textContent = quote.hi;
    if (enEl) enEl.textContent = `"${quote.en}"`;
    if (refEl) refEl.textContent = `— ${quote.ref}`;

    modal.classList.add('open');
    clearInterval(quoteInterval);

    const closeBtn = modal.querySelector('.gita-modal-close');
    if (closeBtn) {
      closeBtn.onclick = function () {
        modal.classList.remove('open');
        quoteInterval = setInterval(cycleGita, 9000);
      };
    }
  }

  function initGitaBar() {
    const bar = document.getElementById('gita-quote-bar');
    if (!bar) return;
    currentQuote = Math.floor(Math.random() * GITA_QUOTES.length);
    renderGitaBar(currentQuote);
    clearInterval(quoteInterval);
    quoteInterval = setInterval(cycleGita, 9000);
    bar.addEventListener('click', openGitaModal);
  }

  function applyLanguage(lang) {
    currentLang = normalizeLang(lang);
    localStorage.setItem(LANG_STORAGE_KEY, currentLang);
    document.documentElement.lang = currentLang;
    document.body.dataset.lang = currentLang;
    suppressObserverUntil = Date.now() + 300;

    applyKeyedTranslations(currentLang);
    updateToggleBtn();
    renderRecords(currentLang);
    renderGitaBar(currentQuote);
  }

  function switchLanguage() {
    document.querySelectorAll('#lang-toggle-btn').forEach((btn) => btn.classList.add('switching'));
    setTimeout(() => {
      const nextIndex = (LANG_CYCLE.indexOf(currentLang) + 1) % LANG_CYCLE.length;
      applyLanguage(LANG_CYCLE[nextIndex]);
      document.querySelectorAll('#lang-toggle-btn').forEach((btn) => btn.classList.remove('switching'));
    }, 180);
  }

  function wireToggleButtons() {
    document.querySelectorAll('#lang-toggle-btn').forEach((btn) => {
      btn.addEventListener('click', switchLanguage);
    });
  }

  function boot(config) {
    currentConfig = Object.assign(
      {
        page: 'page',
        skipSelectors: ['.gita-bar', '#gita-full-modal', '#lang-toggle-btn'],
        keyedTranslations: {},
        manualTranslations: {},
      },
      config || {}
    );

    const start = function () {
      rebuildRecords();
      wireToggleButtons();
      updateToggleBtn();
      initGitaBar();
      applyLanguage(currentLang);

      if (observer) observer.disconnect();
      observer = global.SafarDictionaryAgent.watch(document.body, function () {
        if (Date.now() < suppressObserverUntil) return;
        rebuildRecords();
        applyLanguage(currentLang);
      });
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
      start();
    }
  }

  global.SafarTranslator = {
    boot,
    applyLanguage,
    getInventory() {
      return global.SafarDictionaryAgent.buildInventory(currentRecords);
    },
  };
})(window);
