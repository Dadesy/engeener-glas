<template>
  <div class="stats-wrap">

    <!-- Row 1: three area cards -->
    <div class="stats-row">
      <div class="stat">
        <span class="stat-icon">📐</span>
        <span class="stat-label">Площадь листа</span>
        <span class="stat-val">{{ fmt(totalArea) }}</span>
        <span class="stat-unit">мм²</span>
      </div>

      <div class="stat">
        <span class="stat-icon">🟦</span>
        <span class="stat-label">Запрошено</span>
        <span class="stat-val">{{ fmt(partsArea) }}</span>
        <span class="stat-unit">мм²</span>
      </div>

      <div class="stat" :class="sheetRemainder < 0 ? 'danger' : ''">
        <span class="stat-icon">{{ sheetRemainder <= 0 ? '⚠️' : '✂️' }}</span>
        <span class="stat-label">Остаток</span>
        <span class="stat-val">{{ fmt(sheetRemainder) }}</span>
        <span class="stat-unit">мм²</span>
      </div>
    </div>

    <!-- Row 2: pieces placed summary -->
    <div class="card pieces-card" :class="totalUnplaced > 0 ? 'warn-card' : ''">
      <div class="pieces-row">
        <div class="pieces-main">
          <span class="pieces-label">Размещено деталей</span>
          <div class="pieces-count">
            <span class="pieces-placed" :class="totalUnplaced > 0 ? 'partial' : 'full'">
              {{ totalPlaced }}
            </span>
            <span class="pieces-sep">/</span>
            <span class="pieces-total">{{ totalRequested }}</span>
          </div>
        </div>

        <div v-if="totalUnplaced > 0" class="unplaced-badge">
          <span>{{ totalUnplaced }} не влезло</span>
        </div>
        <div v-else-if="totalRequested > 0" class="all-ok-badge">
          <span>Всё OK</span>
        </div>
      </div>

      <!-- Pieces progress bar -->
      <div v-if="totalRequested > 0" class="bar-track" style="margin-top: 10px;">
        <div
          class="bar-fill"
          :style="{
            width: (totalRequested > 0 ? (totalPlaced / totalRequested) * 100 : 0) + '%',
            background: totalUnplaced > 0 ? '#F59E0B' : '#10B981',
          }"
        />
      </div>
    </div>

    <!-- Row 3: area utilization -->
    <div class="card util-card" :class="utilizationPct > 100 ? 'danger-card' : ''">
      <div class="util-header">
        <div>
          <span class="util-label">Заполнение листа</span>
          <div class="util-sub">
            размещено {{ fmt(placedArea) }} из {{ fmt(totalArea) }} мм²
          </div>
        </div>
        <span class="util-pct" :class="{ danger: utilizationPct > 100 }">
          {{ placedPct }}%
        </span>
      </div>
      <div class="bar-track">
        <div
          class="bar-fill"
          :style="{
            width: Math.min(placedPct, 100) + '%',
            background: utilizationPct > 100 ? '#EF4444' : '#2563EB',
          }"
        />
      </div>

      <!-- Requested vs sheet warning -->
      <div v-if="remainderArea < 0" class="overflow-warn">
        ⚠️ Суммарная площадь деталей превышает лист на {{ fmt(Math.abs(remainderArea)) }} мм²
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { useGlassStore } from '~/composables/useGlassStore'

const {
  totalArea,
  partsArea,
  remainderArea,
  placedArea,
  sheetRemainder,
  utilizationPct,
  placedPct,
  totalRequested,
  totalPlaced,
  totalUnplaced,
} = useGlassStore()

function fmt(n: number): string {
  return n.toLocaleString('ru-RU')
}
</script>

<style scoped>
.stats-wrap {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* ── Area row ─────────────────────────────────────────── */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.stat {
  background: white;
  border-radius: 14px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.stat.danger {
  background: #FEF2F2;
}

.stat-icon {
  font-size: 16px;
  line-height: 1;
}

.stat-label {
  font-size: 9px;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-top: 2px;
}

.stat.danger .stat-label { color: #F87171; }

.stat-val {
  font-size: 14px;
  font-weight: 800;
  color: #1E293B;
  line-height: 1.2;
  margin-top: 2px;
}

.stat.danger .stat-val { color: #DC2626; }

.stat-unit {
  font-size: 10px;
  color: #CBD5E1;
}

/* ── Pieces card ───────────────────────────────────────── */
.pieces-card {
  border-left: 3px solid #E2E8F0;
}

.pieces-card.warn-card {
  border-left-color: #F59E0B;
  background: #FFFBEB;
}

.pieces-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pieces-main {
  flex: 1;
}

.pieces-label {
  font-size: 12px;
  color: #64748B;
  font-weight: 500;
}

.pieces-count {
  display: flex;
  align-items: baseline;
  gap: 3px;
  margin-top: 2px;
}

.pieces-placed {
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
}

.pieces-placed.full  { color: #10B981; }
.pieces-placed.partial { color: #F59E0B; }

.pieces-sep {
  font-size: 20px;
  color: #CBD5E1;
  font-weight: 300;
}

.pieces-total {
  font-size: 20px;
  font-weight: 700;
  color: #94A3B8;
}

.unplaced-badge {
  background: #FEF3C7;
  color: #92400E;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 10px;
  border-radius: 10px;
  text-align: center;
  flex-shrink: 0;
}

.all-ok-badge {
  background: #D1FAE5;
  color: #065F46;
  font-size: 12px;
  font-weight: 700;
  padding: 6px 10px;
  border-radius: 10px;
  flex-shrink: 0;
}

/* ── Utilization card ─────────────────────────────────── */
.util-card.danger-card {
  background: #FEF2F2;
}

.util-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
}

.util-label {
  font-size: 13px;
  color: #64748B;
  font-weight: 500;
}

.util-sub {
  font-size: 11px;
  color: #94A3B8;
  margin-top: 2px;
}

.util-pct {
  font-size: 22px;
  font-weight: 800;
  color: #2563EB;
  line-height: 1;
}

.util-pct.danger { color: #EF4444; }

.bar-track {
  height: 8px;
  background: #F1F5F9;
  border-radius: 99px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.4s ease, background 0.3s;
}

.overflow-warn {
  margin-top: 10px;
  font-size: 12px;
  color: #B45309;
  background: #FEF3C7;
  padding: 8px 10px;
  border-radius: 8px;
  line-height: 1.4;
}
</style>
