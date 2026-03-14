<template>
  <div class="card" ref="cardRef">
    <p class="card-title">
      {{ editTarget ? 'Редактировать деталь' : 'Добавить деталь' }}
    </p>

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

    <!-- Width + Height -->
    <div class="two-col">
      <div class="field">
        <label class="field-label" for="part-w">Ширина (мм)</label>
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
        <label class="field-label" for="part-h">Высота (мм)</label>
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

    <!-- Quantity stepper -->
    <div class="field">
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
import { useGlassStore } from '~/composables/useGlassStore'

const { sheet, editTarget, addPart, updatePart } = useGlassStore()

const cardRef = ref<HTMLElement | null>(null)
const error = ref('')

const form = reactive({
  label: '',
  width: null as number | null,
  height: null as number | null,
  quantity: 1,
})

// Populate form when another component sets editTarget
watch(editTarget, (target) => {
  if (target) {
    form.label = target.label
    form.width = target.width
    form.height = target.height
    form.quantity = target.quantity
    error.value = ''
    // Scroll form into view smoothly
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

  const sw = sheet.value.width
  const sh = sheet.value.height

  if (w > sw || h > sh) {
    // Check if rotating helps
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
