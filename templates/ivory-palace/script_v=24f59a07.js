/* Independent Ivory Palace invitation: entrance, mobile media, and music. */
(() => {
  'use strict';

  /* النصوص الثابتة بلغتين. أسماء الزبون ومحتواه لا يُترجَمان آلياً أبداً. */
  const DICT = {
    en: {
      'ip-scroll-down': 'Scroll down',
      'ip-date-title': 'The Date',
      'ip-scratch-hint': '✦ Scratch to reveal the date ✦',
      'ip-son-of': 'SON OF',
      'ip-daughter-of': 'DAUGHTER OF',
      'ip-with': 'With',
      'ip-dear-family': 'Dear Friends and Family',
      'ip-timeline-title': 'Wedding Timeline',
      'ip-countdown-title': 'The Celebration Begins',
      mapTitle: 'Location',
      mapOpen: 'Open in Google Maps',
      'ip-verse-source': '(Surah An-Naba 78:8)',
      'ip-hero-kicker': 'Welcome to the',
      'ip-hero-join': 'of',
      countdown: ['Days', 'Hours', 'Minutes', 'Seconds'],
      cards: ['Day', 'Month', 'Year'],
      namesJoin: ' & ',
      /* التصميم أصلاً حفل عقد قِران، لكن الصياغة تتبع نوع الحفل في بيانات الدعوة */
      events: {
        wedding: { hero: 'Wedding', kicker: 'YOU ARE INVITED TO THE WEDDING OF' },
        nikah: { hero: 'Nikkah Ceremony', kicker: 'YOU ARE INVITED TO THE NIKKAH CEREMONY OF' },
        henna: { hero: 'Henna Night', kicker: 'YOU ARE INVITED TO THE HENNA NIGHT OF' },
        engagement: { hero: 'Engagement', kicker: 'YOU ARE INVITED TO THE ENGAGEMENT OF' },
      },
    },
    ar: {
      'ip-scroll-down': 'مرّروا للأسفل',
      'ip-date-title': 'التاريخ',
      'ip-scratch-hint': '✦ احكّوا لكشف التاريخ ✦',
      'ip-son-of': 'نجل',
      'ip-daughter-of': 'كريمة',
      'ip-with': 'على',
      'ip-dear-family': 'الأهل والأصدقاء الأعزّاء',
      'ip-timeline-title': 'برنامج الحفل',
      'ip-countdown-title': 'يبدأ الاحتفال بعد',
      mapTitle: 'موقع الحفل',
      mapOpen: 'فتح الموقع في خرائط Google',
      'ip-verse-source': '(سورة النبأ ٧٨:٨)',
      'ip-hero-kicker': 'أهلاً بكم في',
      'ip-hero-join': '',
      countdown: ['يوم', 'ساعة', 'دقيقة', 'ثانية'],
      cards: ['اليوم', 'الشهر', 'السنة'],
      namesJoin: ' و',
      events: {
        wedding: { hero: 'حفل الزفاف', kicker: 'يسرّنا دعوتكم لحضور حفل زفاف' },
        nikah: { hero: 'حفل عقد القِران', kicker: 'يسرّنا دعوتكم لحضور حفل عقد قِران' },
        henna: { hero: 'ليلة الحنّة', kicker: 'يسرّنا دعوتكم لحضور حفل حنّة' },
        engagement: { hero: 'حفل الخطوبة', kicker: 'يسرّنا دعوتكم لحضور حفل خطوبة' },
      },
    },
  };

  /* بيانات الدعوة، وفوقها طبقة اللغة إن وُجدت. مخطط التخزين يحفظ لغة واحدة،
     فطبقة locales هي الطريق الوحيد لمحتوى مكتوب بلغتين. */
  function inviteData(lang) {
    const invite = window.__INVITE__ || {};
    const cfg = invite.config || {};
    const overlay = (invite.locales && invite.locales[lang]) || {};
    const merged = Object.assign({}, cfg);
    Object.keys(overlay).forEach((key) => {
      const value = overlay[key];
      if (value !== undefined && value !== null && value !== '') merged[key] = value;
    });
    return merged;
  }

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el && value !== undefined && value !== null) el.textContent = String(value);
  }

  /* خريطة القاعة تحت كتلة المكان. رابط الزبون قد يكون مختصراً (maps.app.goo.gl) لا
     تُستخرج منه الوجهة، فنبحث حينها باسم القاعة وعنوانها. زرّ الفتح يأخذ رابط الزبون
     نفسه كي يصل الضيف للدبوس الذي اختاره بالضبط. */
  function mapQuery(url, cfg) {
    try {
      const u = new URL(url);
      if (/(^|\.)google\.[a-z.]+$/i.test(u.hostname)) {
        const q = u.searchParams.get('query') || u.searchParams.get('q');
        if (q) return q;
        const at = (u.pathname + u.search).match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (at) return at[1] + ',' + at[2];
        const place = u.pathname.match(/\/place\/([^/]+)/);
        if (place) return decodeURIComponent(place[1].replace(/\+/g, ' '));
      }
    } catch (e) { /* رابط غير صالح: نبحث بالاسم */ }
    return [cfg.venueName, cfg.venueAddr].map(v => String(v || '').replace(/[—–|_]/g, ' ').trim())
      .filter(Boolean).join(' ').replace(/\s+/g, ' ');
  }
  function buildMap(cfg, lang, dict) {
    /* البحث بالاسم من بيانات الدعوة الأصلية لا من طبقة اللغة، كي تُظهر النسختان المكان نفسه */
    const base = (window.__INVITE__ || {}).config || cfg;
    const given = String(base.mapUrl || cfg.mapUrl || '').trim();
    const records = document.getElementById('allrecords');
    let section = document.getElementById('ip-map');
    const query = mapQuery(/^https?:\/\//i.test(given) ? given : '', base);
    const url = /^https?:\/\//i.test(given) ? given
      : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(query);
    if (!query || !records) { if (section) section.hidden = true; return; }
    if (!section) {
      section = document.createElement('section');
      section.id = 'ip-map';
      section.innerHTML = '<h2 class="ip-map__title"></h2><span class="ip-map__rule" aria-hidden="true"></span>'
        + '<div class="ip-map__frame"><iframe loading="lazy" allowfullscreen referrerpolicy="no-referrer-when-downgrade"></iframe></div>'
        + '<a class="ip-map__open" target="_blank" rel="noopener"></a>';
      records.insertAdjacentElement('afterend', section);
    }
    section.hidden = false;
    section.querySelector('.ip-map__title').textContent = dict.mapTitle;
    const frame = section.querySelector('iframe');
    frame.title = dict.mapTitle;
    const src = 'https://maps.google.com/maps?q=' + encodeURIComponent(query) + '&z=15&hl=' + lang + '&output=embed';
    if (frame.getAttribute('src') !== src) frame.setAttribute('src', src);
    const open = section.querySelector('.ip-map__open');
    open.href = url;
    open.textContent = dict.mapOpen;
  }

  /* سطر اسم الوالد عنصر Tilda يتقلّص على نصّه ويبدأ من يسار ثابت صُمّم لسطر إنكليزي
     أطول، فيبدو مزاحاً عن الاسم فوقه. بالعربية نعطيه صندوق الاسم نفسه (العريس أو
     العروس) فيتوسّط تحته. Tilda يعيد التخطيط عند تغيير المقاس، فنعيد الضبط بعده. */
  let alignedLang = null;
  function alignParents(lang) {
    alignedLang = lang;
    [['ip-groom-parents', 'ip-groom'], ['ip-bride-parents', 'ip-bride'],
      ['ip-son-of', 'ip-groom'], ['ip-daughter-of', 'ip-bride']].forEach(([id, refId]) => {
      const el = document.getElementById(id);
      const ref = document.getElementById(refId);
      const box = el && el.closest('.tn-elem');
      const refBox = ref && ref.closest('.tn-elem');
      if (!box || !refBox) return;
      if (lang !== 'ar') { box.style.removeProperty('left'); box.style.removeProperty('width'); return; }
      box.style.setProperty('left', refBox.offsetLeft + 'px', 'important');
      box.style.setProperty('width', refBox.offsetWidth + 'px', 'important');
    });
  }
  const realign = () => { if (alignedLang) setTimeout(() => alignParents(alignedLang), 120); };
  window.addEventListener('resize', realign);
  window.addEventListener('load', realign);

  function applyLanguage(lang) {
    const dict = DICT[lang] || DICT.ar;
    const cfg = inviteData(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.body.classList.toggle('ip-ar', lang === 'ar');
    document.body.classList.toggle('ip-en', lang !== 'ar');

    Object.keys(dict).forEach((key) => {
      if (key.indexOf('ip-') === 0) setText(key, dict[key]);
    });

    /* صياغة المناسبة تتبع نوع الحفل المحفوظ في الدعوة، لا التصميم المرجعي */
    const invite = window.__INVITE__ || {};
    /* المناسبة أولاً (خطوبة/زفاف)، ثم نوع الحفل داخل عائلة الزواج (حنّة/عقد قِران).
       كان يقول «حفل الزفاف» على دعوة خطوبة لأنه كان يقرأ نوع الحفل وحده. */
    let kind = cfg.occasion === 'engagement' ? 'engagement' : 'wedding';
    if (kind === 'wedding' && (invite.eventKind === 'nikah' || invite.eventKind === 'henna')) kind = invite.eventKind;
    const event = dict.events[kind] || dict.events.wedding;
    /* مناسبة مركّبة (خطوبة وعقد قِران) لا يمثّلها حقل المناسبة الواحد: تأتي صياغتها من طبقة اللغة */
    setText('ip-invite-kicker', cfg.occasionKicker || event.kicker);
    setText('ip-hero-occasion', cfg.occasionHero || event.hero);

    setText('ip-groom', cfg.groom);
    setText('ip-bride', cfg.bride);
    setText('ip-groom-parents', cfg.groomParents);
    setText('ip-bride-parents', cfg.brideParents);
    setText('ip-invitation-text', cfg.invitationText);
    setText('ip-verse', cfg.verse);
    /* سطر المرجع تحت الآية كان محفوراً بنصّ التصميم، فكان ينسب دعاء الزبون
       إلى سورة النبأ. لا نعرضه إلا إذا كانت الآية هي آية المرجع فعلاً. */
    const verseText = String(cfg.verse || '');
    const isReferenceVerse = /خلقناكم\s*أزواجا|created you in pairs/i.test(
      verseText.replace(/[\u064B-\u0652\u0670]/g, ''));
    setText('ip-verse-source', isReferenceVerse ? dict['ip-verse-source'] : '');
    /* الزبون قد يترك مسافة زائدة في خانة الاسم، فتظهر فجوة في سطر الأسماء */
    const names = [cfg.groom, cfg.bride].map(v => String(v || '').trim()).filter(Boolean);
    const namesEl = document.getElementById('ip-hero-names');
    if (namesEl && cfg.namesStacked && names.length === 2) {
      /* الاسمان كلٌّ في سطر وبينهما حرف الوصل صغيراً: محمد / و / رنا */
      namesEl.textContent = '';
      namesEl.classList.add('ip-letters__names--stacked');
      [names[0], dict.namesJoin.trim(), names[1]].forEach((text, i) => {
        const line = document.createElement('span');
        line.textContent = text;
        if (i === 1) line.className = 'ip-letters__names-join';
        namesEl.appendChild(line);
      });
    } else {
      if (namesEl) namesEl.classList.remove('ip-letters__names--stacked');
      setText('ip-hero-names', names.join(dict.namesJoin));
    }
    /* كتلة المكان في التصميم ثلاثة أسطر: المدينة، اسم القاعة، ثم العنوان.
       المنصّة تحفظ حقلين فقط، والعنوان يُكتب عادةً «المدينة — الشارع»،
       فنأخذ ما قبل الفاصلة مدينةً وما بعدها عنواناً، وإن غابت الفاصلة بقي السطر كاملاً عنواناً. */
    const addr = String(cfg.venueAddr || '').trim();
    const split = addr.split(/\s*[—–_|،,-]\s*/);
    const hasCity = split.length > 1 && split[0];
    setText('ip-venue-city', hasCity ? split[0] : '');
    setText('ip-venue-name', cfg.venueName);
    setText('ip-venue-addr', hasCity ? split.slice(1).join(' — ') : addr);
    buildMap(cfg, lang, dict);
    /* تسمية الأهل تتبع اختيار الأدمن إن ضبطه، وإلا نصّ التصميم */
    alignParents(lang);
    if (cfg.groomParentsLabel) setText('ip-son-of', cfg.groomParentsLabel);
    if (cfg.brideParentsLabel) setText('ip-daughter-of', cfg.brideParentsLabel);

    const program = Array.isArray(cfg.program) ? cfg.program : [];
    for (let i = 0; i < 5; i++) {
      const row = program[i] || { time: '', title: '' };
      setText(`ip-prog-${i + 1}-time`, row.time);
      setText(`ip-prog-${i + 1}-title`, row.title);
      const title = document.getElementById(`ip-prog-${i + 1}-title`);
      const time = document.getElementById(`ip-prog-${i + 1}-time`);
      [title, time].forEach((node) => {
        const host = node && node.closest('.t396__elem');
        if (host) host.style.visibility = row.title || row.time ? '' : 'hidden';
      });
    }

    ['wcb-days', 'wcb-hours', 'wcb-mins', 'wcb-secs'].forEach((id, index) => {
      const label = document.querySelector(`#${id} .wcb-label`);
      if (label && dict.countdown[index]) label.textContent = dict.countdown[index];
    });
    document.querySelectorAll('.tdr-label').forEach((el, index) => {
      if (dict.cards[index]) el.textContent = dict.cards[index];
    });

    fitBoundText();
    window.dispatchEvent(new CustomEvent('ivory-language-change', { detail: { lang: lang } }));
  }

  /* التصميم لوحة بإحداثيات ثابتة، والنص المحقون قد يطول عن صندوقه —
     خصوصاً بالعربية أو مع اسم قاعة طويل. نصغّر الخط تدريجياً حتى يتّسع،
     وحده عرض الصندوق هو القيد: الارتفاع يُترك للالتفاف الطبيعي. */
  function fitBoundText() {
    const nodes = document.querySelectorAll('[id^="ip-"]');
    nodes.forEach((el) => {
      el.style.fontSize = '';
      if (!el.textContent.trim()) return;
      const host = el.closest('.t396__elem') || el.parentElement;
      const maxWidth = host ? host.clientWidth : 0;
      if (!maxWidth) return;
      let size = parseFloat(window.getComputedStyle(el).fontSize) || 16;
      let guard = 0;
      while (guard++ < 30 && el.scrollWidth > maxWidth + 1 && size > 9) {
        size -= Math.max(0.5, size * 0.06);
        el.style.fontSize = `${size}px`;
      }
    });
  }

  function initializeInvitation() {
    function fitPhoneArtwork() {
      document.documentElement.style.setProperty('--ivory-page-scale', String(Math.min(1, window.innerWidth / 440)));
      document.documentElement.style.setProperty('--ivory-page-offset', `${Math.max(0, (440 - window.innerWidth) / 2)}px`);
    }
    fitPhoneArtwork();
    applyLanguage(window.__IVORY_LANG__ || 'ar');
    window.addEventListener('resize', fitPhoneArtwork);
    history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    /* المنصّة تحقن مشغّل موسيقى الزبون (#da3wa-music) حين يختار مقطعاً في محرّره.
       موسيقى القالب المدمجة تصير عندها مقطعاً ثانياً يعمل فوقه. */
    const platformMusic = !!document.getElementById('da3wa-music');
    const overlay = document.getElementById('weiOverlay');
    const videoWrap = document.getElementById('weiVideoWrap');
    const video = document.getElementById('weiVideo');
    /* فيديو دخول خاص بدعوة بعينها: الصفحة المولّدة تحمل فيديو القالب العام،
       وهذه الدعوة تُبدّله قبل التحميل فتبقى على ظرفها الذي اعتمده صاحبها. */
    const pinnedEntrance = (window.__INVITE__ || {}).entrance;
    if (pinnedEntrance && /^[a-z0-9-]+$/.test(pinnedEntrance)) {
      const base = '/templates/ivory-palace/assets/' + pinnedEntrance;
      video.src = base + '.mp4';
      video.poster = base + '-poster.jpg';
      const still = document.getElementById('weiImg');
      if (still) still.src = base + '-poster.jpg';
    }
    /* طبقة الفيديو كانت خلفيتها لوناً مسطّحاً فاتحاً. بين ظهورها وأوّل إطار
       يرسمه الفيديو كان يلمع ذلك اللون كوميض أبيض — يظهر على سفاري الآيفون
       حيث لا يُركَّب الإطار الأول لحظة play(). نجعل خلفيتها صورة الظرف نفسها،
       فما يُرى قبل الإطار الأول هو الظرف ذاته لا لون. */
    const entrancePoster = video.getAttribute('poster');
    if (entrancePoster) {
      videoWrap.style.backgroundImage = 'url("' + entrancePoster + '")';
      videoWrap.style.backgroundSize = 'cover';
      videoWrap.style.backgroundPosition = 'center';
      videoWrap.style.backgroundRepeat = 'no-repeat';
    }
    const audio = document.getElementById('weiAudio');
    const audioBtn = document.getElementById('weiAudioBtn');
    const playIcon = document.getElementById('weiIconPlay');
    const pauseIcon = document.getElementById('weiIconPause');
    const heroVideo = document.getElementById('wlivVideo');
    const heroPoster = document.getElementById('ivoryHeroPoster');
    const heroPlay = document.getElementById('ivoryHeroPlay');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    document.documentElement.style.overflow = 'hidden';
    /* الأقسام التي تحقنها المنصّة تقع خارج #allrecords، فنُدرجها هنا كي لا يصلها
       التنقّل بلوحة المفاتيح قبل أن يُفتح الظرف. */
    const pageSections = [
      ...document.querySelectorAll('#allrecords > .r:not(#rec2684631903)'),
      ...document.querySelectorAll('main > *:not(#allrecords)'),
    ];
    pageSections.forEach(section => { section.inert = true; });
    let opened = false;
    let finished = false;
    let openedWithKeyboard = false;
    let fallback;
    let lastVideoTime = 0;
    let videoFrameRequest;
    /* بطلب الزبون: الدعوة تظهر بعد ثلاث ثوانٍ من فيديو الظرف (المقطع مقصوص إلى 3.5 ثانية) */
    const revealAt = 3;
    const revealFadeMs = 450;
    let heroUserOverride = false;
    let heroPlayAttempt = 0;
    let heroCanPlayRetried = false;

    function showHeroFallback() {
      if (heroPoster) heroPoster.hidden = false;
      if (heroPlay) heroPlay.hidden = !finished;
    }

    function showHeroPlayback() {
      if (heroPoster) heroPoster.hidden = true;
      if (heroPlay) heroPlay.hidden = true;
    }

    function startHeroPlayback(manual = false) {
      if (!heroVideo) return;
      if (manual) heroUserOverride = true;
      if (reducedMotion.matches && !heroUserOverride) {
        heroVideo.pause();
        showHeroFallback();
        return;
      }
      if (!heroVideo.paused && heroVideo.readyState >= 2) {
        showHeroPlayback();
        return;
      }
      const attempt = ++heroPlayAttempt;
      try {
        // Keep this call synchronous when invoked by the envelope/play button.
        const result = heroVideo.play();
        if (result && typeof result.catch === 'function') {
          result.catch(() => {
            if (attempt === heroPlayAttempt && heroVideo.paused) showHeroFallback();
          });
        }
      } catch {
        showHeroFallback();
      }
    }

    if (heroVideo) {
      heroVideo.muted = true;
      heroVideo.defaultMuted = true;
      heroVideo.playsInline = true;
      heroVideo.setAttribute('muted', '');
      heroVideo.setAttribute('playsinline', '');
      heroVideo.setAttribute('webkit-playsinline', '');
      heroVideo.addEventListener('playing', () => {
        if (reducedMotion.matches && !heroUserOverride) {
          heroVideo.pause();
          showHeroFallback();
        } else {
          showHeroPlayback();
        }
      });
      heroVideo.addEventListener('pause', () => {
        if (finished || reducedMotion.matches) showHeroFallback();
      });
      heroVideo.addEventListener('error', showHeroFallback);
      heroVideo.addEventListener('canplay', () => {
        if (opened && !heroCanPlayRetried) {
          heroCanPlayRetried = true;
          startHeroPlayback();
        }
      });
      if (heroPlay) heroPlay.addEventListener('click', () => startHeroPlayback(true));
      document.addEventListener('visibilitychange', () => {
        if (opened && document.visibilityState === 'visible') startHeroPlayback();
      });
      window.addEventListener('pageshow', () => {
        if (opened) startHeroPlayback();
      });
      if (reducedMotion.matches) {
        heroVideo.autoplay = false;
        heroVideo.pause();
        showHeroFallback();
      }
    }

    function waitForVideoProgress() {
      clearTimeout(fallback);
      // Recover from stalled loading/playback without using wall-clock time
      // to shorten the requested three seconds of video playback.
      fallback = setTimeout(finishOpening, 15000);
    }

    function checkVideoProgress() {
      if (!opened || finished) return;
      if (video.currentTime >= revealAt) {
        finishOpening();
      } else if (video.currentTime > lastVideoTime) {
        lastVideoTime = video.currentTime;
        waitForVideoProgress();
      }
    }

    function trackVideoFrame() {
      checkVideoProgress();
      if (!finished) videoFrameRequest = video.requestVideoFrameCallback(trackVideoFrame);
    }

    function syncMusic() {
      playIcon.style.display = audio.paused ? 'block' : 'none';
      pauseIcon.style.display = audio.paused ? 'none' : 'block';
      audioBtn.setAttribute('aria-label', audio.paused ? 'Play music' : 'Pause music');
      audioBtn.setAttribute('aria-pressed', String(!audio.paused));
    }

    function finishOpening() {
      if (!opened || finished) return;
      finished = true;
      clearTimeout(fallback);
      if (videoFrameRequest !== undefined) video.cancelVideoFrameCallback(videoFrameRequest);
      video.pause();
      videoWrap.classList.remove('wei-video-in');
      videoWrap.classList.add('wei-video-out');
      setTimeout(() => {
        videoWrap.style.display = 'none';
      }, reducedMotion.matches ? 0 : revealFadeMs);
      if (platformMusic) {
        audioBtn.style.display = 'none';
      } else {
        audioBtn.style.visibility = 'visible';
        audioBtn.style.opacity = '1';
      }
      const switcher = document.getElementById('ipLangSwitch');
      if (switcher) switcher.hidden = false;
      document.documentElement.style.overflow = '';
      pageSections.forEach(section => { section.inert = false; });
      startHeroPlayback();
      document.getElementById('allrecords').dataset.invitationOpened = 'true';
      document.dispatchEvent(new Event('ivory-invitation-opened'));
      syncMusic();
      if (openedWithKeyboard) audioBtn.focus({preventScroll:true});
    }

    function openInvitation() {
      if (opened) return;
      opened = true;
      openedWithKeyboard = document.activeElement === overlay;
      overlay.blur();
      overlay.tabIndex = -1;
      overlay.setAttribute('aria-hidden', 'true');
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
      setTimeout(() => { overlay.style.display = 'none'; }, reducedMotion.matches ? 0 : 1400);
      audio.volume = 1;
      if (!platformMusic) audio.play().catch(syncMusic);
      startHeroPlayback();
      if (reducedMotion.matches || video.error) {
        finishOpening();
      } else {
        videoWrap.classList.add('wei-video-in');
        video.play().catch(finishOpening);
        waitForVideoProgress();
        if (typeof video.requestVideoFrameCallback === 'function') {
          videoFrameRequest = video.requestVideoFrameCallback(trackVideoFrame);
        }
      }
    }

    function keyboardClick(event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.currentTarget.click();
      }
    }

    overlay.setAttribute('role', 'button');
    overlay.setAttribute('aria-label', 'Open your invitation');
    overlay.tabIndex = 0;
    overlay.addEventListener('click', openInvitation);
    overlay.addEventListener('keydown', keyboardClick);
    video.addEventListener('timeupdate', checkVideoProgress);
    video.addEventListener('ended', finishOpening);
    video.addEventListener('error', () => { if (opened) finishOpening(); });
    video.load();

    audioBtn.setAttribute('role', 'button');
    audioBtn.tabIndex = 0;
    audioBtn.addEventListener('keydown', keyboardClick);
    audioBtn.addEventListener('click', () => {
      if (audio.paused) audio.play().catch(syncMusic);
      else audio.pause();
    });
    audio.addEventListener('play', syncMusic);
    audio.addEventListener('pause', syncMusic);
    audio.addEventListener('error', syncMusic);
    syncMusic();

    /* شاشة اللغة: تسبق الظرف. النصوص التي يولّدها القالب تتبدّل فوراً،
       أما الأقسام التي يبنيها الخادم فتحتاج دورة خادم عبر ?lang= */
    /* البوّابة لدعوات بلغتين فقط. الدعوة العامة بلغة واحدة تدخل على الظرف
       مباشرةً، ويُزال زرّ التبديل — اختيارٌ بين العربية ونسخةٍ هي نفسها ليس ميزة. */
    const inviteData_ = window.__INVITE__ || {};
    const bilingual = !!(inviteData_.locales && inviteData_.locales.ar && inviteData_.locales.en);
    const langGate = bilingual ? document.getElementById('ipLangGate') : null;
    if (!bilingual) {
      const gateEl = document.getElementById('ipLangGate');
      if (gateEl) gateEl.remove();
      const switchEl = document.getElementById('ipLangSwitch');
      if (switchEl) switchEl.remove();
    }
    const langSwitch = document.getElementById('ipLangSwitch');
    const CONTINUATION_KEY = 'da3wa-ivory-language-continuation';
    let languageChosen = false;

    function hideLanguageGate() {
      if (!langGate) return;
      langGate.classList.add('is-gone');
      setTimeout(() => { langGate.hidden = true; }, reducedMotion.matches ? 0 : 450);
    }

    function chooseLanguage(next) {
      if (languageChosen) return;
      languageChosen = true;
      applyLanguage(next);
      hideLanguageGate();
      if (overlay && overlay.style.display !== 'none') overlay.focus({ preventScroll: true });
    }

    function serverLanguage() {
      const invite = window.__INVITE__ || {};
      return invite.serverLanguage === 'ar' || invite.serverLanguage === 'en' ? invite.serverLanguage : null;
    }

    function switchLanguage(next) {
      const server = serverLanguage();
      if (server && next !== server) {
        const destination = new URL(window.location.href);
        destination.searchParams.set('lang', next);
        try {
          window.sessionStorage.setItem(CONTINUATION_KEY, JSON.stringify({ scroll: window.scrollY, created: Date.now() }));
        } catch { /* تصفّح خاص: نفقد موضع التمرير فقط */ }
        window.location.href = destination.href;
        return;
      }
      applyLanguage(next);
    }

    if (langGate) {
      langGate.querySelectorAll('[data-ip-lang]').forEach(button => {
        button.addEventListener('click', () => chooseLanguage(button.dataset.ipLang));
      });
    }
    if (langSwitch) {
      langSwitch.addEventListener('click', () => {
        switchLanguage(document.documentElement.lang === 'ar' ? 'en' : 'ar');
      });
    }

    /* العودة بعد تبديل لغة يحتاج الخادم: نتخطّى الشاشة والظرف ونستعيد موضع القراءة */
    let continuation = null;
    try {
      const raw = window.sessionStorage.getItem(CONTINUATION_KEY);
      if (raw) { continuation = JSON.parse(raw); window.sessionStorage.removeItem(CONTINUATION_KEY); }
    } catch { continuation = null; }
    if (continuation && Date.now() - continuation.created < 60000) {
      chooseLanguage(window.__IVORY_LANG__ || 'ar');
      openInvitation();
      finishOpening();
      window.scrollTo(0, continuation.scroll || 0);
    }

    // Offer the same reveal without requiring a pointer or touch gesture.
    // القيم تأتي من تاريخ الدعوة نفسه، لا من تاريخ محفور.
    const cardDate = window.__IVORY_DATE__ || { day: '', month: '', year: '' };
    for (const [part, value] of [['day', cardDate.day], ['month', cardDate.month], ['year', cardDate.year]]) {
      const tile = document.getElementById(`tdr-tile-${part}`);
      const cover = document.getElementById(`tdr-cvs-${part}`);
      if (!tile || !cover) continue;
      tile.tabIndex = 0;
      tile.setAttribute('role', 'button');
      tile.setAttribute('aria-label', `Reveal ${part}: ${value}`);
      tile.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        cover.style.display = 'none';
        tile.setAttribute('aria-label', `${part}: ${value}`);
      });
    }

    document.querySelectorAll('video[autoplay]').forEach(background => {
      if (background === heroVideo) return;
      if (reducedMotion.matches) {
        background.pause();
        background.addEventListener('play', () => background.pause());
      }
    });

  }
  if (document.getElementById('weiOverlay')) initializeInvitation();
  else document.addEventListener('DOMContentLoaded', initializeInvitation, {once:true});
})();
