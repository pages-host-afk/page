// ==========================
// OVERLAY DOS BANNER-CARDS
// ==========================
const defaultPhrase = "Na Elevar trabalhamos com <strong>tratamento personalizado</strong> (não procedimento), com protocolos progressivos e acompanhamento. Há solução para este caso.";

document.querySelectorAll('.banner-card').forEach(card => {
  // dados
  const title = card.getAttribute('data-title') || (card.querySelector('img')?.alt || 'Sua pele, seu plano');
  const desc  = card.getAttribute('data-desc')  || defaultPhrase;

  // cria overlay uma única vez
  if(!card.querySelector('.card-overlay')){
    const overlay = document.createElement('div');
    overlay.className = 'card-overlay';
    overlay.innerHTML = `
      <div class="overlay-content">
        <h4>${title}</h4>
        <p>${desc}</p>
        <div class="overlay-actions">
          <a href="#tratamentos" class="btn">Ver tratamentos</a>
          <a href="https://wa.me/559999999999?text=Oi%20quero%20uma%20avalia%C3%A7%C3%A3o%20sobre%20${encodeURIComponent(title)}"
             class="btn ghost" target="_blank" rel="noopener">Falar com a Elevar</a>
        </div>
      </div>`;
    card.appendChild(overlay);
  }

  // mobile/touch + desktop: abre/fecha com clique
  card.addEventListener('click', (e) => {
    // evita conflito com clique no CTA
    if (e.target.closest('a')) return;
    // fecha outros
    document.querySelectorAll('.banner-card.is-open').forEach(c => { if(c!==card) c.classList.remove('is-open'); });
    card.classList.toggle('is-open');
  });

  // acessibilidade via teclado
  card.tabIndex = 0;
  card.addEventListener('keydown', (e) => {
    if(e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      card.classList.toggle('is-open');
    }
  });
});


// ==========================
// MENU + SCROLL SUAVE
// ==========================
document.addEventListener('DOMContentLoaded', () => {
  const menu = document.getElementById('mainMenu');
  if (!menu) return;

  const SCROLL_THRESHOLD = 100;
  const menuHeight = menu.offsetHeight;
  let lastScroll = window.scrollY;
  let isMenuHidden = false;
  let scrollRaf = null;

  const handleScroll = () => {
    if (scrollRaf) cancelAnimationFrame(scrollRaf);
    scrollRaf = requestAnimationFrame(() => {
      const current = window.scrollY;
      const dir = current > lastScroll ? 'down' : 'up';

      if (dir === 'down' && current > SCROLL_THRESHOLD && !isMenuHidden) {
        menu.style.transform = `translateY(-${menuHeight}px)`;
        menu.classList.add('menu--hidden');
        isMenuHidden = true;
      } else if ((dir === 'up' || current <= 50) && isMenuHidden) {
        menu.style.transform = 'translateY(0)';
        menu.classList.remove('menu--hidden');
        isMenuHidden = false;
      }
      lastScroll = Math.max(current, 0);
      scrollRaf = null;
    });
  };

  const smoothScroll = (target) => {
    if (!target || target === '#') return;
    const el = document.querySelector(target);
    if (!el) return;

    const elementTop = el.getBoundingClientRect().top;
    const offsetTop = elementTop + window.pageYOffset - menuHeight;

    if ('scrollBehavior' in document.documentElement.style) {
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    } else {
      const start = window.pageYOffset;
      const dist = offsetTop - start;
      const duration = 500;
      let t0 = null;
      const easeInOutQuad = t => (t < .5 ? 2*t*t : -1 + (4 - 2*t)*t);

      const step = (now) => {
        if (!t0) t0 = now;
        const p = Math.min((now - t0) / duration, 1);
        window.scrollTo(0, start + dist * easeInOutQuad(p));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    if (isMenuHidden) {
      menu.style.transform = 'translateY(0)';
      menu.classList.remove('menu--hidden');
      isMenuHidden = false;
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      smoothScroll(link.getAttribute('href'));
    });
  });

  if (window.location.hash) {
    setTimeout(() => smoothScroll(window.location.hash), 150);
  }

  window.addEventListener('resize', () => {
    if (!isMenuHidden) return;
    menu.style.transform = 'translateY(0)';
    menu.classList.remove('menu--hidden');
    isMenuHidden = false;
  });
});


// ==========================
// CARROSSEL (com guardas)
// ==========================
(function initCarousel(){
  const track = document.getElementById('carouselTrack');
  if (!track) return; // não existe na página

  const slides = track.querySelectorAll('.carousel-slide');
  if (!slides.length) return;

  let currentIndex = 0;
  const updateCarousel = () => {
    track.style.transform = `translateX(-${currentIndex * 100}%)`;
  };

  const nextBtn = document.getElementById('nextSlide');
  const prevBtn = document.getElementById('prevSlide');

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentIndex = 1;
      updateCarousel();
    });
  }
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentIndex = 0;
      updateCarousel();
    });
  }
})();

// =============================================
// ANTES & DEPOIS
// =============================================
(() => {
  const toggle = (el) => {
    const active = el.classList.toggle('active');
    el.setAttribute('aria-pressed', active ? 'true' : 'false');
  };

  // Usa captura pra vencer overlays/z-index malucos
  document.addEventListener('click', (e) => {
    // deixa CTAs funcionarem
    if (e.target.closest('a, button')) return;

    const frame = e.target.closest('.transform-frame');
    if (!frame) return;

    toggle(frame);
  }, true); // <— capture

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const frame = e.target.closest('.transform-frame');
    if (!frame) return;
    e.preventDefault();
    toggle(frame);
  });
})();

// opcional: quando esconder a seção, reseta
function resetTransformCards() {
  document.querySelectorAll('.transform-frame.active').forEach(f => {
    f.classList.remove('active');
    f.setAttribute('aria-pressed', 'false');
  });
}

// ==========================
// SWIPE NO CARROSSEL (opcional)
// ==========================
(function enableCarouselSwipe(){
  const track = document.getElementById('carouselTrack');
  if (!track) return;

  let startX = 0, deltaX = 0, isDown = false;
  const threshold = 50;

  track.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    isDown = true;
  }, {passive:true});

  track.addEventListener('touchmove', (e) => {
    if (!isDown) return;
    deltaX = e.touches[0].clientX - startX;
  }, {passive:true});

  track.addEventListener('touchend', () => {
    if (!isDown) return;
    if (deltaX > threshold) document.getElementById('prevSlide')?.click();
    if (deltaX < -threshold) document.getElementById('nextSlide')?.click();
    startX = 0; deltaX = 0; isDown = false;
  });
})();
