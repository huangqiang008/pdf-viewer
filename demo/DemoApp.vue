<template>
  <main class="demo">
    <section class="demo__panel" aria-label="PDF 预览配置">
      <div class="demo__brand">
        <div>
          <h1>PDF 预览组件 Demo</h1>
          <p>上传本地 PDF 或使用内置示例，测试移动端、虚拟滚动、缓存、水印和工具栏显隐。</p>
        </div>
        <span class="demo__status">{{ pageCount ? `${pageCount} 页` : '待加载' }}</span>
      </div>

      <div class="demo__controls">
        <label class="demo__field demo__field--file">
          <span>选择 PDF</span>
          <input type="file" accept="application/pdf" @change="handleFileChange" />
        </label>

        <label class="demo__field">
          <span>语言</span>
          <select v-model="lang">
            <option value="zh-CN">中文</option>
            <option value="en-US">English</option>
          </select>
        </label>

        <label class="demo__field">
          <span>主题</span>
          <select v-model="theme">
            <option value="light">白天</option>
            <option value="dark">黑夜</option>
          </select>
        </label>

        <label class="demo__field">
          <span>水印文字</span>
          <input v-model="watermarkText" type="text" />
        </label>

        <label class="demo__check">
          <input v-model="allowDownload" type="checkbox" />
          <span>允许下载</span>
        </label>

        <label class="demo__check">
          <input v-model="allowPrint" type="checkbox" />
          <span>允许打印</span>
        </label>
      </div>

      <div class="demo__toggles" aria-label="菜单显隐">
        <label v-for="item in menuItems" :key="item.key" class="demo__check">
          <input v-model="menuVisibility[item.key]" type="checkbox" />
          <span>{{ item.label }}</span>
        </label>
      </div>
    </section>

    <PdfPreview
      class="demo__viewer"
      :src="pdfSource"
      :pdfjs="pdfjsLib"
      :lang="lang"
      :theme="theme"
      :allow-download="allowDownload"
      :allow-print="allowPrint"
      :download-name="downloadName"
      :watermark="{ enabled: true, text: watermarkText, opacity: 0.13 }"
      :menu-visibility="menuVisibility"
      :cache-size="10"
      :buffer="2"
      @loaded="pageCount = $event"
      @error="error = String($event)"
      @theme-change="theme = $event"
    />

    <p v-if="error" class="demo__error">{{ error }}</p>
  </main>
</template>

<script setup>
import { onBeforeUnmount, reactive, ref } from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
import PdfPreview from '../src/components/PdfPreview.vue'

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

const lang = ref('zh-CN')
const theme = ref('light')
const pdfSource = ref('/sample.pdf')
const objectUrl = ref('')
const downloadName = ref('sample.pdf')
const allowDownload = ref(false)
const allowPrint = ref(false)
const watermarkText = ref('内部资料')
const pageCount = ref(0)
const error = ref('')

const menuVisibility = reactive({
  toolbar: true,
  thumbnails: true,
  previous: true,
  next: true,
  pageInput: true,
  zoom: true,
  language: true,
  watermarkToggle: true,
  download: true,
  print: true,
  fullscreen: true,
  theme: true,
  mobileBar: true
})

const menuItems = [
  { key: 'toolbar', label: '工具栏' },
  { key: 'thumbnails', label: '缩略图' },
  { key: 'pageInput', label: '页码输入' },
  { key: 'zoom', label: '缩放' },
  { key: 'language', label: '语言切换' },
  { key: 'watermarkToggle', label: '水印按钮' },
  { key: 'download', label: '下载按钮' },
  { key: 'print', label: '打印按钮' },
  { key: 'fullscreen', label: '全屏按钮' },
  { key: 'theme', label: '主题按钮' },
  { key: 'mobileBar', label: '移动底栏' }
]

function handleFileChange(event) {
  const input = event.target
  const file = input.files?.[0]
  if (!file) return
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value)
  objectUrl.value = URL.createObjectURL(file)
  pdfSource.value = objectUrl.value
  downloadName.value = file.name
  pageCount.value = 0
  error.value = ''
}

onBeforeUnmount(() => {
  if (objectUrl.value) URL.revokeObjectURL(objectUrl.value)
})
</script>
