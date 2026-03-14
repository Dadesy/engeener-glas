<template>
  <div class="card">
    <p class="card-title">Список деталей</p>

    <div v-if="parts.length === 0" class="empty-list">
      Ещё нет деталей — добавьте первую выше
    </div>

    <ul v-else class="list">
      <li
        v-for="(part, idx) in parts"
        :key="part.id"
        class="item"
        :class="{ editing: editTarget?.id === part.id }"
      >
        <!-- Color dot -->
        <span
          class="dot"
          :style="{ background: PART_COLORS[idx % PART_COLORS.length] }"
        />

        <!-- Info -->
        <div class="info">
          <div class="name-row">
            <span class="name">{{ part.label || `Деталь ${idx + 1}` }}</span>
            <!-- Placement badge -->
            <span class="badge" :class="badgeClass(part)">
              {{ badgeText(part) }}
            </span>
          </div>

          <span class="dims">
            {{ part.width }} × {{ part.height }} мм
            <span class="qty-badge">× {{ part.quantity }}</span>
          </span>

          <!-- Placement detail row -->
          <div class="placement-row">
            <span class="placement-text" :class="placementClass(part)">
              {{ placementDetail(part) }}
            </span>
            <span class="area-text">{{ fmt(part.width * part.height) }} мм² × {{ part.quantity }}</span>
          </div>

          <!-- Rotation hint -->
          <span v-if="oversizedPartIds.has(part.id) && canFitRotated(part)" class="rotate-hint">
            💡 Повернуть на 90°: {{ part.height }}×{{ part.width }} мм
          </span>
        </div>

        <!-- Actions -->
        <div class="actions">
          <button
            class="action-btn edit-btn"
            type="button"
            :aria-label="`Редактировать ${part.label || 'деталь'}`"
            @click="startEdit(part)"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" width="18" height="18">
              <path d="M13.5 3.5l3 3L7 16H4v-3L13.5 3.5z" stroke-linejoin="round" />
            </svg>
          </button>
          <button
            class="action-btn del-btn"
            type="button"
            :aria-label="`Удалить ${part.label || 'деталь'}`"
            @click="confirmDelete(part.id)"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" width="18" height="18">
              <polyline points="3 5 17 5" stroke-linecap="round" />
              <path d="M6 5V4a1 1 0 011-1h6a1 1 0 011 1v1M8 10v5M12 10v5" stroke-linecap="round" />
              <path d="M4 5l1 12a1 1 0 001 1h8a1 1 0 001-1L16 5" stroke-linejoin="round" />
            </svg>
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useGlassStore, PART_COLORS } from '~/composables/useGlassStore'
import type { GlassPart } from '~/composables/useGlassStore'

const { parts, editTarget, deletePart, partPlacedCounts, oversizedPartIds, canFitRotated } = useGlassStore()

function startEdit(part: GlassPart) {
  editTarget.value = part
}

function confirmDelete(id: string) {
  if (confirm('Удалить эту деталь?')) deletePart(id)
}

function fmt(n: number): string {
  return n.toLocaleString('ru-RU')
}

function placedCount(part: GlassPart): number {
  return partPlacedCounts.value[part.id] ?? 0
}

// Badge top-right: "5/8", "✓ 3/3", "Не влезает"
function badgeText(part: GlassPart): string {
  if (oversizedPartIds.value.has(part.id)) return 'Не влезает'
  const placed = placedCount(part)
  if (placed === part.quantity) return `✓ ${placed}`
  return `${placed} / ${part.quantity}`
}

function badgeClass(part: GlassPart): string {
  if (oversizedPartIds.value.has(part.id)) return 'badge-error'
  const placed = placedCount(part)
  if (placed === 0) return 'badge-error'
  if (placed < part.quantity) return 'badge-warn'
  return 'badge-ok'
}

// Detailed placement line
function placementDetail(part: GlassPart): string {
  if (oversizedPartIds.value.has(part.id)) {
    return `Деталь больше листа (${part.width}×${part.height} > ${useGlassStore().sheet.value.width}×${useGlassStore().sheet.value.height})`
  }
  const placed = placedCount(part)
  const missing = part.quantity - placed
  if (placed === part.quantity) return `Все ${placed} шт. размещены`
  if (placed === 0) return `Нет места — 0 из ${part.quantity} шт.`
  return `Размещено ${placed} из ${part.quantity} шт., не влезло ${missing}`
}

function placementClass(part: GlassPart): string {
  if (oversizedPartIds.value.has(part.id)) return 'text-error'
  const placed = placedCount(part)
  if (placed === 0) return 'text-error'
  if (placed < part.quantity) return 'text-warn'
  return 'text-ok'
}
</script>

<style scoped>
.empty-list {
  text-align: center;
  color: #CBD5E1;
  font-size: 14px;
  padding: 20px 0;
}

.list {
  list-style: none;
  display: flex;
  flex-direction: column;
}

.item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 4px;
  border-bottom: 1px solid #F1F5F9;
  transition: background 0.15s;
  border-radius: 8px;
}

.item:last-child { border-bottom: none; }

.item.editing { background: #EFF6FF; }

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 5px;
}

.info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.name {
  font-size: 15px;
  font-weight: 600;
  color: #1E293B;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Badges ──────────────────────────────────────────── */
.badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 99px;
  white-space: nowrap;
  flex-shrink: 0;
}

.badge-ok   { background: #D1FAE5; color: #065F46; }
.badge-warn { background: #FEF3C7; color: #92400E; }
.badge-error { background: #FEE2E2; color: #991B1B; }

/* ── Dims row ─────────────────────────────────────────── */
.dims {
  font-size: 13px;
  color: #64748B;
}

.qty-badge {
  display: inline-block;
  background: #E2E8F0;
  color: #475569;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 99px;
  margin-left: 4px;
}

/* ── Placement detail ─────────────────────────────────── */
.placement-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.placement-text {
  font-size: 12px;
  font-weight: 500;
}

.text-ok    { color: #10B981; }
.text-warn  { color: #D97706; }
.text-error { color: #DC2626; }

.area-text {
  font-size: 11px;
  color: #CBD5E1;
  margin-left: auto;
}

/* ── Rotation hint ─────────────────────────────────────── */
.rotate-hint {
  font-size: 12px;
  color: #7C3AED;
  background: #EDE9FE;
  padding: 4px 8px;
  border-radius: 6px;
  margin-top: 2px;
}

/* ── Action buttons ───────────────────────────────────── */
.actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  margin-top: 2px;
}

.action-btn {
  height: 40px;
  width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: background 0.15s;
}

.edit-btn { background: #EFF6FF; color: #2563EB; }
.edit-btn:active { background: #DBEAFE; }

.del-btn { background: #FEF2F2; color: #EF4444; }
.del-btn:active { background: #FEE2E2; }
</style>
