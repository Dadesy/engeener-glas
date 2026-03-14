import { ref, computed } from 'vue'

export interface GlassPart {
  id: string
  label: string
  width: number
  height: number
  quantity: number
}

export interface PlacedPiece {
  partId: string
  label: string
  x: number
  y: number
  w: number
  h: number
  colorIndex: number
}

export const PART_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
]

// Singleton state — shared across components
const sheet = ref({ width: 1000, height: 2000 })
const parts = ref<GlassPart[]>([])
const editTarget = ref<GlassPart | null>(null)

export function useGlassStore() {
  // ── Sheet area ──────────────────────────────────────────────────
  const totalArea = computed(() => sheet.value.width * sheet.value.height)

  // ── Requested parts area (what user wants to cut) ───────────────
  const partsArea = computed(() =>
    parts.value.reduce((sum, p) => sum + p.width * p.height * p.quantity, 0)
  )

  // Diff between sheet and what's requested (can be negative = over-requested)
  const remainderArea = computed(() => totalArea.value - partsArea.value)

  const utilizationPct = computed(() =>
    totalArea.value > 0
      ? Math.min(Math.round((partsArea.value / totalArea.value) * 100), 999)
      : 0
  )

  // ── Packing: row-based shelf algorithm ─────────────────────────
  // Iterates all piece instances left→right, top→bottom.
  // Starts a new row when a piece doesn't fit horizontally.
  const placedPieces = computed<PlacedPiece[]>(() => {
    const result: PlacedPiece[] = []
    let x = 0
    let y = 0
    let rowH = 0
    const sw = sheet.value.width
    const sh = sheet.value.height

    parts.value.forEach((part, colorIndex) => {
      for (let i = 0; i < part.quantity; i++) {
        // Physically doesn't fit — skip
        if (part.width > sw || part.height > sh) continue

        // Doesn't fit in current row → start new row
        if (x + part.width > sw) {
          x = 0
          y += rowH
          rowH = 0
        }

        // No vertical space left
        if (y + part.height > sh) continue

        result.push({
          partId: part.id,
          label: part.label || `${part.width}×${part.height}`,
          x,
          y,
          w: part.width,
          h: part.height,
          colorIndex: colorIndex % PART_COLORS.length,
        })

        x += part.width
        rowH = Math.max(rowH, part.height)
      }
    })

    return result
  })

  // ── Placement statistics ────────────────────────────────────────

  /** How many pieces of each part were actually placed { partId → count } */
  const partPlacedCounts = computed((): Record<string, number> => {
    const counts: Record<string, number> = {}
    for (const piece of placedPieces.value) {
      counts[piece.partId] = (counts[piece.partId] ?? 0) + 1
    }
    return counts
  })

  /** Total pieces requested across all parts */
  const totalRequested = computed(() =>
    parts.value.reduce((s, p) => s + p.quantity, 0)
  )

  /** Total pieces actually placed on the sheet */
  const totalPlaced = computed(() => placedPieces.value.length)

  /** Pieces that couldn't be placed (due to size or no space) */
  const totalUnplaced = computed(() => totalRequested.value - totalPlaced.value)

  /** Area of pieces that were actually placed (≤ partsArea) */
  const placedArea = computed(() =>
    placedPieces.value.reduce((s, p) => s + p.w * p.h, 0)
  )

  /** Actual empty glass area remaining on the sheet */
  const sheetRemainder = computed(() => totalArea.value - placedArea.value)

  /** % of sheet covered by placed pieces */
  const placedPct = computed(() =>
    totalArea.value > 0
      ? Math.round((placedArea.value / totalArea.value) * 100)
      : 0
  )

  /** Part IDs that are physically too large to ever fit the sheet */
  const oversizedPartIds = computed(() =>
    new Set(
      parts.value
        .filter(p => p.width > sheet.value.width || p.height > sheet.value.height)
        .map(p => p.id)
    )
  )

  // ── Helpers ─────────────────────────────────────────────────────

  /**
   * Returns true if a part that doesn't fit in its current orientation
   * would fit if rotated 90°.
   */
  function canFitRotated(part: GlassPart): boolean {
    const { width: sw, height: sh } = sheet.value
    const fits = (w: number, h: number) => w <= sw && h <= sh
    return !fits(part.width, part.height) && fits(part.height, part.width)
  }

  function addPart(data: Omit<GlassPart, 'id'>) {
    parts.value.push({ ...data, id: Date.now().toString() })
  }

  function updatePart(id: string, data: Omit<GlassPart, 'id'>) {
    const idx = parts.value.findIndex(p => p.id === id)
    if (idx !== -1) parts.value[idx] = { ...data, id }
  }

  function deletePart(id: string) {
    parts.value = parts.value.filter(p => p.id !== id)
    if (editTarget.value?.id === id) editTarget.value = null
  }

  function partColorIndex(id: string): number {
    return parts.value.findIndex(p => p.id === id) % PART_COLORS.length
  }

  return {
    // state
    sheet,
    parts,
    editTarget,
    // area
    totalArea,
    partsArea,
    remainderArea,
    placedArea,
    sheetRemainder,
    // pct
    utilizationPct,
    placedPct,
    // pieces
    totalRequested,
    totalPlaced,
    totalUnplaced,
    // packing
    placedPieces,
    partPlacedCounts,
    oversizedPartIds,
    // helpers
    canFitRotated,
    addPart,
    updatePart,
    deletePart,
    partColorIndex,
  }
}
