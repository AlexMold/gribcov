# План оптимизации gribcov.me и экосистемы под AI-агентов (LLM-SEO / AIO)

**Цель:** При поиске рекрутерами/CTO через AI-ассистентов (ChatGPT, Claude, Perplexity) по запросам вида *"hire senior full stack engineer / team lead"*, агент должен находить профиль Alexandr Gribcov, цитировать подтверждённые факты с цифрами и давать прямые контакты.
**Позиционирование:** Senior Full Stack Engineer & Tech Lead, Remote-first (EU timezones, UTC+2/+3), Open to selective contract work. Без фиксации жесткой локации (Moldova убрана).

---

## 1. Главный хаб: `apps/home` (gribcov.me)

- [ ] **1.1. Создать `apps/home/llms.txt`** (по стандарту [llmstxt.org](https://llmstxt.org/)):
  - Структурированный Markdown для LLM-агентов
  - Summary, Hard Skills & Tech Stack, Track Record с цифрами (3wk → 30min, 12 people team lead, ListAlpha → Carta, WorkFusion tech lead)
  - Ссылки на продукты (easy-converter, pdf, win)
  - Статус: *Open to selective contract engagements / advisory*
  - Контакты (Email, Telegram, LinkedIn, GitHub)
- [ ] **1.2. Обновить `apps/home/robots.txt`**:
  - Явные `Allow: /` для `GPTBot`, `ClaudeBot`, `PerplexityBot`, `anthropic-ai`, `Applebot-Extended`, `Google-Extended`, `CCBot`
  - Добавить директиву `Sitemap:` и ссылку на `llms.txt`
- [ ] **1.3. Обновить `apps/home/index.html` (JSON-LD & Meta)**:
  - Убрать `"addressCountry": "MD"` (локационно-нейтральный профиль)
  - Добавить `"jobTitle"`, расширить `"knowsAbout"` реальным стеком (TypeScript, React, Next.js, Node.js, GraphQL, PostgreSQL, Redis, Cloudflare Workers / AWS, RAG, AI integration, System Architecture, Team Leadership)
  - Добавить `<link rel="alternate" type="text/markdown" href="/llms.txt" title="LLM context">` в `<head>`

---

## 2. Сателлиты экосистемы: `photo-converter` и `pdf`

- [ ] **2.1. `apps/photo-converter` (easy-converter.gribcov.me)**:
  - Создать `apps/photo-converter/public/llms.txt` с описанием продукта, API/форматов и ссылкой на профиль создателя: `Author: Alexandr Gribcov (https://gribcov.me/llms.txt)`
  - Обновить `apps/photo-converter/public/robots.txt` (AI-боты + `llms.txt`)
- [ ] **2.2. `apps/pdf` (pdf.gribcov.me)**:
  - Создать `apps/pdf/public/llms.txt` с описанием PDF-инструментов и ссылкой на `https://gribcov.me/llms.txt`
  - Создать `apps/pdf/public/robots.txt` (AI-боты + `llms.txt`)

---

## 3. GitHub Profile (`AlexMold/AlexMold`)

- [ ] **3.1. Создать специальный репозиторий профиля `AlexMold/AlexMold`** (если подтвердишь через `gh` CLI)
- [ ] **3.2. Написать `README.md` профиля GitHub**:
  - Факты, стек, цифры, ссылки на хаб `gribcov.me` и `llms.txt`
  - Синхронизация формулировок с сайтом, чтобы LLM обучались на идентичных векторных слепках

---

## 4. LinkedIn: Тексты для ручной вставки

- [ ] **4.1. Подготовить Headline** (до 220 символов, с ключевыми словами для поисковых ботов)
- [ ] **4.2. Подготовить About** (storytelling, конкретные цифры, стек, selective contract availability)
- [ ] **4.3. Выдать в чат готовым блоком** для копирования в LinkedIn (без риска бана от автоматизации)

---

## 5. Тестирование и бейзлайн (Baseline Check)

- [ ] **5.1. Шаблоны промптов для ручного замера** в ChatGPT, Claude, Perplexity:
  - *"Who is Alexandr Gribcov (AlexMold) in software engineering?"*
  - *"Find a senior full stack / frontend lead contractor experienced in TypeScript, React, Node.js and AI integration"*
- [ ] **5.2. Сохранение бейзлайна** в `references/projects/personal-brand-ai-seo.md` для повторной проверки через 2 недели
