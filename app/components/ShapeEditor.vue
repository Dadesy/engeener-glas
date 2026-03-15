<template>
  <div class="shape-editor">

    <!-- How-to steps -->
    <div class="how-to">
      <div class="how-step" :class="{ active: points.length === 0, done: points.length >= 1 }">
        <span class="step-dot">{{ points.length >= 1 ? '✓' : '1' }}</span>
        <span>Нажимайте на канвас — каждый клик добавляет вершину</span>
      </div>
      <div class="how-step" :class="{ active: points.length >= 1 && points.length < 3, done: points.length >= 3 }">
        <span class="step-dot">{{ points.length >= 3 ? '✓' : '2' }}</span>
        <span>Добавьте минимум 3 вершины — фигура замкнётся автоматически</span>
      </div>
      <div class="how-step" :class="{ active: points.length >= 3 }">
        <span class="step-dot">3</span>
        <span>Нажмите на вершину чтобы удалить её. Ширина и высота задают масштаб</span>
      </div>
    </div>

    <!-- Toolbar -->
    <div v-if="points.length > 0" class="editor-toolbar">
      <span class="pts-badge">{{ points.length }} {{ ptLabel(points.length) }}</span>
      <div class="toolbar-btns">
        <button type="button" class="tool-btn undo-btn" @click="undoLast" :disabled="points.length === 0">
          ↩ Отменить
        </button>
        <button type="button" class="tool-btn clear-btn" @click="clearPoints">
          ✕ Сбросить
        </button>
      </div>
    </div>

    <!-- SVG Canvas -->
    <div class="canvas-wrap" ref="wrapRef">
      <svg
        ref="svgEl"
        :viewBox="`0 0 ${SZ} ${SZ}`"
        class="canvas"
        @pointerdown.prevent="onBgDown"
        @pointermove.prevent="onPointerMove"
        @pointerleave="hoverPt = null"
        @touchstart.prevent
      >
        <!-- Grid dots -->
        <g pointer-events="none">
          <circle
            v-for="d in gridDots" :key="d.k"
            :cx="d.cx" :cy="d.cy" r="1.5"
            fill="#94A3B8" opacity="0.4"
          />
        </g>

        <!-- Empty-state hint -->
        <g v-if="points.length === 0" pointer-events="none" opacity="0.4">
          <text :x="SZ/2" :y="SZ/2 - 10" text-anchor="middle" font-size="14"
            fill="#64748B" font-family="-apple-system,sans-serif">
            Нажмите чтобы добавить
          </text>
          <text :x="SZ/2" :y="SZ/2 + 10" text-anchor="middle" font-size="14"
            fill="#64748B" font-family="-apple-system,sans-serif">
            первую вершину
          </text>
        </g>

        <!-- Preview line: last vertex → hover point -->
        <line
          v-if="hoverPt && points.length > 0 && !nearExisting(hoverPt)"
          :x1="points[points.length - 1].x * SZ"
          :y1="points[points.length - 1].y * SZ"
          :x2="hoverPt.x * SZ"
          :y2="hoverPt.y * SZ"
          stroke="#2563EB" stroke-width="1.5"
          stroke-dasharray="5 4" opacity="0.45"
          pointer-events="none"
        />

        <!-- Polygon fill -->
        <polygon
          v-if="points.length >= 3"
          :points="svgPts"
          fill="#3B82F6" opacity="0.15"
          pointer-events="none"
        />

        <!-- Polygon outline -->
        <polyline
          v-if="points.length >= 2"
          :points="svgPts"
          fill="none" stroke="#2563EB"
          stroke-width="2" stroke-linejoin="round"
          stroke-linecap="round"
          pointer-events="none"
        />

        <!-- Closing edge (dashed) -->
        <line
          v-if="points.length >= 3"
          :x1="points[points.length - 1].x * SZ"
          :y1="points[points.length - 1].y * SZ"
          :x2="points[0].x * SZ"
          :y2="points[0].y * SZ"
          stroke="#2563EB" stroke-width="2"
          stroke-dasharray="5 4"
          pointer-events="none"
        />

        <!-- Hover snap indicator -->
        <g v-if="hoverPt && !nearExisting(hoverPt)" pointer-events="none">
          <circle :cx="hoverPt.x * SZ" :cy="hoverPt.y * SZ"
            r="14" fill="#2563EB" opacity="0.08" />
          <circle :cx="hoverPt.x * SZ" :cy="hoverPt.y * SZ"
            r="5" fill="#2563EB" opacity="0.35" />
        </g>

        <!-- Vertices -->
        <g v-for="(pt, i) in points" :key="`vx-${i}`">
          <!-- Large tap target (invisible) -->
          <circle
            :cx="pt.x * SZ" :cy="pt.y * SZ"
            :r="HIT"
            fill="transparent"
            class="vtx-hit"
            @pointerdown.stop.prevent="removePoint(i)"
          />
          <!-- Visual ring -->
          <circle
            :cx="pt.x * SZ" :cy="pt.y * SZ"
            r="7" fill="white"
            stroke="#2563EB" stroke-width="2.5"
            pointer-events="none"
          />
          <!-- Hover delete indicator -->
          <circle
            v-if="hoveredVertex === i"
            :cx="pt.x * SZ" :cy="pt.y * SZ"
            r="7" fill="#FEE2E2"
            stroke="#EF4444" stroke-width="2"
            pointer-events="none"
          />
          <!-- Index number -->
          <text
            :x="pt.x * SZ + 10"
            :y="pt.y * SZ - 8"
            font-size="9" font-weight="700"
            fill="#475569" font-family="-apple-system,sans-serif"
            pointer-events="none"
          >{{ i + 1 }}</text>
        </g>
      </svg>
    </div>

    <!-- Status bar -->
    <div class="status-bar">
      <template v-if="points.length === 0">
        <span class="status-idle">Канвас пустой — начните рисовать фигуру</span>
      </template>
      <template v-else-if="points.length < 3">
        <span class="status-warn">Ещё {{ 3 - points.length }} {{ needLabel(3 - points.length) }} до замкнутой фигуры</span>
      </template>
      <template v-else>
        <span class="status-ok">✓ Фигура готова · {{ points.length }} вершин</span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps<{
  points: { x: number; y: number }[]
}>()

