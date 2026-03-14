<template>
  <div class="app">
    <header class="header">
      <svg class="header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="2" y="3" width="20" height="18" rx="1" />
        <line x1="2" y1="9" x2="22" y2="9" />
        <line x1="12" y1="9" x2="12" y2="21" />
      </svg>
      <h1>Раскрой стекла</h1>
    </header>

    <main class="main">
      <SheetSetup />
      <StatsPanel />
      <GlassVisualization />
      <PartForm />
      <PartsList />
    </main>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Раскрой стекла',
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1' },
    { name: 'theme-color', content: '#2563EB' },
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
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #F1F5F9;
  color: #1E293B;
  -webkit-tap-highlight-color: transparent;
  overscroll-behavior: none;
}

/* ─── Layout ───────────────────────────────────────────────────── */
.app {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.header {
  background: #2563EB;
  color: white;
  padding: 14px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4);
}

.header-icon {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
}

.header h1 {
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.main {
  flex: 1;
  max-width: 640px;
  width: 100%;
  margin: 0 auto;
  padding: 14px 14px 100px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ─── Card (shared base) ───────────────────────────────────────── */
.card {
  background: white;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.card-title {
  font-size: 11px;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 14px;
}

/* ─── Shared input style ───────────────────────────────────────── */
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

.input::placeholder {
  color: #CBD5E1;
}

/* ─── Shared button ────────────────────────────────────────────── */
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

.btn:active {
  transform: scale(0.97);
  opacity: 0.9;
}

.btn-primary {
  background: #2563EB;
  color: white;
  width: 100%;
}

.btn-danger {
  background: #FEF2F2;
  color: #DC2626;
}

.btn-ghost {
  background: #F1F5F9;
  color: #475569;
}

/* ─── Error text ───────────────────────────────────────────────── */
.error-msg {
  margin-top: 8px;
  color: #DC2626;
  font-size: 13px;
  line-height: 1.4;
}

/* ─── Field label ──────────────────────────────────────────────── */
.field-label {
  font-size: 13px;
  font-weight: 500;
  color: #64748B;
  margin-bottom: 5px;
  display: block;
}
</style>
