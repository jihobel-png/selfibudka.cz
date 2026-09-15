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

  const scrollToSection = (sectionId, behavior = 'smooth') => {
    const target = document.getElementById(sectionId);
    if (!target) return false;
    target.scrollIntoView({ behavior, block: 'start' });
    return true;
  };

  const normalizePath = path => path
    .replace(/\/index\.html$/, '/')
    .replace(/\.html$/, '')
    .replace(/\/$/, '') || '/';

  const sectionRoutes = new Map([
    ['uvod', '/'],
    ['jak-to-funguje', '/jak-to-funguje'],
    ['typy-akci', '/typy-akci'],
    ['galerie', '/galerie'],
    ['faq', '/nejcastejsi-dotazy'],
    ['poptavka', '/kontakt']
  ]);
  const routeSections = new Map(
    [...sectionRoutes].map(([sectionId, path]) => [normalizePath(path), sectionId])
  );
  const isHomepageDocument = Boolean(document.getElementById('jak-to-funguje'));

  const sectionForCurrentPath = () => routeSections.get(normalizePath(window.location.pathname));

  const setSectionUrl = (sectionId, mode = 'replace', route = isHomepageDocument ? sectionRoutes.get(sectionId) : null) => {
    if (!route) {
      if (window.location.hash) {
        window.history.replaceState(window.history.state, '', `${window.location.pathname}${window.location.search}`);
      }
      return;
    }

    const nextUrl = `${route}${window.location.search}`;
    if (normalizePath(window.location.pathname) === normalizePath(route) && !window.location.hash) return;

    const method = mode === 'push' ? 'pushState' : 'replaceState';
    window.history[method]({ ...window.history.state, selfibudkaSection: sectionId }, '', nextUrl);
  };

  const pendingSectionKey = 'selfibudka_pending_section';
  const pendingSection = window.sessionStorage.getItem(pendingSectionKey);
  if (pendingSection) window.sessionStorage.removeItem(pendingSectionKey);
  const routedSection = sectionForCurrentPath();
  if (routedSection && document.getElementById(routedSection)) {
    window.requestAnimationFrame(() => scrollToSection(routedSection, 'auto'));
  } else if (pendingSection) {
    window.requestAnimationFrame(() => {
      scrollToSection(pendingSection, 'auto');
      setSectionUrl(pendingSection);
    });
  } else if (window.location.hash) {
    const initialSection = decodeURIComponent(window.location.hash.slice(1));
    window.requestAnimationFrame(() => {
      scrollToSection(initialSection, 'auto');
      setSectionUrl(initialSection);
    });
  }

  window.addEventListener('hashchange', () => {
    if (!window.location.hash) return;
    const sectionId = decodeURIComponent(window.location.hash.slice(1));
    window.requestAnimationFrame(() => {
      scrollToSection(sectionId, 'auto');
      setSectionUrl(sectionId);
    });
  });

  window.addEventListener('popstate', () => {
    const sectionId = sectionForCurrentPath();
    if (sectionId && document.getElementById(sectionId)) {
      window.requestAnimationFrame(() => scrollToSection(sectionId, 'auto'));
    }
  });

  document.querySelectorAll('a[href*="#"]').forEach(link => {
    const destination = new URL(link.href, window.location.href);
    if (destination.origin !== window.location.origin || !destination.hash) return;
    const sectionId = decodeURIComponent(destination.hash.slice(1));
    const mappedRoute = sectionRoutes.get(sectionId);
    const destinationIsHomepage = normalizePath(destination.pathname) === '/';
    const sectionRoute = mappedRoute && (isHomepageDocument || destinationIsHomepage) ? mappedRoute : '';
    link.dataset.scrollSection = sectionId;
    if (sectionRoute) link.dataset.scrollRoute = sectionRoute;
    link.setAttribute('href', sectionRoute || `${destination.pathname}${destination.search}`);
  });

  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-scroll-section]');
    if (!link) return;

    const destination = new URL(link.href, window.location.href);
    const sectionId = link.dataset.scrollSection;
    if (!sectionId) return;
    const sectionRoute = link.dataset.scrollRoute || '';
    const sameDocument = Boolean(document.getElementById(sectionId)) && (
      Boolean(sectionRoute) || normalizePath(destination.pathname) === normalizePath(window.location.pathname)
    );

    event.preventDefault();
    if (sameDocument && scrollToSection(sectionId)) {
      if (link.classList.contains('skip-link')) {
        const target = document.getElementById(sectionId);
        target?.setAttribute('tabindex', '-1');
        target?.focus({ preventScroll: true });
      }
      setSectionUrl(sectionId, sectionRoute ? 'push' : 'replace', sectionRoute || null);
      return;
    }

    window.sessionStorage.setItem(pendingSectionKey, sectionId);
    window.location.assign(sectionRoute || `${destination.pathname}${destination.search}`);
  });

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

  const consentForm = document.querySelector('[data-photo-consent-form]');
  if (consentForm) {
    const roleInputs = [...consentForm.querySelectorAll('input[name="role"]')];
    const guardianFields = consentForm.querySelector('[data-guardian-fields]');
    const minorNameInput = consentForm.querySelector('input[name="minorName"]');
    const guardianRelationInput = consentForm.querySelector('input[name="guardianRelation"]');
    const guardianAuthorityInput = consentForm.querySelector('input[name="guardianAuthority"]');
    const channelGroup = consentForm.querySelector('[data-channel-group]');
    const channelInputs = [...consentForm.querySelectorAll('input[name="channels"]')];
    const channelError = consentForm.querySelector('[data-consent-error]');
    const status = consentForm.querySelector('[data-consent-status]');
    const copyButton = consentForm.querySelector('[data-consent-copy]');
    const manualWrap = consentForm.querySelector('[data-consent-manual-wrap]');
    const manualTextarea = consentForm.querySelector('[data-consent-manual]');

    const selectedRole = () => consentForm.querySelector('input[name="role"]:checked')?.value || '';
    const selectedChannels = () => channelInputs.filter(input => input.checked).map(input => input.value);

    const updateGuardianFields = () => {
      const isGuardian = selectedRole() === 'Zákonný zástupce nezletilé osoby';
      if (guardianFields) guardianFields.hidden = !isGuardian;
      [minorNameInput, guardianRelationInput, guardianAuthorityInput].forEach(input => {
        if (input) input.required = isGuardian;
      });
    };

    const clearChannelError = () => {
      if (channelError) channelError.hidden = true;
      channelGroup?.setAttribute('aria-invalid', 'false');
    };

    const validateConsent = () => {
      updateGuardianFields();
      if (!consentForm.reportValidity()) return false;
      if (!selectedChannels().length) {
        if (channelError) channelError.hidden = false;
        channelGroup?.setAttribute('aria-invalid', 'true');
        channelInputs[0]?.focus();
        return false;
      }
      clearChannelError();
      return true;
    };

    const buildConsentMessage = () => {
      const role = selectedRole();
      const data = new FormData(consentForm);
      const value = key => String(data.get(key) || '').trim();
      const dateValue = value('eventDate');
      const formattedDate = new Intl.DateTimeFormat('cs-CZ').format(new Date(`${dateValue}T12:00:00`));
      const submittedAt = new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'long', timeStyle: 'short' }).format(new Date());
      const isGuardian = role === 'Zákonný zástupce nezletilé osoby';
      const personOnPhoto = isGuardian ? value('minorName') : value('fullName');
      const usesSocialNetwork = selectedChannels().some(channel => channel.startsWith('Instagram') || channel.startsWith('Facebook'));
      const guardianLines = isGuardian ? [
        `Vztah k nezletilé osobě: ${value('guardianRelation')}`,
        'Prohlašuji, že jsem jejím zákonným zástupcem a jsem oprávněn/a toto svolení udělit.'
      ] : [];
      const lines = [
        'Dobrý den,',
        '',
        'dobrovolně uděluji následující svolení:',
        `Udělující osoba: ${value('fullName')} (${value('email')})`,
        `Postavení: ${role}`,
        ...guardianLines,
        `Osoba na fotografii: ${personOnPhoto}`,
        `Akce a datum: ${value('eventName')}, ${formattedDate}`,
        `Fotografie: ${value('photoId')}`,
        `Povolené kanály: ${selectedChannels().join(', ')}`,
        '',
        'Dovoluji Janu Hobelovi, IČO 19077599, bezplatně zveřejnit označenou fotografii k prezentaci Selfíbudka.cz jen na vybraných kanálech. Uděluji svolení k rozšiřování podoby podle § 85 občanského zákoníku a zároveň souhlas se zpracováním fotografie jako osobního údaje podle čl. 6 odst. 1 písm. a) GDPR.',
        '',
        'Svolení platí 5 let od udělení, nejdéle do odvolání. Zahrnuje běžné technické úpravy, ne však placenou reklamu, prodej, propagaci jiné značky ani jiný kanál.',
        '',
        ...(usesSocialNetwork ? ['Při zveřejnění na Instagramu nebo Facebooku bude fotografie zpřístupněna společnosti Meta Platforms Ireland Limited a zpracována podle https://www.facebook.com/privacy/policy/, včetně tam popsaných mezinárodních přenosů. Uživatelé mohou obsah dále sdílet či stáhnout; úplné odstranění všech kopií nemusí být v moci Selfíbudky.', ''] : []),
        'Souhlas mohu kdykoli odvolat na info@selfibudka.cz s účinky do budoucna. Seznámil/a jsem se s informacemi na https://selfibudka.cz/ochrana-osobnich-udaju.',
        '',
        'Verze znění: SB-FOTO-2026-09-15-01',
        `Potvrzeno: ${submittedAt}`,
        'Souhlas potvrzuji odesláním tohoto e-mailu.'
      ];
      return {
        subject: `Souhlas se zveřejněním fotografie - ${value('fullName')}`,
        body: lines.join('\n')
      };
    };

    roleInputs.forEach(input => input.addEventListener('change', updateGuardianFields));
    channelInputs.forEach(input => input.addEventListener('change', clearChannelError));
    updateGuardianFields();

    const showManualCopy = copyText => {
      if (!manualWrap || !manualTextarea) return;
      manualTextarea.value = copyText;
      manualWrap.hidden = false;
      manualTextarea.focus();
      manualTextarea.select();
    };

    const copyConsentText = async copyText => {
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(copyText);
          return true;
        } catch (_) {
          // Starší prohlížeče mohou potřebovat záložní postup níže.
        }
      }
      const textarea = document.createElement('textarea');
      textarea.value = copyText;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      let copied = false;
      try {
        copied = document.execCommand('copy');
      } catch (_) {
        copied = false;
      } finally {
        textarea.remove();
      }
      return copied;
    };

    consentForm.addEventListener('submit', async event => {
      event.preventDefault();
      if (!validateConsent()) return;
      const message = buildConsentMessage();
      const href = `mailto:info@selfibudka.cz?subject=${encodeURIComponent(message.subject)}&body=${encodeURIComponent(message.body)}`;
      if (href.length <= 1800) {
        if (status) status.textContent = 'E-mail se souhlasem je připravený. Dokončete jej odesláním ve své e-mailové aplikaci.';
        window.location.href = href;
        return;
      }

      const copyText = `${message.subject}\n\n${message.body}`;
      const copied = await copyConsentText(copyText);
      if (!copied) {
        showManualCopy(copyText);
        if (status) status.textContent = 'Automatické zkopírování se nezdařilo. Označený text zkopírujte ručně a pošlete na info@selfibudka.cz.';
        return;
      }
      if (status) status.textContent = 'Úplný text je zkopírovaný. Otevírám e-mail; vložte text do zprávy a odešlete ji.';
      const shortBody = 'Úplný text souhlasu je zkopírovaný ve schránce. Vložte jej prosím do této zprávy a odešlete.';
      window.location.href = `mailto:info@selfibudka.cz?subject=${encodeURIComponent(message.subject)}&body=${encodeURIComponent(shortBody)}`;
    });

    copyButton?.addEventListener('click', async () => {
      if (!validateConsent()) return;
      const message = buildConsentMessage();
      const copyText = `${message.subject}\n\n${message.body}`;
      const copied = await copyConsentText(copyText);
      if (copied) {
        if (manualWrap) manualWrap.hidden = true;
        if (status) status.textContent = 'Text souhlasu je zkopírovaný. Vložte jej do e-mailu na info@selfibudka.cz a zprávu odešlete.';
      } else {
        showManualCopy(copyText);
        if (status) status.textContent = 'Automatické zkopírování se nezdařilo. Označený text zkopírujte ručně a pošlete na info@selfibudka.cz.';
      }
    });
  }

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