const emit = defineEmits<{
  (e: 'update:points', pts: { x: number; y: number }[]): void
}>()

const SZ = 240        // viewBox size
const GRID = 8        // grid divisions
const CELL = SZ / GRID
const HIT = 18        // vertex tap-target radius (large for mobile)
const NEAR = 20       // px threshold: near existing vertex → delete, not add

const svgEl = ref<SVGSVGElement | null>(null)
const wrapRef = ref<HTMLElement | null>(null)
const hoverPt = ref<{ x: number; y: number } | null>(null)
const hoveredVertex = ref<number | null>(null)

// Grid dots at every intersection
const gridDots = computed(() => {
  const dots = []
  for (let gx = 0; gx <= GRID; gx++)
    for (let gy = 0; gy <= GRID; gy++)
      dots.push({ k: `${gx}-${gy}`, cx: gx * CELL, cy: gy * CELL })
  return dots
})

const svgPts = computed(() =>
  props.points.map(p => `${p.x * SZ},${p.y * SZ}`).join(' '),
)

// Convert DOM pointer coords → normalized 0–1, snapped to grid
function toNorm(e: PointerEvent): { x: number; y: number } | null {
  const svg = svgEl.value
  if (!svg) return null
  const r = svg.getBoundingClientRect()
  if (r.width === 0 || r.height === 0) return null
  const rawX = (e.clientX - r.left) * (SZ / r.width)
  const rawY = (e.clientY - r.top) * (SZ / r.height)
  const snap = (v: number) => Math.max(0, Math.min(1, Math.round(v / CELL) * CELL / SZ))
  return { x: snap(rawX), y: snap(rawY) }
}

