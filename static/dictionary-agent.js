(function (global) {
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE']);
  const VALUE_INPUT_TYPES = new Set(['button', 'submit', 'reset']);

  function normalizeSpaces(text) {
    return (text || '').replace(/\s+/g, ' ').trim();
  }

  function hasLatinLetters(text) {
    return /[A-Za-z]/.test(text || '');
  }

  function parseSelectorList(selectors) {
    return Array.isArray(selectors) ? selectors.filter(Boolean).join(',') : '';
  }

  function shouldSkipElement(element, config) {
    if (!element) return true;
    if (SKIP_TAGS.has(element.tagName)) return true;
    if (element.closest('[data-no-translate]')) return true;
    const selectorList = parseSelectorList(config && config.skipSelectors);
    return !!(selectorList && element.closest(selectorList));
  }

  function ensureOriginalText(node) {
    if (typeof node.__safarOriginalText === 'undefined') {
      node.__safarOriginalText = node.nodeValue;
    }
    return node.__safarOriginalText || '';
  }

  function ensureOriginalAttr(element, attrName, value) {
    if (!element.__safarOriginalAttrs) {
      element.__safarOriginalAttrs = {};
    }
    if (typeof element.__safarOriginalAttrs[attrName] === 'undefined') {
      element.__safarOriginalAttrs[attrName] = value;
    }
    return element.__safarOriginalAttrs[attrName] || '';
  }

  function buildTextRecord(node) {
    const raw = ensureOriginalText(node);
    const source = normalizeSpaces(raw);
    if (!source || !hasLatinLetters(source)) return null;

    const leading = raw.match(/^\s*/);
    const trailing = raw.match(/\s*$/);
    return {
      key: `text:${source}`,
      source,
      apply(value) {
        node.nodeValue = `${leading ? leading[0] : ''}${value}${trailing ? trailing[0] : ''}`;
      },
    };
  }

  function buildAttrRecord(element, attrName) {
    const original = ensureOriginalAttr(element, attrName, element.getAttribute(attrName) || '');
    const source = normalizeSpaces(original);
    if (!source || !hasLatinLetters(source)) return null;

    return {
      key: `attr:${attrName}:${source}`,
      source,
      apply(value) {
        element.setAttribute(attrName, value);
      },
    };
  }

  function buildValueRecord(element) {
    const original = ensureOriginalAttr(element, 'value', element.value || '');
    const source = normalizeSpaces(original);
    if (!source || !hasLatinLetters(source)) return null;

    return {
      key: `value:${source}`,
      source,
      apply(value) {
        element.value = value;
      },
    };
  }

  function collect(root, config) {
    const records = [];

    if (!root) {
      return records;
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.parentElement) return NodeFilter.FILTER_REJECT;
        if (shouldSkipElement(node.parentElement, config)) return NodeFilter.FILTER_REJECT;
        const raw = ensureOriginalText(node);
        return hasLatinLetters(raw) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });

    let node;
    while ((node = walker.nextNode())) {
      const record = buildTextRecord(node);
      if (record) {
        records.push(record);
      }
    }

    root.querySelectorAll('[placeholder], [title], [aria-label], img[alt], meta[name="description"], input[value]').forEach((element) => {
      if (shouldSkipElement(element, config)) return;

      ['placeholder', 'title', 'aria-label', 'alt'].forEach((attrName) => {
        if (!element.hasAttribute(attrName)) return;
        const record = buildAttrRecord(element, attrName);
        if (record) {
          records.push(record);
        }
      });

      if (
        element.tagName === 'INPUT' &&
        VALUE_INPUT_TYPES.has((element.getAttribute('type') || '').toLowerCase())
      ) {
        const record = buildValueRecord(element);
        if (record) {
          records.push(record);
        }
      }
    });

    return records;
  }

  function buildInventory(records) {
    return Array.from(new Set((records || []).map((record) => record.source))).sort();
  }

  function watch(root, onChange) {
    if (!root || typeof MutationObserver === 'undefined') {
      return null;
    }

    let timer = null;
    const observer = new MutationObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => onChange && onChange(), 150);
    });

    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label', 'alt', 'value'],
    });

    return observer;
  }

  global.SafarDictionaryAgent = {
    collect,
    watch,
    buildInventory,
    normalizeSpaces,
    hasLatinLetters,
  };
})(window);
