<template>
  <div class="card">
    <p class="card-title">Размер исходного листа (мм)</p>

    <!-- Presets -->
    <div class="presets">
      <button
        v-for="p in SHEET_PRESETS"
        :key="p.label"
        type="button"
        class="preset-chip"
        :class="{ active: sheet.width === p.w && sheet.height === p.h }"
        @click="applyPreset(p.w, p.h); localW = p.w; localH = p.h"
      >{{ p.label }}</button>
    </div>

    <div class="row">
      <div class="field">
        <label class="field-label" for="sheet-w">Ширина</label>
        <input
          id="sheet-w"
          v-model.number="localW"
          class="input"
          type="number"
          inputmode="numeric"
          min="1"
          placeholder="1000"
          @blur="apply"
          @keyup.enter="apply"
        />
      </div>

      <div class="sep">×</div>

      <div class="field">
        <label class="field-label" for="sheet-h">Высота</label>
        <input
          id="sheet-h"
          v-model.number="localH"
          class="input"
          type="number"
          inputmode="numeric"
          min="1"
          placeholder="2000"
          @blur="apply"
          @keyup.enter="apply"
        />
      </div>
    </div>

    <p v-if="error" class="error-msg">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useGlassStore, SHEET_PRESETS } from '~/composables/useGlassStore'

const { sheet, applyPreset } = useGlassStore()

const localW = ref(sheet.value.width)
const localH = ref(sheet.value.height)
const error = ref('')

function apply() {
  const w = Number(localW.value)
  const h = Number(localH.value)

  if (!w || w <= 0 || !h || h <= 0) {
    error.value = 'Введите положительные числа'
    return
  }

  error.value = ''
  sheet.value = { width: w, height: h }
}
</script>

<style scoped>
.presets {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.preset-chip {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
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

.row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}

.field {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.sep {
  font-size: 22px;
  color: #CBD5E1;
  padding-bottom: 10px;
  flex-shrink: 0;
}
</style>
