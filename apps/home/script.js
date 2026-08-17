// Theme: saved choice > browser preference (prefers-color-scheme) > dark default
(function () {
  var root = document.documentElement;
  var saved = localStorage.getItem('theme');
  var pref = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  var theme = saved || pref;
  root.dataset.theme = theme;
  var btn = document.getElementById('theme-toggle');
  btn.textContent = theme === 'dark' ? '\u263E' : '\u2600';
  btn.addEventListener('click', function () {
    theme = theme === 'dark' ? 'light' : 'dark';
    root.dataset.theme = theme;
    localStorage.setItem('theme', theme);
    btn.textContent = theme === 'dark' ? '\u263E' : '\u2600';
  });
})();

// EN / RU: intro and buttons only
var RU = {
  ai: 'Применяю AI в реальных бизнесах - на прочной инженерии',
  tagline: '10+ лет, 6+ из них на удалёнке. Собираю продукты от идеи до прода.',
  stat1: 'до ChatGPT',
  stat2: 'человек в команде на пике',
  stat3: 'сократил онбординг с 3 недель',
  tg: 'Телеграм',
  'nav-work': 'Опыт',
  'nav-projects': 'Личные проекты и попытки',
  'nav-stack': 'Технологии',
  'nav-personal': 'За пределами работы'
};
var EN = {
  ai: 'Applying AI to real businesses - with solid engineering',
  tagline: '10+ years, remote for 6+. I ship products end to end.',
  stat1: 'before ChatGPT',
  stat2: 'people led at peak',
  stat3: 'client onboarding cut',
  tg: 'Telegram',
  'nav-work': 'Experience',
  'nav-projects': 'Personal projects & attempts',
  'nav-stack': 'Tech stack',
  'nav-personal': 'Beyond work'
};
var TITLES = {
  en: 'Alexandr Gribcov - Full Stack Engineer, Frontend Lead & Team Lead',
  ru: 'Александр Грибцов - Full Stack Engineer, Frontend Lead & Team Lead'
};

var els = document.querySelectorAll('[data-i18n]');
var enBtn = document.getElementById('lang-en');
var ruBtn = document.getElementById('lang-ru');

function setLang(lang, persist) {
  var dict = lang === 'ru' ? RU : EN;
  els.forEach(function (el) {
    if (dict[el.dataset.i18n]) el.innerHTML = dict[el.dataset.i18n];
  });
  document.title = TITLES[lang];
  document.documentElement.lang = lang;
  if (persist) localStorage.setItem('lang', lang);
  enBtn.classList.toggle('active', lang === 'en');
  ruBtn.classList.toggle('active', lang === 'ru');
}

// Language: saved choice > browser language > en default
var browserLang = navigator.language && navigator.language.toLowerCase().startsWith('ru') ? 'ru' : 'en';
var savedLang = localStorage.getItem('lang') || browserLang;

enBtn.addEventListener('click', function () { setLang('en', true); });
ruBtn.addEventListener('click', function () { setLang('ru', true); });
setLang(savedLang, false);
