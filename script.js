(() => {
  const header = document.querySelector('[data-header]');
  const menuButton = document.querySelector('[data-menu-button]');
  const nav = document.querySelector('[data-nav]');

  const setHeaderState = () => header?.classList.toggle('is-scrolled', window.scrollY > 18);
  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });

  const closeMenu = () => {
    if (!menuButton || !nav) return;
    menuButton.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  };

  menuButton?.addEventListener('click', () => {
    const willOpen = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(willOpen));
    nav?.classList.toggle('is-open', willOpen);
    document.body.classList.toggle('menu-open', willOpen);
  });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  window.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -30px' });
    revealItems.forEach(item => observer.observe(item));
  } else {
    revealItems.forEach(item => item.classList.add('is-visible'));
  }

  const lightbox = document.querySelector('[data-lightbox]');
  const lightboxImage = lightbox?.querySelector('img');
  document.querySelectorAll('[data-full]').forEach(button => {
    button.addEventListener('click', () => {
      if (!lightbox || !lightboxImage) return;
      lightboxImage.src = button.dataset.full || '';
      lightboxImage.alt = button.dataset.alt || '';
      lightbox.showModal();
    });
  });
  lightbox?.querySelector('[data-lightbox-close]')?.addEventListener('click', () => lightbox.close());
  lightbox?.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });

  const form = document.querySelector('[data-inquiry-form]');
  form?.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const value = key => String(data.get(key) || '').trim();
    const dateValue = value('date');
    const formattedDate = dateValue ? new Intl.DateTimeFormat('cs-CZ').format(new Date(`${dateValue}T12:00:00`)) : 'zatím neurčen';
    const lines = [
      'Dobrý den,',
      '',
      'mám zájem o Selfíbudku na naši akci.',
      '',
      `Jméno: ${value('name')}`,
      `E-mail: ${value('email')}`,
      `Telefon: ${value('phone') || '—'}`,
      `Typ akce: ${value('type')}`,
      `Termín: ${formattedDate}`,
      `Místo: ${value('place') || '—'}`,
      `Počet hostů: ${value('guests') || '—'}`,
      '',
      'Moje představa:',
      value('message') || '—',
      '',
      'Prosím o informaci k dostupnosti a nezávaznou nabídku.',
      '',
      'Děkuji.'
    ];
    const subject = `Poptávka Selfíbudky – ${value('type')} ${dateValue ? `(${formattedDate})` : ''}`.trim();
    const href = `mailto:info@selfibudka.cz?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
    const status = form.querySelector('[data-form-status]');
    if (status) status.textContent = 'Otevírám e-mail s vaší poptávkou…';
    window.location.href = href;
  });

  document.querySelectorAll('[data-year]').forEach(node => { node.textContent = String(new Date().getFullYear()); });

  const privacyNotice = document.querySelector('[data-privacy-notice]');
  const privacyStorageKey = 'selfibudka_privacy_notice_v1';
  const privacyMaxAge = 180 * 24 * 60 * 60 * 1000;

  const showPrivacyNotice = () => {
    if (!privacyNotice) return;
    privacyNotice.hidden = false;
    requestAnimationFrame(() => privacyNotice.classList.add('is-visible'));
  };

  const hidePrivacyNotice = () => {
    if (!privacyNotice) return;
    privacyNotice.classList.remove('is-visible');
    window.setTimeout(() => { privacyNotice.hidden = true; }, 250);
  };

  let privacyAcknowledged = false;
  try {
    const savedAt = Number(window.localStorage.getItem(privacyStorageKey));
    privacyAcknowledged = Number.isFinite(savedAt) && Date.now() - savedAt < privacyMaxAge;
  } catch (_) {
    privacyAcknowledged = false;
  }

  if (!privacyAcknowledged) showPrivacyNotice();

  document.querySelector('[data-privacy-close]')?.addEventListener('click', () => {
    try { window.localStorage.setItem(privacyStorageKey, String(Date.now())); } catch (_) { /* Volba platí alespoň pro tuto návštěvu. */ }
    hidePrivacyNotice();
  });

  document.querySelector('[data-privacy-open]')?.addEventListener('click', showPrivacyNotice);
})();
