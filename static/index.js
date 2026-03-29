document.addEventListener('DOMContentLoaded', () => {
  const nav = document.getElementById('main-nav');
  const gitaBar = document.getElementById('gita-quote-bar');
  const hero = document.getElementById('hero-section');
  const pagePetals = document.getElementById('petals-container');
  const heroScenes = Array.from(document.querySelectorAll('.hero-scene'));
  const heroSceneTitle = document.getElementById('hero-scene-title');
  const heroSceneCopy = document.getElementById('hero-scene-copy');
  const heroSceneDots = Array.from(document.querySelectorAll('.hero-scene-dot'));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let countersAnimated = false;

  if (nav) {
    let lastScrollY = window.scrollY;
    window.addEventListener('scroll', () => {
      const currentY = window.scrollY;
      const heroHeight = hero ? hero.offsetHeight * 0.15 : 120;
      nav.classList.toggle('scrolled', currentY > heroHeight);

      if (currentY > lastScrollY + 6 && currentY > 110) {
        nav.classList.add('nav-hidden');
      } else if (currentY < lastScrollY - 4 || currentY <= 24) {
        nav.classList.remove('nav-hidden');
      }

      if (gitaBar) {
        gitaBar.classList.toggle('gita-soft-scrolled', currentY > 24);
      }

      lastScrollY = currentY;
    }, { passive: true });
  }

  document.querySelectorAll('.sw-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.sw-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.sw-panel').forEach(panel => panel.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById(tab.dataset.tab);
      if (target) {
        target.classList.add('active');
      }
    });
  });

  function animateCounters() {
    if (countersAnimated) return;
    countersAnimated = true;

    document.querySelectorAll('.hero-stat-num').forEach(el => {
      const target = parseInt(el.dataset.target || '0', 10);
      const step = target / (2000 / 16);
      let current = 0;

      const timer = setInterval(() => {
        current += step;
        if (current >= target) {
          el.textContent = target;
          clearInterval(timer);
        } else {
          el.textContent = Math.floor(current);
        }
      }, 16);
    });
  }

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      if (entry.target.id === 'hero-section') {
        animateCounters();
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal, .hero-v2').forEach(section => {
    revealObserver.observe(section);
  });

  document.querySelectorAll('.card-3d').forEach(card => {
    card.addEventListener('mousemove', event => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 18;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 18;
      card.style.transform = `perspective(1200px) rotateY(${x}deg) rotateX(${-y}deg) translateY(-8px) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  (function initHeroScenes() {
    if (!heroScenes.length) return;

    let activeSceneIndex = heroScenes.findIndex(scene => scene.classList.contains('active'));
    if (activeSceneIndex < 0) {
      activeSceneIndex = 0;
    }
    let intervalId = 0;

    function syncScene(index) {
      const normalizedIndex = (index + heroScenes.length) % heroScenes.length;
      activeSceneIndex = normalizedIndex;

      heroScenes.forEach((scene, sceneIndex) => {
        scene.classList.toggle('active', sceneIndex === normalizedIndex);
      });

      heroSceneDots.forEach((dot, dotIndex) => {
        dot.classList.toggle('active', dotIndex === normalizedIndex);
      });

      const activeScene = heroScenes[normalizedIndex];
      if (heroSceneTitle) {
        heroSceneTitle.textContent = activeScene.dataset.sceneTitle || '';
      }
      if (heroSceneCopy) {
        heroSceneCopy.textContent = activeScene.dataset.sceneCopy || '';
      }
    }

    function startRotation() {
      if (prefersReducedMotion || heroScenes.length < 2) return;
      intervalId = window.setInterval(() => {
        syncScene(activeSceneIndex + 1);
      }, 5000);
    }

    heroSceneDots.forEach(dot => {
      dot.addEventListener('click', () => {
        const nextIndex = parseInt(dot.dataset.sceneIndex || '0', 10);
        syncScene(nextIndex);
        if (intervalId) {
          window.clearInterval(intervalId);
          startRotation();
        }
      });
    });

    syncScene(activeSceneIndex);
    startRotation();
  })();

  (function initDiya() {
    const canvas = document.getElementById('diya-canvas');
    if (!canvas || prefersReducedMotion) return;

    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    const particles = [];

    function resizeCanvas() {
      width = canvas.width = canvas.parentElement.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement.offsetHeight || window.innerHeight;
    }

    resizeCanvas();

    for (let i = 0; i < 60; i += 1) {
      particles.push({
        x: Math.random() * width,
        y: height + Math.random() * height,
        radius: 1.5 + Math.random() * 2.5,
        speedY: 0.4 + Math.random() * 0.8,
        drift: (Math.random() - 0.5) * 0.4,
        hue: Math.random() > 0.5 ? 30 : 340,
        life: Math.random()
      });
    }

    function drawFrame() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(particle => {
        particle.y -= particle.speedY;
        particle.x += particle.drift;
        particle.life -= 0.004;

        if (particle.life <= 0 || particle.y < -20) {
          particle.x = Math.random() * width;
          particle.y = height + 10;
          particle.life = 0.7 + Math.random() * 0.3;
        }

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${particle.hue},100%,60%,${particle.life * 0.6})`;
        ctx.shadowBlur = 12;
        ctx.shadowColor = `hsl(${particle.hue},100%,55%)`;
        ctx.fill();
      });

      requestAnimationFrame(drawFrame);
    }

    window.addEventListener('resize', resizeCanvas, { passive: true });
    drawFrame();
  })();

  (function spawnPetals() {
    if (prefersReducedMotion || !pagePetals) return;

    const petals = ['🪷', '🪷', '🪷', '🪷'];

    function makePetal() {
      const el = document.createElement('span');
      el.className = 'petal page-petal';
      el.textContent = petals[Math.floor(Math.random() * petals.length)];
      el.style.left = `${Math.random() * 100}vw`;
      el.style.bottom = `${Math.random() * 50 - 28}vh`;
      el.style.opacity = `${0.32 + Math.random() * 0.42}`;
      el.style.fontSize = `${1 + Math.random() * 1.35}rem`;
      el.style.animationDuration = `${11 + Math.random() * 15}s`;
      el.style.animationDelay = `${Math.random() * 8}s`;
      pagePetals.appendChild(el);
      setTimeout(() => el.remove(), 28000);
    }

    for (let i = 0; i < 24; i += 1) {
      makePetal();
    }

    window.setInterval(() => {
      makePetal();
    }, 950);
  })();
});
