<template>
  <div class="card">
    <button class="card-header" type="button" @click="open = !open">
      <p class="card-title" style="margin-bottom: 0;">Таблица кроя</p>
      <span class="header-meta">
        <span v-if="allPlacedPieces.length > 0" class="count-badge">{{ allPlacedPieces.length }} шт.</span>
        <span v-if="sheetsCount > 1" class="sheets-badge">{{ sheetsCount }} листа</span>
        <span class="chevron" :class="{ rotated: open }">▾</span>
      </span>
    </button>

    <template v-if="open">
      <div v-if="allPlacedPieces.length === 0" class="empty">
        Нет размещённых деталей
      </div>

      <template v-else>
        <!-- Multi-sheet: grouped by sheet -->
        <template v-if="sheetsCount > 1">
          <div v-for="(sheetGroup, si) in sheetGroups" :key="si" class="sheet-group">
            <div class="sheet-group-header">Лист {{ si + 1 }} — {{ sheetGroup.length }} шт.</div>
            <div class="table-wrap">
              <table class="table">
                <thead><tr><th>#</th><th>Название</th><th>Ш × В, мм</th><th>X, мм</th><th>Y, мм</th><th>↻</th></tr></thead>
                <tbody>
                  <tr v-for="(piece, idx) in sheetGroup" :key="piece.instanceId">
                    <td class="td-num">{{ idx + 1 }}</td>
                    <td><span class="dot" :style="{ background: PART_COLORS[piece.colorIndex] }" />{{ piece.label || 'Деталь' }}</td>
                    <td class="td-dims">{{ piece.w }}&thinsp;×&thinsp;{{ piece.h }}</td>
                    <td class="td-coord">{{ piece.x }}</td>
                    <td class="td-coord">{{ piece.y }}</td>
                    <td class="td-rot">{{ piece.rotated ? '↻' : '—' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>

        <!-- Single sheet: flat table -->
        <div v-else class="table-wrap">
          <table class="table">
            <thead><tr><th>#</th><th>Название</th><th>Ш × В, мм</th><th>X, мм</th><th>Y, мм</th><th>↻</th></tr></thead>
            <tbody>
              <tr v-for="(piece, idx) in allPlacedPieces" :key="piece.instanceId">
                <td class="td-num">{{ idx + 1 }}</td>
                <td><span class="dot" :style="{ background: PART_COLORS[piece.colorIndex] }" />{{ piece.label || 'Деталь' }}</td>
                <td class="td-dims">{{ piece.w }}&thinsp;×&thinsp;{{ piece.h }}</td>
                <td class="td-coord">{{ piece.x }}</td>
                <td class="td-coord">{{ piece.y }}</td>
                <td class="td-rot">{{ piece.rotated ? '↻' : '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <button class="copy-btn" type="button" @click="copyToClipboard">
          {{ copied ? '✓ Скопировано' : '📋 Копировать список' }}
        </button>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useGlassStore, PART_COLORS } from '~/composables/useGlassStore'

const { allPlacedPieces, sheetsCount } = useGlassStore()

const open = ref(false)
const copied = ref(false)

// Group pieces by sheetIndex
const sheetGroups = computed(() => {
  const groups: (typeof allPlacedPieces.value)[] = []
  for (const piece of allPlacedPieces.value) {
    const si = piece.sheetIndex ?? 0
    if (!groups[si]) groups[si] = []
    groups[si].push(piece)
  }
  return groups
})

function copyToClipboard() {
  const lines: string[] = []
  if (sheetsCount.value > 1) {
    sheetGroups.value.forEach((group, si) => {
      lines.push(`=== Лист ${si + 1} ===`)
      lines.push('#\tНазвание\tШирина\tВысота\tX\tY\tПовёрнута')
      group.forEach((p, i) => lines.push(`${i + 1}\t${p.label}\t${p.w}\t${p.h}\t${p.x}\t${p.y}\t${p.rotated ? 'да' : 'нет'}`))
    })
  } else {
    lines.push('#\tНазвание\tШирина\tВысота\tX\tY\tПовёрнута')
    allPlacedPieces.value.forEach((p, i) =>
      lines.push(`${i + 1}\t${p.label}\t${p.w}\t${p.h}\t${p.x}\t${p.y}\t${p.rotated ? 'да' : 'нет'}`),
    )
  }
  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  })
}
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  text-align: left;
}

.header-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.count-badge {
  font-size: 11px;
  font-weight: 700;
  background: #EFF6FF;
  color: #2563EB;
  padding: 2px 8px;
  border-radius: 99px;
}

.sheets-badge {
  font-size: 11px;
  font-weight: 700;
  background: #F0FDF4;
  color: #065F46;
  padding: 2px 8px;
  border-radius: 99px;
}

.chevron {
  font-size: 18px;
  color: #94A3B8;
  transition: transform 0.2s;
}

.chevron.rotated { transform: rotate(180deg); }

/* Sheet groups */
.sheet-group { margin-top: 14px; }

.sheet-group:first-child { margin-top: 12px; }

.sheet-group-header {
  font-size: 12px;
  font-weight: 700;
  color: #2563EB;
  background: #EFF6FF;
  padding: 5px 10px;
  border-radius: 8px;
  margin-bottom: 6px;
}

/* Table */
.table-wrap {
  overflow-x: auto;
  border-radius: 10px;
  border: 1px solid #F1F5F9;
  margin-top: 12px;
}

.sheet-group .table-wrap { margin-top: 0; }

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.table thead tr { background: #F8FAFC; }

.table th {
  padding: 8px 10px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
  border-bottom: 1px solid #F1F5F9;
}

.table td {
  padding: 8px 10px;
  color: #334155;
  border-bottom: 1px solid #F8FAFC;
  white-space: nowrap;
}

.table tbody tr:last-child td { border-bottom: none; }
.table tbody tr:hover { background: #F8FAFC; }

.td-num { color: #94A3B8; font-size: 11px; }
.td-dims { font-weight: 600; color: #1E293B; font-variant-numeric: tabular-nums; }
.td-coord { font-variant-numeric: tabular-nums; color: #475569; }
.td-rot { text-align: center; }

.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 5px;
  vertical-align: middle;
}

.copy-btn {
  margin-top: 10px;
  width: 100%;
  padding: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #2563EB;
  background: #EFF6FF;
  border: 1.5px solid #BFDBFE;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
}

.copy-btn:active { background: #DBEAFE; }

.empty {
  margin-top: 12px;
  text-align: center;
  color: #CBD5E1;
  font-size: 13px;
  padding: 12px 0;
}
</style>