// Check if a normalized point is near an existing vertex (in viewBox px)
function nearExisting(pt: { x: number; y: number }): boolean {
  return props.points.some(p => {
    const dx = (p.x - pt.x) * SZ
    const dy = (p.y - pt.y) * SZ
    return Math.sqrt(dx * dx + dy * dy) < NEAR
  })
}

function onBgDown(e: PointerEvent) {
  const pt = toNorm(e)
  if (!pt) return
  if (nearExisting(pt)) return  // vertex hit areas handle deletion via @pointerdown.stop
  emit('update:points', [...props.points, pt])
}

function onPointerMove(e: PointerEvent) {
  const pt = toNorm(e)
  if (!pt) { hoverPt.value = null; hoveredVertex.value = null; return }
  hoverPt.value = pt
  // Find if hovering near a vertex
  const idx = props.points.findIndex(p => {
    const dx = (p.x - pt.x) * SZ
    const dy = (p.y - pt.y) * SZ
    return Math.sqrt(dx * dx + dy * dy) < NEAR
  })
  hoveredVertex.value = idx >= 0 ? idx : null
}

function removePoint(i: number) {
  emit('update:points', props.points.filter((_, idx) => idx !== i))
  hoveredVertex.value = null
}

function undoLast() {
  if (props.points.length === 0) return
  emit('update:points', props.points.slice(0, -1))
}

function clearPoints() {
  emit('update:points', [])
  hoverPt.value = null
  hoveredVertex.value = null
}

// Russian pluralization helpers
function ptLabel(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'вершина'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'вершины'
  return 'вершин'
}
function needLabel(n: number): string {
  if (n === 1) return 'вершина'
  if (n === 2) return 'вершины'
  return 'вершин'
}
</script>

<style scoped>
.shape-editor {
  margin-top: 10px;
}

/* ── How-to steps ──────────────────────────────────────────── */
.how-to {
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 12px;
  padding: 10px 12px;
  background: #F8FAFC;
  border-radius: 10px;
  border: 1px solid #F1F5F9;
}

.how-step {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 11.5px;
  color: #94A3B8;
  line-height: 1.4;
  transition: color 0.2s;
}

.how-step.active { color: #2563EB; }
.how-step.done   { color: #10B981; }

.step-dot {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #E2E8F0;
  color: #64748B;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 0.5px;
  transition: background 0.2s, color 0.2s;
}

.how-step.active .step-dot {
  background: #DBEAFE;
  color: #2563EB;
}

.how-step.done .step-dot {
  background: #D1FAE5;
  color: #059669;
}

/* ── Toolbar ───────────────────────────────────────────────── */
.editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.pts-badge {
  font-size: 12px;
  font-weight: 700;
  color: #2563EB;
  background: #EFF6FF;
  padding: 3px 10px;
  border-radius: 99px;
}

.toolbar-btns {
  display: flex;
  gap: 6px;
}

.tool-btn {
  font-size: 12px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 8px;
  border: 1.5px solid;
  cursor: pointer;
  transition: background 0.15s;
  touch-action: manipulation;
}

.undo-btn {
  color: #475569;
  background: #F8FAFC;
  border-color: #E2E8F0;
}
.undo-btn:active { background: #E2E8F0; }

.clear-btn {
  color: #DC2626;
  background: #FEF2F2;
  border-color: #FECACA;
}
.clear-btn:active { background: #FEE2E2; }

/* ── Canvas ────────────────────────────────────────────────── */
.canvas-wrap {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  border: 1.5px solid #E2E8F0;
  background: #F8FAFC;
}

.canvas {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  cursor: crosshair;
  touch-action: none;
  -webkit-tap-highlight-color: transparent;
}

.vtx-hit {
  cursor: pointer;
  touch-action: manipulation;
}

/* ── Status bar ────────────────────────────────────────────── */
.status-bar {
  margin-top: 8px;
  font-size: 12px;
  text-align: center;
  min-height: 20px;
}

.status-idle { color: #94A3B8; }
.status-warn { color: #D97706; font-weight: 600; }
.status-ok   { color: #059669; font-weight: 700; }
</style>
