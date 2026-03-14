<template>
  <div class="stats-wrap">
    <!-- Three stat cards -->
    <div class="stats-row">
      <div class="stat">
        <span class="stat-icon">📐</span>
        <span class="stat-label">Лист</span>
        <span class="stat-val">{{ fmt(totalArea) }}</span>
        <span class="stat-unit">мм²</span>
      </div>

      <div class="stat">
        <span class="stat-icon">🟦</span>
        <span class="stat-label">Детали</span>
        <span class="stat-val">{{ fmt(partsArea) }}</span>
        <span class="stat-unit">мм²</span>
      </div>

      <div class="stat" :class="{ danger: remainderArea < 0 }">
        <span class="stat-icon">{{ remainderArea < 0 ? '⚠️' : '✂️' }}</span>
        <span class="stat-label">{{ remainderArea < 0 ? 'Превышение' : 'Остаток' }}</span>
        <span class="stat-val">{{ fmt(Math.abs(remainderArea)) }}</span>
        <span class="stat-unit">мм²</span>
      </div>
    </div>

    <!-- Utilization bar -->
    <div class="util-card card">
      <div class="util-header">
        <span class="util-label">Заполнение листа</span>
        <span class="util-pct" :class="{ danger: utilizationPct > 100 }">
          {{ utilizationPct }}%
        </span>
      </div>
      <div class="bar-track">
        <div
          class="bar-fill"
          :style="{
            width: Math.min(utilizationPct, 100) + '%',
            background: utilizationPct > 100 ? '#EF4444' : '#2563EB',
          }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGlassStore } from '~/composables/useGlassStore'

const { totalArea, partsArea, remainderArea, utilizationPct } = useGlassStore()

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

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.stat {
  background: white;
  border-radius: 14px;
  padding: 12px 10px;
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
  font-size: 18px;
  line-height: 1;
}

.stat-label {
  font-size: 10px;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-top: 2px;
}

.stat.danger .stat-label {
  color: #F87171;
}

.stat-val {
  font-size: 15px;
  font-weight: 800;
  color: #1E293B;
  line-height: 1.2;
  margin-top: 2px;
}

.stat.danger .stat-val {
  color: #DC2626;
}

.stat-unit {
  font-size: 10px;
  color: #CBD5E1;
}

/* Utilization card */
.util-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.util-label {
  font-size: 13px;
  color: #64748B;
  font-weight: 500;
}

.util-pct {
  font-size: 14px;
  font-weight: 700;
  color: #2563EB;
}

.util-pct.danger {
  color: #EF4444;
}

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
</style>
