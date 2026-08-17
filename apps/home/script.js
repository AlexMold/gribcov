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
  tagline: 'Full Stack инженер, Frontend Lead, тимлид. 12+ лет, 6 из них на удалёнке. Собираю продукты от идеи до прода.',
  stat1: 'лет в full-stack',
  stat2: 'человек в команде на пике',
  stat3: 'сократил саппорт с 3 недель',
  tg: 'Телеграм',
  'nav-work': 'Работа, которой горжусь',
  'nav-projects': 'Проекты',
  'nav-personal': 'За пределами кода'
};
var EN = {
  tagline: 'Full Stack Engineer & Team Lead. 12+ years, remote for 6. I ship products end to end.',
  stat1: 'years full-stack',
  stat2: 'people led at peak',
  stat3: 'client support cut',
  tg: 'Telegram',
  'nav-work': "Work I'm proud of",
  'nav-projects': 'Projects',
  'nav-personal': 'Beyond code'
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
