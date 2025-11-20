import './style.css';
import { api } from './lib/api.js';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => registration.unregister());
  });
}

if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => caches.delete(name));
  });
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

class Slider {
  constructor(element) {
    this.slider = element;
    this.track = this.slider.querySelector('[data-slider-track]');
    this.slides = Array.from(this.slider.querySelectorAll('.slider__slide'));
    this.prevBtn = this.slider.querySelector('[data-slider-prev]');
    this.nextBtn = this.slider.querySelector('[data-slider-next]');
    this.dotsContainer = this.slider.querySelector('[data-slider-dots]');

    this.currentIndex = 0;
    this.isDragging = false;
    this.startPos = 0;
    this.currentTranslate = 0;
    this.prevTranslate = 0;
    this.animationID = null;

    this.slidesPerView = this.getSlidesPerView();
    this.totalSlides = this.slides.length;

    this.init();
  }

  getSlidesPerView() {
    if (window.innerWidth >= 1024) return 3;
    if (window.innerWidth >= 768) return 2;
    return 1;
  }

  init() {
    this.createDots();
    this.attachEventListeners();
    this.lazyLoadVideos();
    window.addEventListener('resize', () => this.handleResize());
  }

  createDots() {
    const dotsCount = Math.ceil(this.totalSlides / this.slidesPerView);
    this.dotsContainer.innerHTML = '';

    for (let i = 0; i < dotsCount; i++) {
      const dot = document.createElement('button');
      dot.classList.add('slider__dot');
      dot.setAttribute('type', 'button');
      dot.setAttribute('aria-label', `Перейти к слайду ${i + 1}`);

      if (i === 0) {
        dot.classList.add('slider__dot--active');
      }

      dot.addEventListener('click', () => this.goToSlide(i * this.slidesPerView));
      this.dotsContainer.appendChild(dot);
    }
  }

  attachEventListeners() {
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.prevSlide());
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.nextSlide());
    }

    this.track.addEventListener('pointerdown', (e) => this.touchStart(e));
    this.track.addEventListener('pointermove', (e) => this.touchMove(e));
    this.track.addEventListener('pointerup', () => this.touchEnd());
    this.track.addEventListener('pointerleave', () => this.touchEnd());
    this.track.addEventListener('pointercancel', () => this.touchEnd());

    this.track.addEventListener('touchstart', (e) => this.touchStart(e), { passive: false });
    this.track.addEventListener('touchmove', (e) => this.touchMove(e), { passive: false });
    this.track.addEventListener('touchend', () => this.touchEnd());

    this.track.addEventListener('dragstart', (e) => e.preventDefault());
  }

  updateDots() {
    const dots = Array.from(this.dotsContainer.querySelectorAll('.slider__dot'));
    const activeIndex = Math.floor(this.currentIndex / this.slidesPerView);

    dots.forEach((dot, index) => {
      if (index === activeIndex) {
        dot.classList.add('slider__dot--active');
      } else {
        dot.classList.remove('slider__dot--active');
      }
    });
  }

  getSlideWidth() {
    return this.slides[0].getBoundingClientRect().width;
  }

  setSliderPosition() {
    const slideWidth = this.getSlideWidth();
    const gap = 32;
    const offset = this.currentIndex * (slideWidth + gap);

    if (prefersReducedMotion) {
      this.track.style.transition = 'none';
    } else {
      this.track.style.transition = 'transform 450ms cubic-bezier(0.4, 0, 0.2, 1)';
    }

    this.track.style.transform = `translateX(-${offset}px)`;
    this.updateDots();
  }

  prevSlide() {
    if (this.currentIndex > 0) {
      this.currentIndex = Math.max(0, this.currentIndex - this.slidesPerView);
      this.setSliderPosition();
      this.lazyLoadVideos();
    }
  }

  nextSlide() {
    const maxIndex = this.totalSlides - this.slidesPerView;
    if (this.currentIndex < maxIndex) {
      this.currentIndex = Math.min(maxIndex, this.currentIndex + this.slidesPerView);
      this.setSliderPosition();
      this.lazyLoadVideos();
    }
  }

  goToSlide(index) {
    this.currentIndex = Math.min(index, this.totalSlides - this.slidesPerView);
    this.setSliderPosition();
    this.lazyLoadVideos();
  }

  touchStart(e) {
    this.isDragging = true;
    this.startPos = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    this.animationID = requestAnimationFrame(() => this.animation());
    this.track.style.cursor = 'grabbing';
    this.track.style.transition = 'none';
  }

  touchMove(e) {
    if (!this.isDragging) return;
    e.preventDefault();

    const currentPosition = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    this.currentTranslate = this.prevTranslate + currentPosition - this.startPos;
  }

  touchEnd() {
    if (!this.isDragging) return;

    this.isDragging = false;
    cancelAnimationFrame(this.animationID);

    const movedBy = this.currentTranslate - this.prevTranslate;
    const slideWidth = this.getSlideWidth();
    const threshold = slideWidth / 5;

    if (movedBy < -threshold && this.currentIndex < this.totalSlides - this.slidesPerView) {
      this.currentIndex += 1;
    } else if (movedBy > threshold && this.currentIndex > 0) {
      this.currentIndex -= 1;
    }

    this.setSliderPosition();
    this.track.style.cursor = 'grab';

    this.currentTranslate = 0;
    this.prevTranslate = 0;

    this.lazyLoadVideos();
  }

  animation() {
    if (this.isDragging) {
      const slideWidth = this.getSlideWidth();
      const gap = 32;
      const baseOffset = this.currentIndex * (slideWidth + gap);

      const maxTranslate = slideWidth * 0.3;
      const constrainedTranslate = Math.max(
        -maxTranslate,
        Math.min(maxTranslate, this.currentTranslate)
      );

      const offset = baseOffset - constrainedTranslate;

      this.track.style.transform = `translateX(-${offset}px)`;
      requestAnimationFrame(() => this.animation());
    }
  }

  lazyLoadVideos() {
    const visibleStart = this.currentIndex;
    const visibleEnd = this.currentIndex + this.slidesPerView;

    this.slides.forEach((slide, index) => {
      if (index >= visibleStart - 1 && index <= visibleEnd) {
        const iframe = slide.querySelector('iframe[data-src]');
        if (iframe) {
          iframe.src = iframe.dataset.src;
          iframe.removeAttribute('data-src');
        }
      }
    });
  }

  handleResize() {
    const newSlidesPerView = this.getSlidesPerView();

    if (newSlidesPerView !== this.slidesPerView) {
      this.slidesPerView = newSlidesPerView;
      this.currentIndex = 0;
      this.createDots();
      this.setSliderPosition();
    } else {
      this.setSliderPosition();
    }
  }
}

