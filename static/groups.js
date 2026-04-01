document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('g-search');
  const typeFilter = document.getElementById('g-type-filter');
  const groupCards = Array.from(document.querySelectorAll('.sangha-group-card'));
  const emptyFilterState = document.getElementById('group-empty-filter');
  const visibleCountLabel = document.getElementById('groups-visible-count');
  const coverShells = Array.from(document.querySelectorAll('[data-cover-shell]'));
  const photoInput = document.getElementById('group-photo-input');
  const photoPreview = document.getElementById('group-photo-preview');
  const photoName = document.getElementById('group-photo-name');
  const destinationInput = document.getElementById('destination-input');
  const groupNameInput = document.getElementById('group-name-input');
  const destinationUseButtons = Array.from(document.querySelectorAll('[data-destination-use]'));
  const destinationExploreButtons = Array.from(document.querySelectorAll('[data-destination-explore]'));
  const destinationDeskStatus = document.getElementById('destination-desk-status');
  const storyButtons = Array.from(document.querySelectorAll('[data-story-target]'));
  const jumpLinks = Array.from(document.querySelectorAll('[data-group-jump]'));
  const jumpTargets = {
    create: document.getElementById('group-create-panel'),
    explore: document.getElementById('groups-explore-panel'),
  };
  const hero = document.getElementById('hero-section');
  const heroBg = document.getElementById('groups-hero-bg');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const defaultPreviewImage = photoPreview ? (photoPreview.dataset.defaultImage || '') : '';
  let previewUrl = '';

  // Make key groups sections visible even if the shared reveal observer
  // misses them or another page script fails earlier.
  document.querySelectorAll('.reveal').forEach((element) => {
    element.classList.add('active', 'visible');
  });

  function focusSection(sectionKey) {
    jumpLinks.forEach((link) => {
      link.classList.toggle('active', link.dataset.groupJump === sectionKey);
    });
  }

  function pulseTarget(sectionKey) {
    const target = jumpTargets[sectionKey];
    if (!target) return;
    target.classList.add('section-focus');
    window.setTimeout(() => target.classList.remove('section-focus'), 1800);
  }

  function syncSectionFromHash() {
    if (window.location.hash === '#group-create-panel') {
      focusSection('create');
      return;
    }

    if (window.location.hash === '#groups-explore-panel' || window.location.hash === '#groups-discover') {
      focusSection('explore');
      return;
    }

    focusSection('create');
  }

  function applyFilters() {
    if (!searchInput || !typeFilter) return;

    const query = searchInput.value.trim().toLowerCase();
    const type = typeFilter.value;
    let matchedCount = 0;

    groupCards.forEach((card) => {
      const matchQuery = [card.dataset.name, card.dataset.dest, card.dataset.owner]
        .filter(Boolean)
        .some((value) => value.includes(query));
      const matchType = type === 'All' || card.dataset.type === type;
      const visible = matchQuery && matchType;
      card.classList.toggle('hidden', !visible);
      if (visible) matchedCount += 1;
    });

    if (visibleCountLabel) {
      visibleCountLabel.textContent = String(matchedCount);
    }

    if (emptyFilterState) {
      emptyFilterState.classList.toggle('hidden', matchedCount > 0 || (query === '' && type === 'All'));
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  if (typeFilter) {
    typeFilter.addEventListener('change', applyFilters);
  }

  function bindCoverFallbacks() {
    coverShells.forEach((shell) => {
      const image = shell.querySelector('img');
      const activateFallback = () => shell.classList.add('is-fallback');

      if (!image || !image.getAttribute('src')) {
        activateFallback();
        return;
      }

      image.addEventListener('error', activateFallback, { once: true });

      if (image.complete && image.naturalWidth === 0) {
        activateFallback();
      }
    });
  }

  function setPreviewBackdrop(imageUrl) {
    if (!photoPreview) return;

    if (imageUrl) {
      photoPreview.style.backgroundImage =
        `linear-gradient(180deg, rgba(8, 8, 10, 0.08), rgba(8, 8, 10, 0.78)), url('${imageUrl}')`;
      return;
    }

    photoPreview.style.backgroundImage = '';
  }

  function updatePreview(file) {
    if (!photoPreview || !photoName) return;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = '';
    }

    if (!file) {
      setPreviewBackdrop(defaultPreviewImage);
      photoName.textContent = photoName.dataset.defaultLabel || '';
      return;
    }

    previewUrl = URL.createObjectURL(file);
    setPreviewBackdrop(previewUrl);
    photoName.textContent = file.name;
  }

  if (photoInput) {
    photoInput.addEventListener('change', () => {
      const file = photoInput.files && photoInput.files[0] ? photoInput.files[0] : null;
      updatePreview(file);
    });
  }

  destinationUseButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const destinationName = button.dataset.destinationUse || '';
      const previewImage = button.dataset.previewImage || defaultPreviewImage;
      if (destinationInput) {
        destinationInput.value = destinationName;
      }
      if (destinationDeskStatus) {
        destinationDeskStatus.textContent = `${destinationName} loaded into Create Circle. Add a group name and trip brief, then publish it.`;
      }
      if (!photoInput || !photoInput.files || photoInput.files.length === 0) {
        setPreviewBackdrop(previewImage);
      }
      focusSection('create');
      pulseTarget('create');
      jumpTargets.create?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      groupNameInput?.focus();
    });
  });

  destinationExploreButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const destinationName = button.dataset.destinationExplore || '';
      if (searchInput) {
        searchInput.value = destinationName;
      }
      if (typeFilter && typeFilter.value !== 'All') {
        typeFilter.value = 'All';
      }
      if (destinationDeskStatus) {
        destinationDeskStatus.textContent = `Showing live circles that match ${destinationName}. Clear the search to browse everything again.`;
      }
      applyFilters();
      focusSection('explore');
      pulseTarget('explore');
      jumpTargets.explore?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      searchInput?.focus();
    });
  });

  storyButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const targetId = button.dataset.storyTarget;
      const target = targetId ? document.getElementById(targetId) : null;
      if (!target) return;

      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      target.classList.add('story-focus');
      window.setTimeout(() => target.classList.remove('story-focus'), 1800);
    });
  });

  jumpLinks.forEach((link) => {
    link.addEventListener('click', () => {
      const sectionKey = link.dataset.groupJump;
      if (!sectionKey) return;
      focusSection(sectionKey);
      pulseTarget(sectionKey);
    });
  });

  window.addEventListener('hashchange', syncSectionFromHash);
  syncSectionFromHash();
  bindCoverFallbacks();
  setPreviewBackdrop(defaultPreviewImage);
  applyFilters();

  if (hero && heroBg && !prefersReducedMotion) {
    hero.addEventListener('mousemove', (event) => {
      const rect = hero.getBoundingClientRect();
      const offsetX = (event.clientX - rect.left - rect.width / 2) / rect.width;
      const offsetY = (event.clientY - rect.top - rect.height / 2) / rect.height;
      heroBg.style.transform = `scale(1.09) translate3d(${offsetX * 18}px, ${offsetY * 12}px, 0)`;
    });

    hero.addEventListener('mouseleave', () => {
      heroBg.style.transform = '';
    });
  }
});
