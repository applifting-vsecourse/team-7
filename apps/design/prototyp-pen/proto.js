// Klikací prototyp nad HTML exportem z Wireframes.pen.
// Pravidla: [obrazovka ("*" = všechny), CSS selektor, cíl (název obrazovky nebo "back")]
const REG = 'Mobile / Registrace', ROLE = 'Mobile / Onboarding – Volba role',
  O1 = 'Mobile / Onboarding 1 – Pes', O2 = 'Mobile / Onboarding 2 – Disciplína',
  O3 = 'Mobile / Onboarding 3 – První cíl', O4 = 'Mobile / Onboarding 4 – Týden',
  DNES = 'Mobile / Přehled týdne', ZAZNAM = 'Mobile / Záznam výsledku (sheet)',
  KAL = 'Mobile / Kalendář', PRIDAT = 'Mobile / Přidat cvičení ke dni (sheet)',
  PLAN = 'Mobile / Plán – detail', PROFIL = 'Mobile / Profil a psi', PES = 'Mobile / Nový pes',
  D_DNES = 'Desktop / Přehled týdne (1280)', D_KAL = 'Desktop / Kalendář (1280)';
const n = s => `[data-pencil-name="${s}"]`;

const RULES = [
  [REG, n('Submit'), ROLE], [REG, n('Google'), ROLE], [REG, n('Apple'), ROLE],
  [REG, n('Login Link'), DNES], [REG, n('Login Hint') + ' ' + n('Link'), DNES],
  [ROLE, n('CTA'), O1],
  [O1, n('CTA'), O2], [O2, n('CTA'), O3], [O3, n('CTA'), O4], [O4, n('CTA'), DNES],
  [O1, n('Back'), ROLE], [O2, n('Back'), O1], [O3, n('Back'), O2], [O4, n('Back'), O3],
  [O1, n('Skip'), DNES], [O2, n('Skip'), DNES], [O3, n('Skip'), DNES], [O4, n('Skip'), DNES],
  ['*', n('Týden Item'), DNES], ['*', n('Kalendář Item'), KAL],
  ['*', n('Plány Item'), PLAN], ['*', n('Profil Item'), PROFIL],
  [DNES, n('Today') + ' ' + n('Action'), ZAZNAM], [DNES, n('Rest of Week') + ' > div', KAL],
  [ZAZNAM, n('Save'), DNES], [ZAZNAM, n('Cancel'), DNES], [ZAZNAM, n('Scrim'), DNES],
  [KAL, n('Add'), PRIDAT], [KAL, n('Zapsat výsledek'), ZAZNAM],
  [PRIDAT, n('Submit'), KAL], [PRIDAT, n('Scrim'), KAL],
  [PLAN, n('Back'), 'back'],
  [PROFIL, n('Add Dog'), PES], [PROFIL, n('Odhlásit se'), REG],
  [PES, n('Back'), PROFIL], [PES, n('Submit'), PROFIL],
  ['*', n('Týden Nav'), D_DNES], ['*', n('Kalendář Nav'), D_KAL],
];

const screens = [...document.querySelectorAll('[data-pencil-name]')]
  .filter(el => !el.parentElement.closest('[data-pencil-name]'));
const byName = Object.fromEntries(screens.map(s => [s.dataset.pencilName, s]));
const stage = screens[0].parentElement;
stage.removeAttribute('style');
stage.className = 'stage';

for (const [scr, sel, to] of RULES)
  for (const s of scr === '*' ? screens : [byName[scr]])
    s.querySelectorAll(sel).forEach(el => { el.dataset.go = to; el.classList.add('hot'); });

// Postranní seznam obrazovek
const nav = document.createElement('nav');
nav.innerHTML = '<b>TrainLoop – prototyp</b><p>Klikej v obrazovce. Klik mimo aktivní prvek je zvýrazní.</p>' +
  screens.map(s => `<a href="#${encodeURIComponent(s.dataset.pencilName)}">${s.dataset.pencilName}</a>`).join('');
document.body.prepend(nav);

function show() {
  const name = decodeURIComponent(location.hash.slice(1)) || REG;
  const cur = byName[name] || byName[REG];
  screens.forEach(s => s.classList.toggle('on', s === cur));
  nav.querySelectorAll('a').forEach(a => a.classList.toggle('on', a.textContent === cur.dataset.pencilName));
  const room = innerWidth - nav.offsetWidth - 48;
  stage.style.zoom = Math.min(1, room / cur.offsetWidth);
  scrollTo(0, 0);
}
addEventListener('hashchange', show);
addEventListener('resize', show);
show();

document.addEventListener('click', e => {
  const go = e.target.closest('[data-go]');
  if (go) return go.dataset.go === 'back' ? history.back() : (location.hash = encodeURIComponent(go.dataset.go));
  if (!e.target.closest('nav')) {
    stage.classList.add('flash');
    setTimeout(() => stage.classList.remove('flash'), 600);
  }
});