function initScrollReveal() {
  if (prefersReducedMotion) return;

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -100px 0px',
    threshold: 0.1
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, observerOptions);

  const sections = document.querySelectorAll('.section');
  sections.forEach(section => {
    observer.observe(section);
  });
}

function initParallax() {
  if (prefersReducedMotion) return;

  const canvas = document.querySelector('.canvas');
  const blobs = document.querySelectorAll('.canvas__blob');

  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * 0.3;

        canvas.style.transform = `translateY(${rate}px)`;

        blobs.forEach((blob, index) => {
          const speed = 0.1 + (index * 0.05);
          blob.style.transform = `translateY(${scrolled * speed}px)`;
        });

        ticking = false;
      });

      ticking = true;
    }
  });
}

function initButtonRipple() {
  if (prefersReducedMotion) return;

  const buttons = document.querySelectorAll('.btn');

  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      const ripple = this.querySelector('::before');

      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      this.style.setProperty('--ripple-x', `${x}px`);
      this.style.setProperty('--ripple-y', `${y}px`);
    });
  });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');

      if (href === '#' || href === '#privacy' || href === '#terms') {
        return;
      }

      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

async function loadContent() {
  try {
    const [content, contacts, programCards, teachers, reviews, documents] = await Promise.all([
      api.getSiteContent(),
      api.getContacts(),
      api.getProgramCards(),
      api.getTeachers(),
      api.getReviews(),
      api.getDocuments()
    ]);

    updateHeroSection(content);
    updateProgramSection(content, programCards);
    updateTeachersSection(content, teachers);
    updateReviewsSection(content, reviews);
    updateDocumentsSection(content, documents);
    updateCTASection(content, contacts);
    updateContactsSection(content, contacts);
    updateFooter(content);

    const sliderElement = document.querySelector('.slider');
    if (sliderElement) {
      new Slider(sliderElement);
    }
  } catch (error) {
    console.error('Error loading content:', error);
  }
}

function updateHeroSection(content) {
  const hero = content.hero || {};

  const titleEl = document.querySelector('.hero__title');
  if (titleEl && hero.title) {
    titleEl.textContent = hero.title;
  }

  const subtitleEl = document.querySelector('.hero__subtitle');
  if (subtitleEl && hero.subtitle) {
    subtitleEl.textContent = hero.subtitle;
  }

  const imageEl = document.querySelector('.hero__image');
  if (imageEl && hero.hero_image_url) {
    imageEl.style.backgroundImage = `url('${hero.hero_image_url}')`;
  }

  const logoEl = document.querySelector('.hero__logo-image');
  if (logoEl && hero.logo_url) {
    logoEl.src = hero.logo_url;
  }
}

