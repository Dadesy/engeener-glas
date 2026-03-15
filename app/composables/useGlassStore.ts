import { ref, computed, watch } from 'vue'

export interface GlassPart {
  id: string
  label: string
  width: number
  height: number
  quantity: number
  points?: { x: number; y: number }[]  // normalized 0–1 relative to bbox; absent = rectangle
}

export interface PlacedPiece {
  instanceId: string   // unique: `${partId}-${i}`
  partId: string
  label: string
  x: number
  y: number
  w: number
  h: number
  colorIndex: number
  rotated: boolean
  sheetIndex: number   // which sheet this piece belongs to
  points?: { x: number; y: number }[]  // normalized 0–1; absent = rectangle
}

export interface FreeRect {
  x: number; y: number; w: number; h: number
}

export const PART_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
]

export const SHEET_PRESETS = [
  { label: '1000×2000', w: 1000, h: 2000 },
  { label: '1220×2440', w: 1220, h: 2440 },
  { label: '1500×3000', w: 1500, h: 3000 },
  { label: '2000×3000', w: 2000, h: 3000 },
  { label: '600×2000',  w: 600,  h: 2000 },
]

export const SHAPE_PRESETS = [
  {
    label: 'Прям. треугольник',
    icon: '◺',
    points: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }],
  },
  {
    label: 'Равн. треугольник',
    icon: '△',
    points: [{ x: 0.5, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }],
  },
  {
    label: 'Трапеция',
    icon: '⏢',
    points: [{ x: 0.2, y: 0 }, { x: 0.8, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }],
  },
  {
    label: 'Параллелограмм',
    icon: '▱',
    points: [{ x: 0.25, y: 0 }, { x: 1, y: 0 }, { x: 0.75, y: 1 }, { x: 0, y: 1 }],
  },
  {
    label: 'L-образная',
    icon: '⌐',
    points: [
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 0.45 },
      { x: 0.45, y: 0.45 }, { x: 0.45, y: 1 }, { x: 0, y: 1 },
    ],
  },
  {
    label: 'T-образная',
    icon: 'T',
    points: [
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 0.35 },
      { x: 0.65, y: 0.35 }, { x: 0.65, y: 1 },
      { x: 0.35, y: 1 }, { x: 0.35, y: 0.35 }, { x: 0, y: 0.35 },
    ],
  },
]

// ── MaxRects 2D Bin Packing ─────────────────────────────────────────────────
interface Rect { x: number; y: number; w: number; h: number }

type PackPiece = {
  instanceId: string; partId: string; label: string
  w: number; h: number; colorIndex: number; area: number
  points?: { x: number; y: number }[]
}

function rotatePoints(pts: { x: number; y: number }[]): { x: number; y: number }[] {
  // 90° CW rotation in normalized space: (x, y) → (y, 1 - x)
  return pts.map(p => ({ x: p.y, y: 1 - p.x }))
}

