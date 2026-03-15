<template>
  <div class="card" ref="cardRef">
    <p class="card-title">
      {{ editTarget ? 'Редактировать деталь' : 'Добавить деталь для раскроя' }}
    </p>

    <!-- Shape type toggle -->
    <div class="shape-toggle">
      <button
        type="button"
        class="shape-btn"
        :class="{ active: shapeType === 'rectangle' }"
        @click="setShapeType('rectangle')"
      >⬜ Прямоугольник</button>
      <button
        type="button"
        class="shape-btn"
        :class="{ active: shapeType === 'polygon' }"
        @click="setShapeType('polygon')"
      >⬟ Фигура</button>
    </div>

    <!-- Polygon: preset chips -->
    <template v-if="shapeType === 'polygon'">
      <div class="presets-label">Быстрые шаблоны</div>
      <div class="shape-presets">
        <button
          v-for="preset in SHAPE_PRESETS"
          :key="preset.label"
          type="button"
          class="preset-chip"
          :class="{ active: isActivePreset(preset.points) }"
          @click="applyShapePreset(preset.points)"
        >
          <span class="preset-icon">{{ preset.icon }}</span>
          {{ preset.label }}
        </button>
      </div>
    </template>

    <!-- Label -->
    <div class="field">
      <label class="field-label" for="part-label">Название (необязательно)</label>
      <input
        id="part-label"
        v-model="form.label"
        class="input"
        type="text"
        placeholder="Например: Боковая стенка"
        autocomplete="off"
      />
    </div>

    <!-- Width + Height (bounding box) -->
    <div class="two-col">
      <div class="field">
        <label class="field-label" for="part-w">
          {{ shapeType === 'polygon' ? 'Ширина габарита (мм)' : 'Ширина (мм)' }}
        </label>
        <input
          id="part-w"
          v-model.number="form.width"
          class="input"
          type="number"
          inputmode="numeric"
          min="1"
          placeholder="300"
        />
      </div>
      <div class="field">
        <label class="field-label" for="part-h">
          {{ shapeType === 'polygon' ? 'Высота габарита (мм)' : 'Высота (мм)' }}
        </label>
        <input
          id="part-h"
          v-model.number="form.height"
          class="input"
          type="number"
          inputmode="numeric"
          min="1"
          placeholder="400"
        />
      </div>
    </div>

    <!-- Polygon editor -->
    <template v-if="shapeType === 'polygon'">
      <ShapeEditor
        :points="form.points"
        @update:points="form.points = $event"
      />
      <p class="field-hint">
        Нарисуйте контур фигуры. Ширина и высота задают масштаб.
      </p>
    </template>

    <!-- Quantity stepper -->
    <div class="field" style="margin-top: 12px;">
      <label class="field-label">Количество</label>
      <div class="qty-row">
        <button class="qty-btn" type="button" @click="dec" aria-label="Уменьшить">
          <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
            <rect x="4" y="9" width="12" height="2" rx="1" />
          </svg>
        </button>
        <input
          v-model.number="form.quantity"
          class="input qty-input"
          type="number"
          inputmode="numeric"
          min="1"
        />
        <button class="qty-btn" type="button" @click="inc" aria-label="Увеличить">
          <svg viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
            <rect x="4" y="9" width="12" height="2" rx="1" />
            <rect x="9" y="4" width="2" height="12" rx="1" />
          </svg>
        </button>
      </div>
    </div>

    <p v-if="error" class="error-msg">{{ error }}</p>

    <div class="actions">
      <button v-if="editTarget" class="btn btn-ghost" type="button" @click="cancel" style="flex: 0 0 auto; padding: 0 20px;">
        Отмена
      </button>
      <button class="btn btn-primary" type="button" @click="submit">
        {{ editTarget ? 'Сохранить' : '+ Добавить деталь' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, nextTick } from 'vue'
import { useGlassStore, SHAPE_PRESETS } from '~/composables/useGlassStore'

const { sheet, editTarget, addPart, updatePart } = useGlassStore()

const cardRef = ref<HTMLElement | null>(null)
const error = ref('')
const shapeType = ref<'rectangle' | 'polygon'>('rectangle')

const form = reactive({
  label: '',
  width: null as number | null,
  height: null as number | null,
  quantity: 1,
  points: [] as { x: number; y: number }[],
})

function setShapeType(type: 'rectangle' | 'polygon') {
  shapeType.value = type
  if (type === 'rectangle') form.points = []
  error.value = ''
}

function applyShapePreset(pts: { x: number; y: number }[]) {
  form.points = pts.map(p => ({ ...p }))
}

function isActivePreset(pts: { x: number; y: number }[]): boolean {
  if (form.points.length !== pts.length) return false
  return pts.every((p, i) => form.points[i]?.x === p.x && form.points[i]?.y === p.y)
}

// Populate form when another component sets editTarget
watch(editTarget, (target) => {
  if (target) {
    form.label = target.label
    form.width = target.width
    form.height = target.height
    form.quantity = target.quantity
    if (target.points && target.points.length > 0) {
      shapeType.value = 'polygon'
      form.points = target.points.map(p => ({ ...p }))
    } else {
      shapeType.value = 'rectangle'
      form.points = []
    }
    error.value = ''
    nextTick(() => cardRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  } else {
    resetForm()
  }
})

function resetForm() {
  form.label = ''
  form.width = null
  form.height = null
  form.quantity = 1
  form.points = []
  shapeType.value = 'rectangle'
  error.value = ''
}

function validate(): boolean {
  const w = Number(form.width)
  const h = Number(form.height)
  const q = Number(form.quantity)

  if (!w || w <= 0 || !h || h <= 0) {
    error.value = 'Укажите положительные значения ширины и высоты'
    return false
  }
  if (!q || q < 1 || !Number.isInteger(q)) {
    error.value = 'Количество — целое число ≥ 1'
    return false
  }

  if (shapeType.value === 'polygon' && form.points.length < 3) {
    error.value = 'Нарисуйте фигуру — нужно не менее 3 вершин'
    return false
  }

  const sw = sheet.value.width
  const sh = sheet.value.height

  if (w > sw || h > sh) {
    const rotatedFits = h <= sw && w <= sh
    if (rotatedFits) {
      error.value = `Деталь ${w}×${h} не влезает, но повёрнутая ${h}×${w} — влезет. Поменяйте ширину и высоту местами.`
    } else {
      error.value = `Деталь ${w}×${h} мм не вписывается в лист ${sw}×${sh} мм`
    }
    return false
  }

  error.value = ''
  return true
}

function submit() {
  if (!validate()) return

  const data = {
    label: form.label.trim(),
    width: Number(form.width),
    height: Number(form.height),
    quantity: Number(form.quantity),
    points: shapeType.value === 'polygon' && form.points.length >= 3
      ? form.points.map(p => ({ ...p }))
      : undefined,
  }

  if (editTarget.value) {
    updatePart(editTarget.value.id, data)
    editTarget.value = null
  } else {
    addPart(data)
    resetForm()
  }
}

function cancel() {
  editTarget.value = null
}

function dec() {
  form.quantity = Math.max(1, (form.quantity ?? 1) - 1)
}

function inc() {
  form.quantity = (form.quantity ?? 0) + 1
}
</script>

<style scoped>
/* Shape type toggle */
.shape-toggle {
  display: flex;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 14px;
}

.shape-btn {
  flex: 1;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  background: #F8FAFC;
  color: #64748B;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.shape-btn:first-child {
  border-right: 1.5px solid #E2E8F0;
}

.shape-btn.active {
  background: #EFF6FF;
  color: #2563EB;
}

/* Shape presets */
.presets-label {
  font-size: 11px;
  font-weight: 700;
  color: #94A3B8;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  margin-bottom: 7px;
}

.shape-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 14px;
}

.preset-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 20px;
  border: 1.5px solid #E2E8F0;
  background: #F8FAFC;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.preset-chip:hover {
  border-color: #93C5FD;
  background: #EFF6FF;
  color: #2563EB;
}

.preset-chip.active {
  border-color: #2563EB;
  background: #EFF6FF;
  color: #2563EB;
}

.preset-icon {
  font-size: 13px;
}

/* Field hint */
.field-hint {
  font-size: 11px;
  color: #94A3B8;
  margin-top: 6px;
  margin-bottom: 4px;
  line-height: 1.4;
}

/* existing styles */
.field {
  margin-bottom: 12px;
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}

.two-col .field {
  margin-bottom: 0;
}

.qty-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.qty-btn {
  height: 48px;
  width: 48px;
  flex-shrink: 0;
  border: 1.5px solid #E2E8F0;
  border-radius: 10px;
  background: #F8FAFC;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
  transition: background 0.15s, border-color 0.15s;
}

.qty-btn:active {
  background: #E2E8F0;
}

.qty-input {
  flex: 1;
  text-align: center;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}
</style>