function updateProgramSection(content, programCards) {
  const program = content.program || {};

  const titleEl = document.querySelector('.program .section__title');
  if (titleEl && program.title) {
    titleEl.textContent = program.title;
  }

  const subtitleEl = document.querySelector('.program .section__subtitle');
  if (subtitleEl && program.subtitle) {
    subtitleEl.textContent = program.subtitle;
  }

  const gridEl = document.querySelector('.program__grid');
  if (gridEl && programCards.length > 0) {
    gridEl.innerHTML = programCards.map(card => `
      <article class="program__card card">
        <div class="card__icon" aria-hidden="true">
          ${card.icon_svg || '<svg width="48" height="48" viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="20" stroke="currentColor" stroke-width="2"/></svg>'}
        </div>
        <h3 class="card__title">${card.title}</h3>
        <p class="card__text">${card.description}</p>
      </article>
    `).join('');
  }
}

function getEmbedUrl(url, platform) {
  if (platform === 'youtube') {
    const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(youtubeRegex);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return url;
  } else if (platform === 'vk') {
    return parseVkVideoUrl(url);
  }
  return url;
}

function extractVkEmbedUrl(input) {
  if (!input) return null;

  input = input.trim();

  // Если вставлен весь iframe код - извлекаем src
  if (input.includes('<iframe')) {
    const srcMatch = input.match(/src=["']([^"']+)["']/i);
    if (srcMatch) {
      console.log('[VK Video] Extracted src from iframe:', srcMatch[1]);
      return srcMatch[1];
    }
  }

  // Иначе считаем что это уже embed URL
  return input;
}

function parseVkVideoUrl(url) {
  if (!url) return null;

  // Извлекаем URL из iframe кода, если он там есть
  url = extractVkEmbedUrl(url);
  if (!url) return null;

  url = url.trim();

  // Добавляем протокол если отсутствует
  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }

  // Проверяем что это embed URL от VK
  if (!url.includes('video_ext.php')) {
    console.error('[VK Video] Invalid format. URL must contain video_ext.php');
    console.error('[VK Video] Example: https://vkvideo.ru/video_ext.php?oid=-157301945&id=456239025&hash=0998d1d02641da56');
    console.error('[VK Video] Provided:', url);
    return null;
  }

  try {
    const urlObj = new URL(url);
    const oid = urlObj.searchParams.get('oid');
    const id = urlObj.searchParams.get('id');
    const hash = urlObj.searchParams.get('hash');

    // Проверяем обязательные параметры
    if (!oid || !id) {
      console.error('[VK Video] Missing required parameters (oid or id)');
      return null;
    }

    if (!hash) {
      console.warn('[VK Video] Missing hash parameter - video may not work');
    }

    // Добавляем hd=2 если отсутствует для лучшего качества
    let hd = urlObj.searchParams.get('hd');
    if (!hd) {
      urlObj.searchParams.set('hd', '2');
    }

    const finalUrl = urlObj.toString();
    console.log('[VK Video] Embed URL ready:', finalUrl);
    return finalUrl;

  } catch (e) {
    console.error('[VK Video] Error parsing URL:', e);
    return null;
  }
}

function validateVkVideoUrl(url) {
  if (!url) {
    return { valid: false, error: 'URL не может быть пустым' };
  }

  const embedUrl = parseVkVideoUrl(url);

  if (!embedUrl) {
    return {
      valid: false,
      error: 'Невозможно извлечь данные видео. Убедитесь, что URL содержит параметры oid, id и hash'
    };
  }

  return { valid: true, embedUrl };
}

