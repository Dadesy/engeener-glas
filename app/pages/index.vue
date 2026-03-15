<template>
  <div class="app">
    <header class="header">
      <div class="header-inner">
        <div class="header-brand">
          <svg class="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="2" y="3" width="20" height="18" rx="1" />
            <line x1="2" y1="9" x2="22" y2="9" />
            <line x1="12" y1="9" x2="12" y2="21" />
          </svg>
          <div>
            <div class="header-title">КройМастер</div>
            <div class="header-sub">Раскрой листовых материалов — прямоугольники и фигуры</div>
          </div>
        </div>
      </div>
    </header>

    <div class="layout">
      <aside class="sidebar">
        <SheetSetup />
        <PartForm />
        <PartsList />
        <ClearAllButton />
      </aside>

      <main class="content" id="main-content">
        <StatsPanel />
        <GlassVisualization />
        <CuttingList />
      </main>
    </div>

    <InfoSection />

    <footer class="site-footer">
      <p>© 2025 КройМастер — бесплатный калькулятор раскроя листовых материалов и произвольных фигур</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
const title = 'КройМастер — бесплатный онлайн-раскрой листовых материалов: прямоугольники и произвольные фигуры'
const description = 'Бесплатный онлайн-калькулятор раскроя стекла, металла, дерева и ДСП. Поддержка прямоугольных деталей и произвольных многоугольников. Алгоритм MaxRects, учёт пропила, экспорт в SVG, ручная корректировка.'
const url = 'https://kroymaster.ru'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  ogUrl: url,
  ogImage: `${url}/og-image.png`,
  ogImageWidth: '1200',
  ogImageHeight: '630',
  twitterCard: 'summary_large_image',
  twitterTitle: title,
  twitterDescription: description,
  robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
  keywords: 'раскрой онлайн, калькулятор раскроя, раскрой стекла, раскрой металла, раскрой фанеры, раскрой ДСП, раскрой МДФ, оптимизация раскроя, нарезка листового материала, раскрой произвольных фигур, раскрой многоугольников, нестандартные детали раскрой, фигурный раскрой, программа раскроя, кроймастер',
})

useHead({
  htmlAttrs: { lang: 'ru' },
  title,
  link: [
    { rel: 'canonical', href: url },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  ],
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=5' },
    { name: 'theme-color', content: '#2563EB' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
    { name: 'apple-mobile-web-app-title', content: 'КройМастер' },
    { name: 'application-name', content: 'КройМастер' },
    { name: 'author', content: 'КройМастер' },
    { name: 'geo.region', content: 'RU' },
    { name: 'geo.placename', content: 'Россия' },
    { property: 'og:locale', content: 'ru_RU' },
    { property: 'og:site_name', content: 'КройМастер' },
  ],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'КройМастер',
        url,
        description,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript. Requires HTML5.',
        inLanguage: 'ru',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'RUB' },
        featureList: [
          'Алгоритм оптимального размещения MaxRects',
          'Поддержка прямоугольных деталей',
          'Поддержка произвольных многоугольников и фигур',
          'Редактор произвольных фигур с сеткой',
          'Готовые шаблоны фигур: треугольник, трапеция, L-образная, T-образная',
          'Поддержка поворота деталей',
          'Учёт пропила',
          'Ручная корректировка расположения',
          'Экспорт схемы в SVG',
          'Таблица кроя с координатами',
          'Автосохранение',
        ],
      }),
    },
  ],
})
</script>

<style>
/* ─── Reset & base ─────────────────────────────────────────────── */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-text-size-adjust: 100%;
  scroll-behavior: smooth;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #F1F5F9;
  color: #1E293B;
  -webkit-tap-highlight-color: transparent;
}

/* ─── Header ────────────────────────────────────────────────────── */
.header {
  background: #2563EB;
  color: white;
  padding: 0 20px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 12px rgba(37, 99, 235, 0.35);
}

.header-inner {
  max-width: 1320px;
  margin: 0 auto;
  height: 56px;
  display: flex;
  align-items: center;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  opacity: 0.95;
}

.header-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.header-sub {
  font-size: 11px;
  opacity: 0.75;
  letter-spacing: 0.01em;
  display: none;
}

@media (min-width: 600px) {
  .header-sub { display: block; }
}

/* ─── Layout ────────────────────────────────────────────────────── */
.layout {
  max-width: 1320px;
  margin: 0 auto;
  padding: 16px 14px 40px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Mobile: sidebar first (form before viz) */
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ─── Desktop two-column ────────────────────────────────────────── */
@media (min-width: 900px) {
  .layout {
    flex-direction: row;
    align-items: flex-start;
    gap: 16px;
    padding: 20px 24px 60px;
  }

  .sidebar {
    width: 360px;
    flex-shrink: 0;
    position: sticky;
    top: 72px;
    max-height: calc(100vh - 88px);
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: #CBD5E1 transparent;
    padding-bottom: 4px;
  }

  .sidebar::-webkit-scrollbar { width: 4px; }
  .sidebar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }

  .content {
    flex: 1;
    min-width: 0;
  }
}

@media (min-width: 1200px) {
  .sidebar { width: 400px; }
}

/* ─── Card (shared base) ─────────────────────────────────────────── */
.card {
  background: white;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.07);
}

.card-title {
  font-size: 11px;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 14px;
}

/* ─── Input ──────────────────────────────────────────────────────── */
.input {
  height: 48px;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  padding: 0 14px;
  font-size: 17px;
  color: #1E293B;
  width: 100%;
  background: white;
  transition: border-color 0.15s;
  -webkit-appearance: none;
}

.input:focus {
  outline: none;
  border-color: #2563EB;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.input::placeholder { color: #CBD5E1; }

/* ─── Buttons ────────────────────────────────────────────────────── */
.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 52px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s, transform 0.1s;
  -webkit-appearance: none;
}

.btn:active { transform: scale(0.97); opacity: 0.9; }

.btn-primary { background: #2563EB; color: white; width: 100%; }
.btn-danger  { background: #FEF2F2; color: #DC2626; }
.btn-ghost   { background: #F1F5F9; color: #475569; }

/* ─── Misc ───────────────────────────────────────────────────────── */
.error-msg {
  margin-top: 8px;
  color: #DC2626;
  font-size: 13px;
  line-height: 1.4;
}

.field-label {
  font-size: 13px;
  font-weight: 500;
  color: #64748B;
  margin-bottom: 5px;
  display: block;
}

/* ─── Footer ─────────────────────────────────────────────────────── */
.site-footer {
  text-align: center;
  padding: 20px 16px 40px;
  font-size: 12px;
  color: #94A3B8;
  max-width: 1320px;
  margin: 0 auto;
}

/* ─── Print ───────────────────────────────────────────────────────── */
@media print {
  .header,
  .sidebar,
  .site-footer,
  section[class*="info"],
  .info-section { display: none !important; }

  body { background: white; }

  .layout {
    display: block;
    padding: 0;
    max-width: 100%;
  }

  .content {
    display: block;
  }

  .card {
    box-shadow: none;
    border: 1px solid #E2E8F0;
    break-inside: avoid;
  }
}
</style>
