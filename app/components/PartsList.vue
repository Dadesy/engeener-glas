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
          <span class="name">{{ part.label || `Деталь ${idx + 1}` }}</span>
          <span class="dims">
            {{ part.width }} × {{ part.height }} мм
            <span class="qty-badge">× {{ part.quantity }}</span>
          </span>
          <span class="area">{{ fmt(part.width * part.height * part.quantity) }} мм²</span>
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

const { parts, editTarget, deletePart } = useGlassStore()

function startEdit(part: GlassPart) {
  editTarget.value = part
}

function confirmDelete(id: string) {
  // On mobile a native confirm is acceptable for MVP
  if (confirm('Удалить эту деталь?')) {
    deletePart(id)
  }
}

function fmt(n: number): string {
  return n.toLocaleString('ru-RU')
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
  gap: 2px;
}

.item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 4px;
  border-bottom: 1px solid #F1F5F9;
  transition: background 0.15s;
  border-radius: 8px;
}

.item:last-child {
  border-bottom: none;
}

.item.editing {
  background: #EFF6FF;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.name {
  font-size: 15px;
  font-weight: 600;
  color: #1E293B;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

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

.area {
  font-size: 12px;
  color: #94A3B8;
}

.actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
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

.edit-btn {
  background: #EFF6FF;
  color: #2563EB;
}

.edit-btn:active {
  background: #DBEAFE;
}

.del-btn {
  background: #FEF2F2;
  color: #EF4444;
}

.del-btn:active {
  background: #FEE2E2;
}
</style>
