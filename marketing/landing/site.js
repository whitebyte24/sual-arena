(function () {
  var cfg = window.SUAL_SITE || {};
  var LANGS = ['tr', 'ar', 'en'];
  var root = document.documentElement;
  root.classList.add('js');

  function pick() {
    var q = new URLSearchParams(location.search).get('lang');
    if (LANGS.indexOf(q) >= 0) return q;
    try {
      var s = localStorage.getItem('sual.lang');
      if (LANGS.indexOf(s) >= 0) return s;
    } catch (e) {}
    var n = (navigator.language || 'en').slice(0, 2).toLowerCase();
    return LANGS.indexOf(n) >= 0 ? n : 'en';
  }

  function apply(lang) {
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-lang]').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-lang') === lang);
    });
    document.querySelectorAll('.langs button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.set === lang));
    });
    var tt = document.body.getAttribute('data-title-' + lang);
    if (tt) document.title = tt;
    try { localStorage.setItem('sual.lang', lang); } catch (e) {}
    document.querySelectorAll('a[data-keeplang]').forEach(function (a) {
      var u = a.getAttribute('href').split('?')[0];
      a.setAttribute('href', u + '?lang=' + lang);
    });
  }

  document.querySelectorAll('.langs button').forEach(function (b) {
    b.addEventListener('click', function () { apply(b.dataset.set); });
  });

  document.querySelectorAll('[data-cfg]').forEach(function (el) {
    var v = cfg[el.getAttribute('data-cfg')];
    if (!v) return;
    if (el.tagName === 'A' && el.getAttribute('data-cfg') === 'contactEmail') el.setAttribute('href', 'mailto:' + v);
    el.textContent = v;
    el.classList.remove('todo');
  });
  document.querySelectorAll('[data-store]').forEach(function (el) {
    var url = cfg[el.getAttribute('data-store')];
    if (url) { el.setAttribute('href', url); el.hidden = false; }
  });
  var anyStore = cfg.appStoreUrl || cfg.playStoreUrl;
  var soonEl = document.querySelector('.stores .soon');
  if (soonEl) soonEl.hidden = !!anyStore;

  // Yönlendirme kodu (?ref=SUAL-AD): bir kez saklanır, bekleme listesi kaydıyla gönderilir
  var ref = '';
  try {
    var qref = new URLSearchParams(location.search).get('ref');
    if (qref && /^[A-Za-z0-9_-]{1,32}$/.test(qref)) localStorage.setItem('sual.ref', qref);
    ref = localStorage.getItem('sual.ref') || '';
  } catch (e) {}

  // Bekleme listesi
  var form = document.getElementById('wait');
  if (form) {
    var note = document.getElementById('wait-note');
    var msg = function (key) { var el = document.querySelector('[data-msg="' + key + '"][data-lang].active') || document.querySelector('[data-msg="' + key + '"]'); return el ? el.textContent : key; };
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var email = form.email.value.trim();
      if (form.website.value) return; // bot tuzağı
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { note.textContent = msg('invalid'); return; }
      if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
        location.href = 'mailto:' + (cfg.contactEmail || '') + '?subject=' + encodeURIComponent('Sual Arena waitlist') + '&body=' + encodeURIComponent(email + ' (' + root.lang + ')');
        return;
      }
      note.textContent = '…';
      fetch(cfg.supabaseUrl + '/rest/v1/waitlist', {
        method: 'POST',
        headers: { apikey: cfg.supabaseAnonKey, Authorization: 'Bearer ' + cfg.supabaseAnonKey, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify(ref ? { email: email, lang: root.lang, ref: ref } : { email: email, lang: root.lang }),
      }).then(function (r) {
        // 409 = zaten kayıtlı; kullanıcıya aynı olumlu yanıt (e-posta var/yok bilgisi sızdırma)
        if (r.ok || r.status === 409) { note.textContent = msg('ok'); form.reset(); }
        else note.textContent = msg('fail');
      }).catch(function () { note.textContent = msg('fail'); });
    });
  }

  apply(pick());
})();