function maxRectsPack(
  sheetW: number,
  sheetH: number,
  pieces: PackPiece[],
  kerf = 0,
  sheetIndex = 0,
): { placed: PlacedPiece[]; free: Rect[] } {
  const placed: PlacedPiece[] = []
  let free: Rect[] = [{ x: 0, y: 0, w: sheetW, h: sheetH }]

  for (const piece of pieces) {
    type Candidate = {
      freeIdx: number; x: number; y: number
      w: number; h: number; bw: number; bh: number
      rotated: boolean; score: number
      points?: { x: number; y: number }[]
    }
    let best: Candidate | null = null

    const orientations: Array<{
      w: number; h: number; bw: number; bh: number; rotated: boolean
      points?: { x: number; y: number }[]
    }> = [
      {
        w: piece.w, h: piece.h,
        bw: piece.w + kerf, bh: piece.h + kerf,
        rotated: false,
        points: piece.points,
      },
      ...(piece.w !== piece.h ? [{
        w: piece.h, h: piece.w,
        bw: piece.h + kerf, bh: piece.w + kerf,
        rotated: true,
        points: piece.points ? rotatePoints(piece.points) : undefined,
      }] : []),
    ]

    for (let fi = 0; fi < free.length; fi++) {
      const f = free[fi]
      for (const o of orientations) {
        if (o.bw > f.w || o.bh > f.h) continue
        const score = Math.min(f.w - o.bw, f.h - o.bh)
        if (!best || score < best.score)
          best = { freeIdx: fi, x: f.x, y: f.y, ...o, score }
      }
    }

    if (!best) continue

    placed.push({
      instanceId: piece.instanceId,
      partId: piece.partId,
      label: piece.label,
      x: best.x, y: best.y,
      w: best.w, h: best.h,
      colorIndex: piece.colorIndex,
      rotated: best.rotated,
      sheetIndex,
      points: best.points,
    })

    const block: Rect = { x: best.x, y: best.y, w: best.bw, h: best.bh }
    const nextFree: Rect[] = []
    for (const f of free) {
      if (!rectsIntersect(block, f)) { nextFree.push(f); continue }
      if (block.x > f.x)
        nextFree.push({ x: f.x, y: f.y, w: block.x - f.x, h: f.h })
      if (block.x + block.w < f.x + f.w)
        nextFree.push({ x: block.x + block.w, y: f.y, w: (f.x + f.w) - (block.x + block.w), h: f.h })
      if (block.y > f.y)
        nextFree.push({ x: f.x, y: f.y, w: f.w, h: block.y - f.y })
      if (block.y + block.h < f.y + f.h)
        nextFree.push({ x: f.x, y: block.y + block.h, w: f.w, h: (f.y + f.h) - (block.y + block.h) })
    }
    free = pruneContained(nextFree)
  }

  return { placed, free }
}

function rectsIntersect(a: Rect, b: Rect): boolean {
  return !(a.x >= b.x + b.w || a.x + a.w <= b.x || a.y >= b.y + b.h || a.y + a.h <= b.y)
}

function pruneContained(rects: Rect[]): Rect[] {
  return rects.filter((r, i) =>
    !rects.some((o, j) =>
      i !== j && o.x <= r.x && o.y <= r.y &&
      o.x + o.w >= r.x + r.w && o.y + o.h >= r.y + r.h,
    ),
  )
}

// ── Persistence ───────────────────────────────────────────────────────────────
const STORAGE_KEY = 'glass-cutter-v1'

function saveState(data: object) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch {}
}

function loadState() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

// ── Singleton state ───────────────────────────────────────────────────────────
const sheet = ref({ width: 1000, height: 2000 })
const parts = ref<GlassPart[]>([])
const editTarget = ref<GlassPart | null>(null)

const kerfEnabled = ref(false)
const kerfSize = ref(2)

const isManualMode = ref(false)
const manualPlacements = ref<PlacedPiece[]>([])

const showGaps = ref(false)
const showPositions = ref(false)
const currentSheetIndex = ref(0)

let _initialized = false

