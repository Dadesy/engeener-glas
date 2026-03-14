<template>
  <div class="card">
    <p class="card-title">Схема раскроя</p>

    <div ref="wrapRef" class="svg-wrap">
      <svg
        v-if="sheet.width > 0 && sheet.height > 0 && containerW > 0"
        :viewBox="`0 0 ${sheet.width} ${sheet.height}`"
        :width="containerW"
        :height="svgH"
        style="display: block; border-radius: 8px;"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- Sheet background -->
        <rect
          x="0" y="0"
          :width="sheet.width" :height="sheet.height"
          fill="#EFF6FF"
          stroke="#BFDBFE"
          :stroke-width="sw(6)"
        />

        <!-- Grid lines (optional visual aid) -->
        <g opacity="0.25">
          <template v-for="gx in gridLines.x" :key="`gx-${gx}`">
            <line :x1="gx" y1="0" :x2="gx" :y2="sheet.height" stroke="#93C5FD" :stroke-width="sw(2)" />
          </template>
          <template v-for="gy in gridLines.y" :key="`gy-${gy}`">
            <line x1="0" :y1="gy" :x2="sheet.width" :y2="gy" stroke="#93C5FD" :stroke-width="sw(2)" />
          </template>
        </g>

        <!-- Placed pieces -->
        <g v-for="piece in placedPieces" :key="`${piece.partId}-${piece.x}-${piece.y}`">
          <!-- Shadow -->
          <rect
            :x="piece.x + sw(8)"
            :y="piece.y + sw(8)"
            :width="piece.w - sw(4)"
            :height="piece.h - sw(4)"
            :fill="PART_COLORS[piece.colorIndex]"
            opacity="0.15"
            rx="4"
          />
          <!-- Fill -->
          <rect
            :x="piece.x + sw(3)"
            :y="piece.y + sw(3)"
            :width="piece.w - sw(6)"
            :height="piece.h - sw(6)"
            :fill="PART_COLORS[piece.colorIndex]"
            opacity="0.85"
            :stroke="PART_COLORS[piece.colorIndex]"
            :stroke-width="sw(3)"
            rx="4"
          />
          <!-- Label: only show if piece is large enough on screen -->
          <text
            v-if="piece.w * scale > 48 && piece.h * scale > 22"
            :x="piece.x + piece.w / 2"
            :y="piece.y + piece.h / 2"
            text-anchor="middle"
            dominant-baseline="middle"
            fill="white"
            :font-size="labelSize(piece.w, piece.h)"
            font-weight="700"
            font-family="-apple-system, sans-serif"
          >{{ piece.label }}</text>
        </g>

        <!-- Dimension labels -->
        <text
          :x="sheet.width / 2"
          :y="sheet.height - sw(14)"
          text-anchor="middle"
          :fill="dimColor"
          :font-size="sw(28)"
          font-family="-apple-system, sans-serif"
          font-weight="600"
        >{{ sheet.width }} мм</text>

        <text
          :x="sw(28)"
          :y="sheet.height / 2"
          text-anchor="middle"
          dominant-baseline="middle"
          :fill="dimColor"
          :font-size="sw(28)"
          font-family="-apple-system, sans-serif"
          font-weight="600"
          :transform="`rotate(-90, ${sw(28)}, ${sheet.height / 2})`"
        >{{ sheet.height }} мм</text>
      </svg>

      <div v-else class="empty-state">
        Укажите размеры листа
      </div>
    </div>

    <p v-if="unplacedCount > 0" class="warn">
      ⚠️ {{ unplacedCount }} дет. не вписываются — проверьте размеры
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useGlassStore, PART_COLORS } from '~/composables/useGlassStore'

const { sheet, parts, placedPieces } = useGlassStore()

const wrapRef = ref<HTMLElement | null>(null)
const containerW = ref(0)

// Scale factor: SVG user-units → screen pixels
const scale = computed(() =>
  sheet.value.width > 0 ? containerW.value / sheet.value.width : 1
)

// SVG rendered height
const svgH = computed(() =>
  sheet.value.height > 0 && sheet.value.width > 0
    ? Math.round(containerW.value * sheet.value.height / sheet.value.width)
    : 0
)

// Convert a "pixel" size to SVG user units
function sw(px: number): number {
  return scale.value > 0 ? px / scale.value : px
}

function labelSize(w: number, h: number): number {
  return Math.max(sw(12), Math.min(w, h) / 7)
}

const dimColor = '#94A3B8'

// Light grid every 20% of dimensions
const gridLines = computed(() => {
  const xs: number[] = []
  const ys: number[] = []
  const step = 5
  for (let i = 1; i < step; i++) {
    xs.push(Math.round(sheet.value.width * i / step))
    ys.push(Math.round(sheet.value.height * i / step))
  }
  return { x: xs, y: ys }
})

// Count pieces that don't fit at all (either dimension > sheet)
const unplacedCount = computed(() => {
  const sw = sheet.value.width
  const sh = sheet.value.height
  return parts.value
    .filter(p => p.width > sw || p.height > sh)
    .reduce((sum, p) => sum + p.quantity, 0)
})

// ResizeObserver to track container width
let ro: ResizeObserver | null = null

function measure() {
  if (wrapRef.value) containerW.value = wrapRef.value.clientWidth
}

onMounted(() => {
  measure()
  ro = new ResizeObserver(measure)
  if (wrapRef.value) ro.observe(wrapRef.value)
})

onUnmounted(() => ro?.disconnect())
</script>

<style scoped>
.svg-wrap {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background: #F8FAFC;
  min-height: 80px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  color: #CBD5E1;
  font-size: 14px;
}

.warn {
  margin-top: 10px;
  font-size: 13px;
  color: #D97706;
  background: #FFFBEB;
  padding: 8px 12px;
  border-radius: 8px;
}
</style>
