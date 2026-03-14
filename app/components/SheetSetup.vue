<template>
  <div class="card">
    <p class="card-title">Размер листа (мм)</p>
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
import { useGlassStore } from '~/composables/useGlassStore'

const { sheet } = useGlassStore()

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