export function useGlassStore() {
  // ── One-time client init ─────────────────────────────────────────
  if (!_initialized && typeof window !== 'undefined') {
    _initialized = true
    const saved = loadState()
    if (saved) {
      if (saved.sheet?.width && saved.sheet?.height) sheet.value = saved.sheet
      if (Array.isArray(saved.parts)) parts.value = saved.parts
      if (typeof saved.kerfEnabled === 'boolean') kerfEnabled.value = saved.kerfEnabled
      if (typeof saved.kerfSize === 'number') kerfSize.value = saved.kerfSize
    }
    watch(
      [sheet, parts, kerfEnabled, kerfSize],
      () => saveState({ sheet: sheet.value, parts: parts.value, kerfEnabled: kerfEnabled.value, kerfSize: kerfSize.value }),
      { deep: true },
    )
  }

  // ── Area ─────────────────────────────────────────────────────────
  const totalArea = computed(() => sheet.value.width * sheet.value.height)

  const partsArea = computed(() =>
    parts.value.reduce((sum, p) => sum + p.width * p.height * p.quantity, 0),
  )

  const remainderArea = computed(() => totalArea.value - partsArea.value)

  const utilizationPct = computed(() =>
    totalArea.value > 0
      ? Math.min(Math.round((partsArea.value / totalArea.value) * 100), 999)
      : 0,
  )

  // ── Multi-sheet packing ───────────────────────────────────────────
  const multiSheetResult = computed(() => {
    const sw = sheet.value.width
    const sh = sheet.value.height
    const kerf = kerfEnabled.value ? kerfSize.value : 0

    const colorMap = new Map<string, number>()
    parts.value.forEach((p, i) => colorMap.set(p.id, i % PART_COLORS.length))

    // Build all piece instances
    const allPieces: PackPiece[] = []

    for (const part of parts.value) {
      const fitsN = part.width <= sw && part.height <= sh
      const fitsR = part.height <= sw && part.width <= sh
      if (!fitsN && !fitsR) continue

      const label = part.label || `${part.width}×${part.height}`
      const colorIndex = colorMap.get(part.id) ?? 0

      for (let i = 0; i < part.quantity; i++) {
        allPieces.push({
          instanceId: `${part.id}-${i}`,
          partId: part.id, label,
          w: part.width, h: part.height,
          colorIndex,
          area: part.width * part.height,
          points: part.points,
        })
      }
    }

    allPieces.sort((a, b) => b.area - a.area)

    // Pack onto successive sheets until all placed or no progress
    const sheets: { placed: PlacedPiece[]; free: Rect[] }[] = []
    let remaining = [...allPieces]
    const MAX_SHEETS = 20

    while (remaining.length > 0 && sheets.length < MAX_SHEETS) {
      const result = maxRectsPack(sw, sh, remaining, kerf, sheets.length)
      if (result.placed.length === 0) break
      sheets.push(result)
      const placedIds = new Set(result.placed.map(p => p.instanceId))
      remaining = remaining.filter(p => !placedIds.has(p.instanceId))
    }

    return { sheets, unplaceable: remaining }
  })

  // Clamp currentSheetIndex when sheets count changes
  watch(multiSheetResult, (r) => {
    if (currentSheetIndex.value >= r.sheets.length && r.sheets.length > 0)
      currentSheetIndex.value = r.sheets.length - 1
  })

  const sheetsCount = computed(() => multiSheetResult.value.sheets.length)

  // Current sheet pack (for visualization)
  const currentSheetPack = computed(() =>
    multiSheetResult.value.sheets[currentSheetIndex.value] ?? { placed: [], free: [] },
  )

  const autoPlacements = computed(() => currentSheetPack.value.placed)

  const freeRects = computed((): FreeRect[] => {
    if (isManualMode.value) return []
    return currentSheetPack.value.free
      .filter(r => r.w >= 50 && r.h >= 50)
      .sort((a, b) => b.w * b.h - a.w * a.h)
  })

  // All pieces across all sheets (for stats and cutting list)
  const allPlacedPieces = computed<PlacedPiece[]>(() =>
    isManualMode.value
      ? manualPlacements.value
      : multiSheetResult.value.sheets.flatMap(s => s.placed),
  )

  // placedPieces = current sheet only (for SVG rendering)
  const placedPieces = computed<PlacedPiece[]>(() =>
    isManualMode.value ? manualPlacements.value : autoPlacements.value,
  )

  // ── Overlap detection (manual) ────────────────────────────────────
  const overlappingInstanceIds = computed((): Set<string> => {
    if (!isManualMode.value) return new Set()
    const pieces = manualPlacements.value
    const result = new Set<string>()
    for (let i = 0; i < pieces.length; i++) {
      for (let j = i + 1; j < pieces.length; j++) {
        const a = pieces[i], b = pieces[j]
        if (a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y) {
          result.add(a.instanceId)
          result.add(b.instanceId)
        }
      }
    }
    return result
  })

  // ── Manual mode ───────────────────────────────────────────────────
  function enterManualMode() {
    manualPlacements.value = autoPlacements.value.map(p => ({ ...p }))
    isManualMode.value = true
    showGaps.value = false
  }

  function exitManualMode() {
    isManualMode.value = false
    manualPlacements.value = []
  }

  function movePiece(instanceId: string, x: number, y: number) {
    if (!isManualMode.value) return
    const idx = manualPlacements.value.findIndex(p => p.instanceId === instanceId)
    if (idx === -1) return
    const p = manualPlacements.value[idx]
    const sw = sheet.value.width, sh = sheet.value.height
    manualPlacements.value = [
      ...manualPlacements.value.slice(0, idx),
      { ...p, x: Math.max(0, Math.min(Math.round(x), sw - p.w)), y: Math.max(0, Math.min(Math.round(y), sh - p.h)) },
      ...manualPlacements.value.slice(idx + 1),
    ]
  }

  // ── Placement stats (all sheets) ──────────────────────────────────
  const partPlacedCounts = computed((): Record<string, number> => {
    const counts: Record<string, number> = {}
    for (const p of allPlacedPieces.value)
      counts[p.partId] = (counts[p.partId] ?? 0) + 1
    return counts
  })

  const totalRequested = computed(() => parts.value.reduce((s, p) => s + p.quantity, 0))
  const totalPlaced = computed(() => allPlacedPieces.value.length)
  const totalUnplaced = computed(() =>
    isManualMode.value
      ? 0
      : multiSheetResult.value.unplaceable.length + (totalRequested.value - totalPlaced.value - multiSheetResult.value.unplaceable.length),
  )

  // Total area across all sheets used
  const totalSheetsArea = computed(() => totalArea.value * Math.max(1, sheetsCount.value))

  const placedArea = computed(() => allPlacedPieces.value.reduce((s, p) => s + p.w * p.h, 0))

  // Remainder = total material used minus placed area
  const sheetRemainder = computed(() => totalSheetsArea.value - placedArea.value)

  const placedPct = computed(() =>
    totalSheetsArea.value > 0 ? Math.round((placedArea.value / totalSheetsArea.value) * 100) : 0,
  )

  const oversizedPartIds = computed(() =>
    new Set(
      parts.value
        .filter(p => {
          const sw = sheet.value.width, sh = sheet.value.height
          return (p.width > sw || p.height > sh) && (p.height > sw || p.width > sh)
        })
        .map(p => p.id),
    ),
  )

  // ── Helpers ───────────────────────────────────────────────────────
  function canFitRotated(part: GlassPart): boolean {
    const { width: sw, height: sh } = sheet.value
    const fits = (w: number, h: number) => w <= sw && h <= sh
    return !fits(part.width, part.height) && fits(part.height, part.width)
  }

  function applyPreset(w: number, h: number) {
    sheet.value = { width: w, height: h }
  }

  function addPart(data: Omit<GlassPart, 'id'>) {
    if (isManualMode.value) exitManualMode()
    parts.value.push({ ...data, id: Date.now().toString() })
  }

  function updatePart(id: string, data: Omit<GlassPart, 'id'>) {
    if (isManualMode.value) exitManualMode()
    const idx = parts.value.findIndex(p => p.id === id)
    if (idx !== -1) parts.value[idx] = { ...data, id }
  }

  function deletePart(id: string) {
    if (isManualMode.value) exitManualMode()
    parts.value = parts.value.filter(p => p.id !== id)
    if (editTarget.value?.id === id) editTarget.value = null
  }

  function clearAll() {
    if (isManualMode.value) exitManualMode()
    parts.value = []
    editTarget.value = null
  }

  function partColorIndex(id: string): number {
    return parts.value.findIndex(p => p.id === id) % PART_COLORS.length
  }

  return {
    sheet, parts, editTarget,
    kerfEnabled, kerfSize,
    isManualMode, enterManualMode, exitManualMode, movePiece,
    overlappingInstanceIds,
    showGaps, showPositions,
    // multi-sheet
    sheetsCount, currentSheetIndex, multiSheetResult,
    // pieces
    placedPieces, allPlacedPieces, freeRects,
    partPlacedCounts, oversizedPartIds,
    totalRequested, totalPlaced, totalUnplaced,
    // area
    totalArea, totalSheetsArea, partsArea, remainderArea,
    placedArea, sheetRemainder, utilizationPct, placedPct,
    // helpers
    canFitRotated, applyPreset, addPart, updatePart, deletePart, clearAll, partColorIndex,
  }
}