function updateTeachersSection(content, teachers) {
  const teachersContent = content.teachers || {};

  const titleEl = document.querySelector('.teachers .section__title');
  if (titleEl && teachersContent.title) {
    titleEl.textContent = teachersContent.title;
  }

  const subtitleEl = document.querySelector('.teachers .section__subtitle');
  if (subtitleEl && teachersContent.subtitle) {
    subtitleEl.textContent = teachersContent.subtitle;
  }

  const trackEl = document.querySelector('[data-slider-track]');
  if (trackEl && teachers.length > 0) {
    trackEl.innerHTML = teachers.map(teacher => {
      const embedUrl = getEmbedUrl(teacher.video_url, teacher.video_platform);

      if (!embedUrl) {
        return `
          <div class="slider__slide">
            <div class="teacher__card card">
              <div class="teacher__video" data-video-container style="display: flex; align-items: center; justify-content: center; background: rgba(255,0,0,0.1); min-height: 315px; padding: 20px; text-align: center;">
                <div>
                  <p style="color: #e74c3c; font-weight: 600; margin-bottom: 8px;">Ошибка загрузки видео</p>
                  <p style="font-size: 14px; color: var(--color-text-secondary);">Проверьте корректность URL видео в админ-панели.</p>
                </div>
              </div>
              <h3 class="teacher__name">${teacher.name}</h3>
              <p class="teacher__bio">${teacher.bio}</p>
            </div>
          </div>
        `;
      }

      return `
        <div class="slider__slide">
          <div class="teacher__card card">
            <div class="teacher__video" data-video-container>
              <iframe
                data-src="${embedUrl}"
                width="100%"
                height="315"
                style="background-color: #000"
                frameborder="0"
                allowfullscreen="1"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock"
                loading="lazy"
                title="Видео преподавателя ${teacher.name}"></iframe>
              <button class="video__fullscreen-btn" title="Полноэкранный режим" aria-label="Полноэкранный режим">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                </svg>
              </button>
            </div>
            <h3 class="teacher__name">${teacher.name}</h3>
            <p class="teacher__bio">${teacher.bio}</p>
          </div>
        </div>
      `;
    }).join('');
  }
}

function updateReviewsSection(content, reviews) {
  const reviewsContent = content.reviews || {};

  const titleEl = document.querySelector('.reviews .section__title');
  if (titleEl && reviewsContent.title) {
    titleEl.textContent = reviewsContent.title;
  }

  const gridEl = document.querySelector('.reviews__grid');
  if (gridEl && reviews.length > 0) {
    gridEl.innerHTML = reviews.map(review => {
      const embedUrl = getEmbedUrl(review.video_url, review.video_platform);

      if (!embedUrl) {
        return `
          <div class="reviews__video card" style="display: flex; align-items: center; justify-content: center; background: rgba(255,0,0,0.1); min-height: 315px; padding: 20px; text-align: center;">
            <div>
              <p style="color: #e74c3c; font-weight: 600; margin-bottom: 8px;">Ошибка загрузки видео</p>
              <p style="font-size: 14px; color: var(--color-text-secondary);">Проверьте корректность URL видео в админ-панели.</p>
            </div>
          </div>
        `;
      }

      return `
        <div class="reviews__video card">
          <iframe
            width="100%"
            height="315"
            style="background-color: #000"
            src="${embedUrl}"
            frameborder="0"
            allowfullscreen="1"
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture; screen-wake-lock"
            loading="lazy"
            title="Отзыв студента"></iframe>
          <button class="video__fullscreen-btn" title="Полноэкранный режим" aria-label="Полноэкранный режим">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
            </svg>
          </button>
        </div>
      `;
    }).join('');
  }

  const logosTitleEl = document.querySelector('.reviews__logos-title');
  if (logosTitleEl && reviewsContent.logos_title) {
    logosTitleEl.textContent = reviewsContent.logos_title;
  }
}

function updateDocumentsSection(content, documents) {
  const documentsContent = content.documents || {};

  const titleEl = document.querySelector('.documents__title');
  if (titleEl && documentsContent.title) {
    titleEl.textContent = documentsContent.title;
  }

  const textEl = document.querySelector('.documents__text');
  if (textEl && documentsContent.text) {
    textEl.textContent = documentsContent.text;
  }

  const buttonEl = document.querySelector('.documents__card .btn__text-desktop');
  if (buttonEl && documentsContent.button_text) {
    buttonEl.textContent = documentsContent.button_text;
  }
}

function updateCTASection(content, contacts) {
  const cta = content.cta || {};

  const titleEl = document.querySelector('.cta__title');
  if (titleEl && cta.title) {
    titleEl.textContent = cta.title;
  }

  const subtitleEl = document.querySelector('.cta__subtitle');
  if (subtitleEl && cta.subtitle) {
    subtitleEl.textContent = cta.subtitle;
  }

  const whatsappContact = contacts.find(c => c.type === 'whatsapp');
  const telegramContact = contacts.find(c => c.type === 'telegram');

  const whatsappBtn = document.querySelector('.cta__actions .btn--whatsapp');
  if (whatsappBtn && whatsappContact) {
    whatsappBtn.href = whatsappContact.url;
  }

  const telegramBtn = document.querySelector('.cta__actions .btn--telegram');
  if (telegramBtn && telegramContact) {
    telegramBtn.href = telegramContact.url;
  }
}

