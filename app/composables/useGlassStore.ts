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
  const totalArea = computed(() => sheet.value.width * sheet.value.height)

  const partsArea = computed(() =>
    parts.value.reduce((sum, p) => sum + p.width * p.height * p.quantity, 0)
  )

  const remainderArea = computed(() => totalArea.value - partsArea.value)

  const utilizationPct = computed(() =>
    totalArea.value > 0
      ? Math.min(Math.round((partsArea.value / totalArea.value) * 100), 999)
      : 0
  )

  /**
   * Row-based shelf packing.
   * Iterates all piece instances left→right, top→bottom.
   * Starts new row when piece doesn't fit horizontally.
   */
  const placedPieces = computed<PlacedPiece[]>(() => {
    const result: PlacedPiece[] = []
    let x = 0
    let y = 0
    let rowH = 0
    const sw = sheet.value.width
    const sh = sheet.value.height

    parts.value.forEach((part, colorIndex) => {
      for (let i = 0; i < part.quantity; i++) {
        // Part too big to fit sheet even alone — skip
        if (part.width > sw || part.height > sh) continue

        // Doesn't fit in current row → start new row
        if (x + part.width > sw) {
          x = 0
          y += rowH
          rowH = 0
        }

        // No vertical space left — stop placing this part
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
    sheet,
    parts,
    editTarget,
    totalArea,
    partsArea,
    remainderArea,
    utilizationPct,
    placedPieces,
    addPart,
    updatePart,
    deletePart,
    partColorIndex,
  }
}