function updateContactsSection(content, contacts) {
  const contactsContent = content.contacts || {};

  const titleEl = document.querySelector('.contacts .section__title');
  if (titleEl && contactsContent.title) {
    titleEl.textContent = contactsContent.title;
  }

  const gridEl = document.querySelector('.contacts__grid');
  if (gridEl && contacts.length > 0) {
    gridEl.innerHTML = contacts.map(contact => {
      if (contact.url) {
        return `
          <div class="contacts__item">
            <h3 class="contacts__label">${contact.label}</h3>
            <a href="${contact.url}" class="contacts__link">${contact.value}</a>
          </div>
        `;
      } else {
        return `
          <div class="contacts__item">
            <h3 class="contacts__label">${contact.label}</h3>
            <p class="contacts__text">${contact.value}</p>
          </div>
        `;
      }
    }).join('');
  }
}

function updateFooter(content) {
  const footer = content.footer || {};

  const copyrightEl = document.querySelector('.footer__copyright');
  if (copyrightEl && footer.copyright) {
    copyrightEl.textContent = footer.copyright;
  }
}

function showDocumentsModal(documents) {
  const modal = document.createElement('div');
  modal.className = 'documents-modal';
  modal.innerHTML = `
    <div class="documents-modal__overlay"></div>
    <div class="documents-modal__content">
      <button class="documents-modal__close" aria-label="Закрыть">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <h2 class="documents-modal__title">Лицензии и дипломы</h2>
      <div class="documents-modal__grid">
        ${documents.map(doc => `
          <a href="${doc.file_url}" target="_blank" rel="noopener noreferrer" class="documents-modal__item">
            <div class="documents-modal__icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <span class="documents-modal__name">${doc.title}</span>
          </a>
        `).join('')}
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  setTimeout(() => modal.classList.add('is-open'), 10);

  const closeModal = () => {
    modal.classList.remove('is-open');
    setTimeout(() => {
      document.body.removeChild(modal);
      document.body.style.overflow = '';
    }, 300);
  };

  modal.querySelector('.documents-modal__close').addEventListener('click', closeModal);
  modal.querySelector('.documents-modal__overlay').addEventListener('click', closeModal);

  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
    }
  });
}

function initVideoInteractions() {
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const videoContainers = document.querySelectorAll('.teacher__video, .reviews__video');

  videoContainers.forEach(container => {
    const iframe = container.querySelector('iframe');
    if (!iframe) return;

    let isPlaying = false;

    if (isTouchDevice) {
      container.addEventListener('click', (e) => {
        if (e.target === iframe) return;

        const src = iframe.src;
        if (!src) return;

        if (isPlaying) {
          const newSrc = src.split('?')[0];
          iframe.src = newSrc;
          isPlaying = false;
        } else {
          const separator = src.includes('?') ? '&' : '?';
          iframe.src = src + separator + 'autoplay=1';
          isPlaying = true;
        }
      });
    } else {
      container.addEventListener('mouseenter', () => {
        const src = iframe.src;
        if (!src || isPlaying) return;

        const separator = src.includes('?') ? '&' : '?';
        iframe.src = src + separator + 'autoplay=1&mute=1';
        isPlaying = true;
      });

      container.addEventListener('mouseleave', () => {
        if (!isPlaying) return;

        const src = iframe.src;
        if (!src) return;

        const newSrc = src.split('?')[0];
        iframe.src = newSrc;
        isPlaying = false;
      });
    }
  });
}

function initFAQ() {
  const faqItems = document.querySelectorAll('.faq__item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq__question');

    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      faqItems.forEach(otherItem => {
        if (otherItem !== item) {
          otherItem.classList.remove('is-open');
          otherItem.querySelector('.faq__question').setAttribute('aria-expanded', 'false');
        }
      });

      if (isOpen) {
        item.classList.remove('is-open');
        question.setAttribute('aria-expanded', 'false');
      } else {
        item.classList.add('is-open');
        question.setAttribute('aria-expanded', 'true');
      }
    });

    question.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        question.click();
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadContent();

  initScrollReveal();
  initParallax();
  initButtonRipple();
  initSmoothScroll();
  initVideoInteractions();
  initFAQ();

  document.querySelectorAll('.card').forEach(card => {
    if (prefersReducedMotion) return;

    card.addEventListener('mouseenter', function() {
      this.style.transition = 'all 350ms cubic-bezier(0.4, 0, 0.2, 1)';
    });
  });
});
