<template>
  <section
    ref="rootRef"
    class="vpv"
    :class="{ 'vpv--mobile': isMobile, 'vpv--sidebar-open': sidebarOpen, 'vpv--sticky-toolbar': props.stickyToolbar, 'vpv--dark': currentTheme === 'dark' }"
    :style="cssVars"
    @contextmenu="blockContextMenu"
  >
    <header v-if="visible.toolbar" class="vpv__toolbar" role="toolbar" :aria-label="t.toolbar">
      <div v-if="!isMobile" class="vpv__toolbar-group">
        <button
          v-if="visible.thumbnails"
          class="vpv__icon-btn"
          type="button"
          :aria-label="t.toggleThumbnails"
          :title="t.toggleThumbnails"
          :aria-pressed="sidebarOpen"
          @click="sidebarOpen = !sidebarOpen"
          v-html="icons.sidebar"
        />
        <button
          v-if="visible.previous"
          class="vpv__icon-btn"
          type="button"
          :disabled="!canPrevious"
          :aria-label="t.previous"
          :title="t.previous"
          @click="goPrevious"
          v-html="icons.prev"
        />
        <button
          v-if="visible.next"
          class="vpv__icon-btn"
          type="button"
          :disabled="!canNext"
          :aria-label="t.next"
          :title="t.next"
          @click="goNext"
          v-html="icons.next"
        />
      </div>

      <form v-if="!isMobile && visible.pageInput" class="vpv__page-jump" @submit.prevent="commitPageInput">
        <label class="vpv__sr" :for="ids.page">{{ t.page }}</label>
        <input
          :id="ids.page"
          v-model="pageInput"
          class="vpv__input vpv__input--page"
          type="number"
          min="1"
          :max="pageCount || 1"
          inputmode="numeric"
          :aria-label="t.page"
          @blur="commitPageInput"
        />
        <span class="vpv__page-total">/ {{ pageCount || '-' }}</span>
      </form>

      <div v-if="!isMobile && visible.zoom" class="vpv__toolbar-group vpv__toolbar-group--zoom">
        <button
          class="vpv__icon-btn"
          type="button"
          :disabled="scale <= minScale"
          :aria-label="t.zoomOut"
          :title="t.zoomOut"
          @click="changeScale(scale - scaleStep)"
          v-html="icons.zoomOut"
        />
        <label class="vpv__sr" :for="ids.zoom">{{ t.zoom }}</label>
        <input
          :id="ids.zoom"
          v-model="zoomInput"
          class="vpv__input vpv__input--zoom"
          type="number"
          :min="Math.round(minScale * 100)"
          :max="Math.round(maxScale * 100)"
          inputmode="numeric"
          :aria-label="t.zoom"
          @blur="commitZoomInput"
          @keydown.enter.prevent="commitZoomInput"
        />
        <span class="vpv__unit">%</span>
        <button
          class="vpv__icon-btn"
          type="button"
          :disabled="scale >= maxScale"
          :aria-label="t.zoomIn"
          :title="t.zoomIn"
          @click="changeScale(scale + scaleStep)"
          v-html="icons.zoomIn"
        />
      </div>

      <form v-if="isMobile && visible.pageInput" class="vpv__mobile-page" @submit.prevent="commitPageInput">
        <label class="vpv__sr" :for="ids.mobilePage">{{ t.page }}</label>
        <input
          :id="ids.mobilePage"
          v-model="pageInput"
          class="vpv__input vpv__input--mobile-page"
          type="number"
          min="1"
          :max="pageCount || 1"
          inputmode="numeric"
          :aria-label="t.page"
          @blur="commitPageInput"
        />
        <span class="vpv__page-total">/ {{ pageCount || '-' }}</span>
      </form>

      <div class="vpv__toolbar-spacer" />

      <button
        v-if="isMobile"
        ref="moreButtonRef"
        class="vpv__icon-btn"
        type="button"
        :aria-label="t.more"
        :title="t.more"
        :aria-expanded="mobileMoreOpen"
        @click="mobileMoreOpen = !mobileMoreOpen"
        v-html="icons.more"
      />

      <div v-if="!isMobile" class="vpv__toolbar-group vpv__toolbar-group--actions">
        <select
          v-if="visible.language"
          v-model="currentLang"
          class="vpv__select"
          :aria-label="t.language"
        >
          <option value="zh-CN">中文</option>
          <option value="en-US">English</option>
        </select>
        <button
          v-if="visible.watermarkToggle"
          class="vpv__text-btn"
          type="button"
          :aria-pressed="watermarkEnabled"
          @click="watermarkEnabled = !watermarkEnabled"
        >
          {{ watermarkEnabled ? t.watermarkOn : t.watermarkOff }}
        </button>
        <button
          v-if="visible.print"
          class="vpv__icon-btn"
          type="button"
          :disabled="!props.allowPrint"
          :aria-label="t.print"
          :title="props.allowPrint ? t.print : t.printDisabled"
          @click="printPdf"
          v-html="icons.print"
        />
        <button
          v-if="visible.fullscreen"
          class="vpv__icon-btn"
          type="button"
          :disabled="!fullscreenSupported"
          :aria-label="isFullscreen ? t.exitFullscreen : t.fullscreen"
          :title="fullscreenSupported ? (isFullscreen ? t.exitFullscreen : t.fullscreen) : t.fullscreenDisabled"
          @click="toggleFullscreen"
          v-html="isFullscreen ? icons.exitFullscreen : icons.fullscreen"
        />
        <button
          v-if="visible.theme"
          class="vpv__icon-btn"
          type="button"
          :aria-label="currentTheme === 'dark' ? t.lightTheme : t.darkTheme"
          :title="currentTheme === 'dark' ? t.lightTheme : t.darkTheme"
          @click="toggleTheme"
          v-html="currentTheme === 'dark' ? icons.sun : icons.moon"
        />
        <a
          v-if="visible.download"
          class="vpv__icon-btn"
          :class="{ 'vpv__icon-btn--disabled': !props.allowDownload }"
          :href="downloadHref"
          :download="downloadName"
          :aria-label="t.download"
          :title="props.allowDownload ? t.download : t.downloadDisabled"
          @click="guardDownload"
          v-html="icons.download"
        />
      </div>

      <div v-if="isMobile && mobileMoreOpen" class="vpv__more-menu" role="dialog" :aria-label="t.more">
        <label v-if="visible.zoom" class="vpv__more-field">
          <span>{{ t.zoom }}</span>
          <span class="vpv__more-input">
            <input
              v-model="zoomInput"
              class="vpv__input vpv__input--zoom"
              type="number"
              :min="Math.round(minScale * 100)"
              :max="Math.round(maxScale * 100)"
              inputmode="numeric"
              :aria-label="t.zoom"
              @blur="commitZoomInput"
              @keydown.enter.prevent="commitZoomInput"
            />
            <span class="vpv__unit">%</span>
          </span>
        </label>
        <button
          v-if="visible.watermarkToggle"
          class="vpv__more-row"
          type="button"
          :aria-pressed="watermarkEnabled"
          @click="watermarkEnabled = !watermarkEnabled"
        >
          <span>{{ t.watermark }}</span>
          <strong>{{ watermarkEnabled ? t.on : t.off }}</strong>
        </button>
        <label v-if="visible.language" class="vpv__more-field">
          <span>{{ t.language }}</span>
          <select v-model="currentLang" class="vpv__select" :aria-label="t.language">
            <option value="zh-CN">中文</option>
            <option value="en-US">English</option>
          </select>
        </label>
        <button
          v-if="visible.print"
          class="vpv__more-row"
          type="button"
          :disabled="!props.allowPrint"
          @click="printPdf"
        >
          <span>{{ t.print }}</span>
          <strong>{{ props.allowPrint ? t.available : t.disabled }}</strong>
        </button>
        <button
          v-if="visible.fullscreen"
          class="vpv__more-row"
          type="button"
          :disabled="!fullscreenSupported"
          @click="toggleFullscreen"
        >
          <span>{{ isFullscreen ? t.exitFullscreen : t.fullscreen }}</span>
          <strong>{{ fullscreenSupported ? t.available : t.disabled }}</strong>
        </button>
        <button
          v-if="visible.theme"
          class="vpv__more-row"
          type="button"
          @click="toggleTheme"
        >
          <span>{{ t.theme }}</span>
          <strong>{{ currentTheme === 'dark' ? t.dark : t.light }}</strong>
        </button>
        <a
          v-if="visible.download"
          class="vpv__more-row"
          :class="{ 'vpv__more-row--disabled': !props.allowDownload }"
          :href="downloadHref"
          :download="downloadName"
          @click="guardDownload"
        >
          <span>{{ t.download }}</span>
          <strong>{{ props.allowDownload ? t.available : t.disabled }}</strong>
        </a>
      </div>
    </header>

    <div class="vpv__body">
      <aside ref="thumbScrollRef" v-if="visible.thumbnails && !isMobile" class="vpv__sidebar" :aria-label="t.thumbnails" @scroll.passive="onThumbScroll">
        <div class="vpv__thumbs" :style="{ height: `${thumbTotalHeight}px` }">
          <button
            v-for="page in thumbnailPages"
            :key="page"
            class="vpv__thumb"
            :class="{ 'vpv__thumb--active': page === currentPage }"
            :style="{ transform: `translateY(${(page - 1) * thumbItemHeight}px)` }"
            type="button"
            @click="goToPage(page)"
          >
            <canvas :ref="(el) => setThumbCanvas(el, page)" class="vpv__thumb-canvas" />
            <span class="vpv__thumb-label">{{ page }}</span>
          </button>
        </div>
      </aside>

      <main ref="scrollRef" class="vpv__viewport" @scroll.passive="onScroll">
        <div v-if="loading" class="vpv__state" role="status" aria-live="polite">
          <span class="vpv__spinner" />
          <span>{{ t.loading }}</span>
        </div>
        <div v-else-if="errorMessage" class="vpv__state vpv__state--error" role="alert">
          <span v-html="icons.warning" />
          <span>{{ errorMessage }}</span>
        </div>
        <div v-else-if="nativeFallback" class="vpv__native">
          <object class="vpv__native-object" :data="nativeObjectUrl" type="application/pdf">
            <iframe class="vpv__native-object" :src="nativeObjectUrl" :title="t.nativeFallback" />
          </object>
          <p class="vpv__native-note">{{ t.nativeFallback }}</p>
        </div>
        <div v-else class="vpv__pages" :style="pagesStyle">
          <article
            v-for="page in visiblePages"
            :key="page"
            class="vpv__page-shell"
            :style="pageShellStyle(page)"
            :data-page="page"
          >
            <div class="vpv__page">
              <canvas :ref="(el) => setPageCanvas(el, page)" class="vpv__canvas" />
              <div v-if="watermarkEnabled" class="vpv__watermark" aria-hidden="true">
                <span v-for="i in 9" :key="i">{{ watermarkText }}</span>
              </div>
            </div>
          </article>
        </div>
      </main>
    </div>

    <nav v-if="isMobile && visible.mobileBar" class="vpv__mobilebar" :aria-label="t.mobileControls">
      <button type="button" :disabled="!canPrevious" @click="goPrevious" v-html="icons.prev" />
      <button type="button" :disabled="!canNext" @click="goNext" v-html="icons.next" />
      <button type="button" :disabled="scale <= minScale" @click="changeScale(scale - scaleStep)" v-html="icons.zoomOut" />
      <button type="button" :disabled="scale >= maxScale" @click="changeScale(scale + scaleStep)" v-html="icons.zoomIn" />
    </nav>
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'

const props = defineProps({
  src: { type: [String, URL, Uint8Array, ArrayBuffer], default: null },
  pdfjs: { type: Object, default: null },
  lang: { type: String, default: 'zh-CN' },
  messages: { type: Object, default: () => ({}) },
  menuVisibility: { type: Object, default: () => ({}) },
  theme: { type: String, default: 'light' },
  stickyToolbar: { type: Boolean, default: true },
  allowDownload: { type: Boolean, default: false },
  allowPrint: { type: Boolean, default: false },
  downloadName: { type: String, default: 'document.pdf' },
  watermark: { type: [Boolean, Object], default: true },
  initialPage: { type: Number, default: 1 },
  initialScale: { type: Number, default: 1 },
  minScale: { type: Number, default: 0.5 },
  maxScale: { type: Number, default: 3 },
  scaleStep: { type: Number, default: 0.1 },
  pageGap: { type: Number, default: 16 },
  buffer: { type: Number, default: 2 },
  cacheSize: { type: Number, default: 8 },
  prerender: { type: Boolean, default: true },
  thumbnailWidth: { type: Number, default: 96 },
  mobileBreakpoint: { type: Number, default: 720 },
  disableContextMenu: { type: Boolean, default: true },
  useNativeFallback: { type: Boolean, default: true }
})

const emit = defineEmits(['loaded', 'error', 'page-change', 'scale-change', 'theme-change'])

const builtInMessages = {
  'zh-CN': {
    toolbar: 'PDF 工具栏',
    toggleThumbnails: '切换缩略图',
    previous: '上一页',
    next: '下一页',
    page: '页码',
    zoom: '缩放',
    zoomIn: '放大',
    zoomOut: '缩小',
    language: '语言',
    watermarkOn: '水印开',
    watermarkOff: '水印关',
    print: '打印',
    printDisabled: '已禁止打印',
    download: '下载',
    downloadDisabled: '已禁止下载',
    thumbnails: '缩略图',
    loading: '正在加载 PDF...',
    loadFailed: 'PDF 加载失败',
    nativeFallback: '当前未注入 PDF 渲染器，已使用浏览器原生预览。',
    mobileControls: '移动端控制栏',
    more: '更多',
    fullscreen: '全屏',
    exitFullscreen: '退出全屏',
    fullscreenDisabled: '浏览器不支持全屏',
    theme: '主题',
    lightTheme: '切换白天模式',
    darkTheme: '切换黑夜模式',
    light: '白天',
    dark: '黑夜',
    watermark: '水印',
    on: '开启',
    off: '关闭',
    available: '可用',
    disabled: '禁用'
  },
  'en-US': {
    toolbar: 'PDF toolbar',
    toggleThumbnails: 'Toggle thumbnails',
    previous: 'Previous page',
    next: 'Next page',
    page: 'Page',
    zoom: 'Zoom',
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    language: 'Language',
    watermarkOn: 'Watermark on',
    watermarkOff: 'Watermark off',
    print: 'Print',
    printDisabled: 'Print disabled',
    download: 'Download',
    downloadDisabled: 'Download disabled',
    thumbnails: 'Thumbnails',
    loading: 'Loading PDF...',
    loadFailed: 'Failed to load PDF',
    nativeFallback: 'No PDF renderer was injected. Browser native preview is being used.',
    mobileControls: 'Mobile controls',
    more: 'More',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit fullscreen',
    fullscreenDisabled: 'Fullscreen is not supported',
    theme: 'Theme',
    lightTheme: 'Switch to light mode',
    darkTheme: 'Switch to dark mode',
    light: 'Light',
    dark: 'Dark',
    watermark: 'Watermark',
    on: 'On',
    off: 'Off',
    available: 'Available',
    disabled: 'Disabled'
  }
}

const icons = {
  sidebar: svg('<path d="M4 5.5h16M4 12h16M4 18.5h16M7 5.5v13"/>'),
  prev: svg('<path d="M15 6l-6 6 6 6"/>'),
  next: svg('<path d="M9 6l6 6-6 6"/>'),
  zoomIn: svg('<circle cx="10.5" cy="10.5" r="5.5"/><path d="M10.5 8v5M8 10.5h5M15 15l4 4"/>'),
  zoomOut: svg('<circle cx="10.5" cy="10.5" r="5.5"/><path d="M8 10.5h5M15 15l4 4"/>'),
  print: svg('<path d="M7 8V4h10v4M7 17H5a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2M7 14h10v6H7z"/>'),
  download: svg('<path d="M12 4v10M8 10l4 4 4-4M5 20h14"/>'),
  warning: svg('<path d="M12 4l9 16H3L12 4z"/><path d="M12 9v5M12 17h.01"/>'),
  more: svg('<circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none"/>'),
  fullscreen: svg('<path d="M8 4H4v4M16 4h4v4M20 16v4h-4M4 16v4h4"/>'),
  exitFullscreen: svg('<path d="M9 4v5H4M15 4v5h5M20 15h-5v5M4 15h5v5"/>'),
  sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>'),
  moon: svg('<path d="M20 15.6A8.5 8.5 0 0 1 8.4 4a7 7 0 1 0 11.6 11.6z"/>')
}

const rootRef = ref(null)
const scrollRef = ref(null)
const thumbScrollRef = ref(null)
const moreButtonRef = ref(null)
const pdfDoc = shallowRef(null)
const pdfTask = shallowRef(null)
const loading = ref(false)
const errorMessage = ref('')
const nativeFallback = ref(false)
const mobileMoreOpen = ref(false)
const isFullscreen = ref(false)
const fullscreenSupported = ref(false)
const currentTheme = ref(normalizeTheme(props.theme))
const pageCount = ref(0)
const currentPage = ref(props.initialPage)
const currentLang = ref(props.lang)
const scale = ref(clamp(props.initialScale, props.minScale, props.maxScale))
const pageInput = ref(String(props.initialPage))
const zoomInput = ref(String(Math.round(scale.value * 100)))
const viewportWidth = ref(0)
const viewportHeight = ref(0)
const scrollTop = ref(0)
const thumbScrollTop = ref(0)
const thumbViewportHeight = ref(0)
const firstPageRatio = ref(1.414)
const pageCanvases = new Map()
const thumbCanvases = new Map()
const pageCache = new Map()
const renderTokens = new Map()
let resizeObserver = null
let loadSeq = 0
let thumbAutoScrollTimer = null
let isThumbUserScrolling = false

const visibleDefaults = {
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
}

const visible = computed(() => ({ ...visibleDefaults, ...props.menuVisibility }))
const isMobile = computed(() => viewportWidth.value > 0 && viewportWidth.value <= props.mobileBreakpoint)
const sidebarOpen = ref(!isMobile.value)
const minScale = computed(() => props.minScale)
const maxScale = computed(() => props.maxScale)
const scaleStep = computed(() => props.scaleStep)
const canPrevious = computed(() => currentPage.value > 1)
const canNext = computed(() => currentPage.value < pageCount.value)
const dpr = computed(() => {
  const ratio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
  return Math.max(1, Math.min(ratio, 3))
})
const pageWidth = computed(() => Math.max(240, Math.min(viewportWidth.value - (isMobile.value ? 24 : 48), 920) * scale.value))
const pageHeight = computed(() => pageWidth.value * firstPageRatio.value)
const itemHeight = computed(() => pageHeight.value + props.pageGap)
const totalHeight = computed(() => Math.max(0, pageCount.value * itemHeight.value))
const pageAreaWidth = computed(() => pageWidth.value + 24)
const pagesStyle = computed(() => ({
  height: `${totalHeight.value}px`,
  minWidth: `${pageAreaWidth.value}px`
}))
const visibleStart = computed(() => clamp(Math.floor(scrollTop.value / itemHeight.value) + 1 - props.buffer, 1, pageCount.value || 1))
const visibleEnd = computed(() => clamp(Math.ceil((scrollTop.value + viewportHeight.value) / itemHeight.value) + props.buffer, 1, pageCount.value || 1))
const visiblePages = computed(() => {
  const pages = []
  for (let page = visibleStart.value; page <= visibleEnd.value; page += 1) pages.push(page)
  return pages
})
const thumbItemHeight = computed(() => props.thumbnailWidth * firstPageRatio.value + 46)
const thumbTotalHeight = computed(() => pageCount.value * thumbItemHeight.value)
const thumbStart = computed(() => clamp(Math.floor(thumbScrollTop.value / thumbItemHeight.value) + 1 - 3, 1, pageCount.value || 1))
const thumbEnd = computed(() => clamp(Math.ceil((thumbScrollTop.value + thumbViewportHeight.value) / thumbItemHeight.value) + 3, 1, pageCount.value || 1))
const thumbnailPages = computed(() => {
  const pages = []
  for (let page = thumbStart.value; page <= thumbEnd.value; page += 1) pages.push(page)
  return pages
})
const t = computed(() => ({
  ...builtInMessages['zh-CN'],
  ...(builtInMessages[currentLang.value] || {}),
  ...stringMessages(props.messages[currentLang.value])
}))
const ids = {
  page: `vpv-page-${Math.random().toString(36).slice(2)}`,
  zoom: `vpv-zoom-${Math.random().toString(36).slice(2)}`,
  mobilePage: `vpv-mobile-page-${Math.random().toString(36).slice(2)}`
}
const nativeObjectUrl = computed(() => typeof props.src === 'string' ? props.src : '')
const downloadHref = computed(() => props.allowDownload && typeof props.src === 'string' ? props.src : undefined)
const downloadName = computed(() => props.downloadName)

const watermarkOptions = computed(() => {
  const raw = typeof props.watermark === 'object' ? props.watermark : {}
  return {
    enabled: typeof props.watermark === 'boolean' ? props.watermark : raw.enabled ?? true,
    text: raw.text || 'PDF Preview',
    opacity: raw.opacity ?? 0.14,
    rotate: raw.rotate ?? -28,
    fontSize: raw.fontSize ?? 16
  }
})
const watermarkEnabled = ref(watermarkOptions.value.enabled)
const watermarkText = computed(() => watermarkOptions.value.text)
const cssVars = computed(() => ({
  '--vpv-watermark-opacity': String(watermarkOptions.value.opacity),
  '--vpv-watermark-rotate': `${watermarkOptions.value.rotate}deg`,
  '--vpv-watermark-size': `${watermarkOptions.value.fontSize}px`
}))

watch(() => props.lang, (value) => { currentLang.value = value })
watch(() => props.theme, (value) => {
  currentTheme.value = normalizeTheme(value)
})
watch(() => props.watermark, () => { watermarkEnabled.value = watermarkOptions.value.enabled }, { deep: true })
watch(() => props.src, () => {
  mobileMoreOpen.value = false
  loadPdf()
}, { immediate: true })
watch(scale, () => {
  zoomInput.value = String(Math.round(scale.value * 100))
  pageCache.clear()
  nextTick(renderVisiblePages)
  emit('scale-change', scale.value)
})
watch(pageWidth, () => {
  pageCache.clear()
  nextTick(renderVisiblePages)
})
watch(visiblePages, () => nextTick(renderVisiblePages), { deep: true })
watch(currentPage, (page) => {
  pageInput.value = String(page)
  emit('page-change', page)
  if (props.prerender) void prerenderPage(page + 1)
  nextTick(() => syncThumbnailScroll(page))
})
watch(pageCount, () => nextTick(() => {
  updateViewportSize()
  renderThumbnails()
}))
watch(thumbnailPages, () => nextTick(renderThumbnails), { deep: true })
watch(isMobile, (mobile) => {
  sidebarOpen.value = !mobile
  if (!mobile) mobileMoreOpen.value = false
})

onMounted(() => {
  fullscreenSupported.value = typeof document !== 'undefined' && !!document.fullscreenEnabled
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  updateViewportSize()
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(([entry]) => {
      updateViewportSize(entry.contentRect)
    })
    if (rootRef.value) resizeObserver.observe(rootRef.value)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  resizeObserver?.disconnect()
  pdfTask.value?.destroy?.()
  void pdfDoc.value?.destroy?.()
  if (thumbAutoScrollTimer) clearTimeout(thumbAutoScrollTimer)
  pageCache.clear()
})

async function loadPdf() {
  const seq = ++loadSeq
  loading.value = true
  errorMessage.value = ''
  nativeFallback.value = false
  pageCount.value = 0
  pageCache.clear()
  pageCanvases.clear()
  thumbCanvases.clear()

  try {
    if (!props.src) return

    const renderer = props.pdfjs || getGlobalPdfJs()
    if (!renderer) {
      nativeFallback.value = props.useNativeFallback && typeof props.src === 'string'
      if (!nativeFallback.value) throw new Error('Missing pdfjs renderer')
      return
    }

    const task = renderer.getDocument(normalizeSource(props.src))
    pdfTask.value = isLoadingTask(task) ? task : { promise: task }
    const doc = await pdfTask.value.promise
    if (seq !== loadSeq) return
    pdfDoc.value = doc
    pageCount.value = doc.numPages
    currentPage.value = clamp(props.initialPage, 1, doc.numPages || 1)
    await measureFirstPage()
    await nextTick()
    scrollToPage(currentPage.value, false)
    renderVisiblePages()
    renderThumbnails()
    emit('loaded', doc.numPages)
  } catch (error) {
    if (seq !== loadSeq) return
    errorMessage.value = t.value.loadFailed
    emit('error', error)
  } finally {
    if (seq === loadSeq) loading.value = false
  }
}

async function measureFirstPage() {
  if (!pdfDoc.value || !pageCount.value) return
  const page = await pdfDoc.value.getPage(1)
  const viewport = page.getViewport({ scale: 1 })
  firstPageRatio.value = viewport.height / viewport.width
  page.cleanup?.()
}

function onScroll() {
  const el = scrollRef.value
  if (!el) return
  scrollTop.value = el.scrollTop
  viewportHeight.value = el.clientHeight
  const page = clamp(Math.round(el.scrollTop / itemHeight.value) + 1, 1, pageCount.value || 1)
  if (page !== currentPage.value) currentPage.value = page
}

function updateViewportSize(rect) {
  const rootRect = rect || rootRef.value?.getBoundingClientRect()
  viewportWidth.value = rootRect?.width || 0
  viewportHeight.value = scrollRef.value?.clientHeight || rootRect?.height || 0
  thumbViewportHeight.value = thumbScrollRef.value?.clientHeight || 0
}

function onThumbScroll() {
  const el = thumbScrollRef.value
  if (!el) return
  isThumbUserScrolling = true
  if (thumbAutoScrollTimer) clearTimeout(thumbAutoScrollTimer)
  thumbAutoScrollTimer = setTimeout(() => {
    isThumbUserScrolling = false
  }, 180)
  thumbScrollTop.value = el.scrollTop
  thumbViewportHeight.value = el.clientHeight
}

function syncThumbnailScroll(page) {
  const el = thumbScrollRef.value
  if (!el || isThumbUserScrolling || !pageCount.value) return
  const itemTop = (page - 1) * thumbItemHeight.value
  const itemBottom = itemTop + thumbItemHeight.value
  const viewTop = el.scrollTop
  const viewBottom = viewTop + el.clientHeight
  const padding = thumbItemHeight.value * 0.4
  if (itemTop >= viewTop + padding && itemBottom <= viewBottom - padding) return

  const nextTop = clamp(
    itemTop - (el.clientHeight - thumbItemHeight.value) / 2,
    0,
    Math.max(0, el.scrollHeight - el.clientHeight)
  )
  el.scrollTo({ top: nextTop, behavior: 'smooth' })
}

function setPageCanvas(el, page) {
  if (el instanceof HTMLCanvasElement) {
    pageCanvases.set(page, el)
    void renderPage(page, el)
  } else {
    pageCanvases.delete(page)
  }
}

function setThumbCanvas(el, page) {
  if (el instanceof HTMLCanvasElement) {
    thumbCanvases.set(page, el)
    void renderThumbnail(page, el)
  } else {
    thumbCanvases.delete(page)
  }
}

function pageShellStyle(page) {
  return {
    transform: `translateY(${(page - 1) * itemHeight.value}px)`,
    height: `${pageHeight.value}px`
  }
}

async function renderVisiblePages() {
  for (const page of visiblePages.value) {
    const canvas = pageCanvases.get(page)
    if (canvas) await renderPage(page, canvas)
  }
}

async function renderPage(pageNumber, canvas) {
  if (!pdfDoc.value) return
  const key = cacheKey(pageNumber)
  const cached = pageCache.get(key)
  if (cached) {
    copyCanvas(cached, canvas)
    touchCache(key, cached)
    return
  }

  const token = (renderTokens.get(pageNumber) || 0) + 1
  renderTokens.set(pageNumber, token)
  const page = await pdfDoc.value.getPage(pageNumber)
  if (renderTokens.get(pageNumber) !== token) return

  const base = page.getViewport({ scale: 1 })
  const displayScale = pageWidth.value / base.width
  const displayViewport = page.getViewport({ scale: displayScale })
  const renderViewport = page.getViewport({ scale: displayScale * dpr.value })
  canvas.width = Math.floor(renderViewport.width)
  canvas.height = Math.floor(renderViewport.height)
  canvas.style.width = `${displayViewport.width}px`
  canvas.style.height = `${displayViewport.height}px`
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, renderViewport.width, renderViewport.height)
  await page.render({ canvasContext: ctx, viewport: renderViewport }).promise
  if (renderTokens.get(pageNumber) !== token) return
  storeCache(key, canvas)
  page.cleanup?.()
}

async function renderThumbnail(pageNumber, canvas) {
  if (!pdfDoc.value) return
  const page = await pdfDoc.value.getPage(pageNumber)
  const base = page.getViewport({ scale: 1 })
  const scaleForThumb = props.thumbnailWidth / base.width
  const displayViewport = page.getViewport({ scale: scaleForThumb })
  const renderViewport = page.getViewport({ scale: scaleForThumb * dpr.value })
  canvas.width = Math.floor(renderViewport.width)
  canvas.height = Math.floor(renderViewport.height)
  canvas.style.width = `${displayViewport.width}px`
  canvas.style.height = `${displayViewport.height}px`
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, renderViewport.width, renderViewport.height)
  await page.render({ canvasContext: ctx, viewport: renderViewport }).promise
  page.cleanup?.()
}

function renderThumbnails() {
  for (const [page, canvas] of thumbCanvases) void renderThumbnail(page, canvas)
}

async function prerenderPage(pageNumber) {
  if (!pdfDoc.value || pageNumber < 1 || pageNumber > pageCount.value) return
  const key = cacheKey(pageNumber)
  if (pageCache.has(key)) return
  const canvas = document.createElement('canvas')
  await renderPage(pageNumber, canvas)
}

function goPrevious() {
  goToPage(currentPage.value - 1)
}

function goNext() {
  goToPage(currentPage.value + 1)
}

function goToPage(page) {
  scrollToPage(clamp(page, 1, pageCount.value || 1), true)
}

function scrollToPage(page, smooth) {
  const el = scrollRef.value
  if (!el) return
  currentPage.value = page
  el.scrollTo({ top: (page - 1) * itemHeight.value, behavior: smooth ? 'smooth' : 'auto' })
}

function commitPageInput() {
  const nextPage = Number.parseInt(pageInput.value, 10)
  goToPage(Number.isFinite(nextPage) ? nextPage : currentPage.value)
}

function changeScale(nextScale) {
  scale.value = roundScale(clamp(nextScale, props.minScale, props.maxScale))
}

function commitZoomInput() {
  const value = Number.parseInt(zoomInput.value, 10)
  changeScale(Number.isFinite(value) ? value / 100 : scale.value)
}

function printPdf() {
  if (!props.allowPrint || typeof props.src !== 'string') return
  const frame = document.createElement('iframe')
  frame.style.position = 'fixed'
  frame.style.width = '1px'
  frame.style.height = '1px'
  frame.style.opacity = '0'
  frame.src = props.src
  frame.onload = () => {
    frame.contentWindow?.focus()
    frame.contentWindow?.print()
    setTimeout(() => frame.remove(), 1000)
  }
  document.body.appendChild(frame)
}

async function toggleFullscreen() {
  if (!fullscreenSupported.value || !rootRef.value) return
  try {
    if (document.fullscreenElement === rootRef.value) {
      await document.exitFullscreen()
    } else {
      await rootRef.value.requestFullscreen()
    }
    mobileMoreOpen.value = false
  } catch (error) {
    emit('error', error)
  }
}

function handleFullscreenChange() {
  isFullscreen.value = document.fullscreenElement === rootRef.value
  nextTick(updateViewportSize)
}

function toggleTheme() {
  currentTheme.value = currentTheme.value === 'dark' ? 'light' : 'dark'
  emit('theme-change', currentTheme.value)
}

function guardDownload(event) {
  if (!props.allowDownload) event.preventDefault()
}

function blockContextMenu(event) {
  if (props.disableContextMenu || !props.allowDownload) event.preventDefault()
}

function normalizeSource(source) {
  if (source instanceof URL) return { url: source.href }
  if (typeof source === 'string') return { url: source }
  if (source instanceof Uint8Array) return { data: source }
  if (source instanceof ArrayBuffer) return { data: new Uint8Array(source) }
  return source
}

function stringMessages(messages) {
  const normalized = {}
  if (!messages) return normalized
  for (const [key, value] of Object.entries(messages)) {
    if (typeof value === 'string') normalized[key] = value
  }
  return normalized
}

function getGlobalPdfJs() {
  if (typeof window === 'undefined') return null
  const candidate = window.pdfjsLib
  return candidate || null
}

function isLoadingTask(value) {
  return typeof value === 'object' && value !== null && 'promise' in value
}

function cacheKey(page) {
  return `${page}:${Math.round(pageWidth.value)}:${Math.round(scale.value * 100)}:${Math.round(dpr.value * 100)}`
}

function storeCache(key, canvas) {
  const copy = document.createElement('canvas')
  copyCanvas(canvas, copy)
  pageCache.set(key, copy)
  while (pageCache.size > props.cacheSize) {
    const first = pageCache.keys().next().value
    if (first === undefined) break
    pageCache.delete(first)
  }
}

function touchCache(key, canvas) {
  pageCache.delete(key)
  pageCache.set(key, canvas)
}

function copyCanvas(from, to) {
  to.width = from.width
  to.height = from.height
  to.style.width = from.style.width
  to.style.height = from.style.height
  const ctx = to.getContext('2d')
  if (ctx) ctx.drawImage(from, 0, 0)
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function roundScale(value) {
  return Math.round(value * 100) / 100
}

function normalizeTheme(value) {
  return value === 'dark' ? 'dark' : 'light'
}

function svg(paths) {
  return `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`
}
</script>

<style scoped>
.vpv {
  --vpv-bg: #f4f6f8;
  --vpv-surface: #ffffff;
  --vpv-surface-raised: #ffffff;
  --vpv-border: #d8dee6;
  --vpv-text: #17202c;
  --vpv-muted: #5e6b7a;
  --vpv-primary: #0f766e;
  --vpv-primary-soft: #d8f3ef;
  --vpv-danger: #b42318;
  --vpv-hover: #eef3f6;
  --vpv-toolbar: rgba(255, 255, 255, 0.98);
  --vpv-mobilebar: rgba(255, 255, 255, 0.96);
  --vpv-page-shadow: 0 10px 28px rgba(17, 24, 39, 0.14);
  --vpv-menu-shadow: 0 18px 36px rgba(17, 24, 39, 0.2);
  --vpv-watermark-color: #111827;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 480px;
  overflow: hidden;
  background: var(--vpv-bg);
  color: var(--vpv-text);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  border: 1px solid var(--vpv-border);
}

.vpv--dark {
  --vpv-bg: #111827;
  --vpv-surface: #182231;
  --vpv-surface-raised: #111827;
  --vpv-border: #334155;
  --vpv-text: #f8fafc;
  --vpv-muted: #cbd5e1;
  --vpv-primary: #5eead4;
  --vpv-primary-soft: rgba(45, 212, 191, 0.18);
  --vpv-danger: #fca5a5;
  --vpv-hover: #243244;
  --vpv-toolbar: rgba(24, 34, 49, 0.98);
  --vpv-mobilebar: rgba(24, 34, 49, 0.96);
  --vpv-page-shadow: 0 10px 30px rgba(0, 0, 0, 0.38);
  --vpv-menu-shadow: 0 18px 36px rgba(0, 0, 0, 0.42);
  --vpv-watermark-color: #0f172a;
}

.vpv:fullscreen {
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  border: 0;
  border-radius: 0;
}

.vpv *,
.vpv *::before,
.vpv *::after {
  box-sizing: border-box;
}

.vpv__toolbar {
  position: relative;
  z-index: 40;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 56px;
  padding: 8px 12px;
  background: var(--vpv-toolbar);
  border-bottom: 1px solid var(--vpv-border);
  box-shadow: 0 1px 0 rgba(17, 24, 39, 0.03);
}

.vpv--sticky-toolbar .vpv__toolbar {
  position: sticky;
  top: 0;
}

.vpv__toolbar-group,
.vpv__page-jump {
  display: flex;
  align-items: center;
  gap: 6px;
}

.vpv__toolbar-spacer {
  flex: 1;
}

.vpv__icon-btn,
.vpv__text-btn,
.vpv__mobilebar button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--vpv-text);
  cursor: pointer;
  transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease, opacity 160ms ease;
  touch-action: manipulation;
}

.vpv__text-btn {
  width: auto;
  padding: 0 12px;
  font-size: 14px;
}

.vpv__icon-btn:hover,
.vpv__text-btn:hover,
.vpv__mobilebar button:hover {
  background: var(--vpv-hover);
}

.vpv__icon-btn:focus-visible,
.vpv__text-btn:focus-visible,
.vpv__input:focus-visible,
.vpv__select:focus-visible,
.vpv__mobilebar button:focus-visible {
  outline: 3px solid rgba(15, 118, 110, 0.28);
  outline-offset: 2px;
}

.vpv__icon-btn:disabled,
.vpv__text-btn:disabled,
.vpv__mobilebar button:disabled,
.vpv__icon-btn--disabled {
  opacity: 0.42;
  cursor: not-allowed;
}

.vpv__input,
.vpv__select {
  height: 40px;
  border: 1px solid var(--vpv-border);
  border-radius: 8px;
  background: var(--vpv-surface-raised);
  color: var(--vpv-text);
  font: inherit;
  font-size: 14px;
}

.vpv__input {
  padding: 0 8px;
  text-align: center;
}

.vpv__input--page {
  width: 64px;
}

.vpv__input--zoom {
  width: 68px;
}

.vpv__select {
  min-width: 104px;
  padding: 0 10px;
}

.vpv__page-total,
.vpv__unit {
  color: var(--vpv-muted);
  font-size: 14px;
  white-space: nowrap;
}

.vpv__mobile-page {
  display: none;
}

.vpv__more-menu {
  display: none;
}

.vpv__body {
  display: flex;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.vpv__sidebar {
  width: 144px;
  min-width: 144px;
  overflow-y: auto;
  background: var(--vpv-bg);
  border-right: 1px solid var(--vpv-border);
}

.vpv:not(.vpv--sidebar-open) .vpv__sidebar {
  display: none;
}

.vpv__thumbs {
  position: relative;
  padding: 12px;
}

.vpv__thumb {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  display: grid;
  gap: 6px;
  justify-items: center;
  padding: 8px;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--vpv-muted);
  cursor: pointer;
}

.vpv__thumb--active {
  border-color: var(--vpv-primary);
  background: var(--vpv-primary-soft);
  color: var(--vpv-primary);
}

.vpv__thumb-canvas {
  max-width: 100%;
  border-radius: 3px;
  background: #ffffff;
  box-shadow: 0 1px 3px rgba(17, 24, 39, 0.16);
}

.vpv__thumb-label {
  font-size: 12px;
  line-height: 1.4;
}

.vpv__viewport {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.vpv__pages {
  position: relative;
  min-width: 100%;
}

.vpv__page-shell {
  position: absolute;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  padding: 0 12px;
  will-change: transform;
}

.vpv__page {
  position: relative;
  align-self: start;
  overflow: hidden;
  background: #ffffff;
  box-shadow: var(--vpv-page-shadow);
}

.vpv__canvas {
  display: block;
}

.vpv__watermark {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  place-items: center;
  pointer-events: none;
  color: var(--vpv-watermark-color);
  opacity: var(--vpv-watermark-opacity);
  font-size: var(--vpv-watermark-size);
  font-weight: 600;
  letter-spacing: 0;
}

.vpv__watermark span {
  transform: rotate(var(--vpv-watermark-rotate));
  white-space: nowrap;
}

.vpv__state,
.vpv__native {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  color: var(--vpv-muted);
  text-align: center;
}

.vpv__state--error {
  color: var(--vpv-danger);
}

.vpv__spinner {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  border: 3px solid #d3dbe4;
  border-top-color: var(--vpv-primary);
  animation: vpv-spin 900ms linear infinite;
}

.vpv__native {
  flex-direction: column;
  align-items: stretch;
}

.vpv__native-object {
  width: 100%;
  min-height: 70vh;
  border: 0;
  background: var(--vpv-surface);
}

.vpv__native-note {
  margin: 0;
  color: var(--vpv-muted);
  font-size: 14px;
}

.vpv__mobilebar {
  display: none;
}

.vpv__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@keyframes vpv-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .vpv__spinner {
    animation: none;
  }

  .vpv__icon-btn,
  .vpv__text-btn,
  .vpv__mobilebar button {
    transition: none;
  }
}

@media (max-width: 720px) {
  .vpv {
    min-height: 100dvh;
    border: 0;
  }

  .vpv__toolbar {
    min-height: auto;
    flex-wrap: nowrap;
    gap: 8px;
    padding: 8px max(10px, env(safe-area-inset-right)) 8px max(10px, env(safe-area-inset-left));
  }

  .vpv__mobile-page {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 0;
    flex: 1;
  }

  .vpv__input--mobile-page {
    width: 72px;
    height: 40px;
    font-size: 16px;
    font-weight: 600;
  }

  .vpv__more-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: max(10px, env(safe-area-inset-right));
    z-index: 60;
    display: grid;
    gap: 6px;
    width: min(280px, calc(100vw - 20px));
    padding: 8px;
    border: 1px solid var(--vpv-border);
    border-radius: 8px;
    background: var(--vpv-surface);
    box-shadow: var(--vpv-menu-shadow);
  }

  .vpv__more-field,
  .vpv__more-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: 48px;
    padding: 6px 8px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--vpv-text);
    font-size: 14px;
    text-decoration: none;
  }

  .vpv__more-row {
    cursor: pointer;
  }

  .vpv__more-row:hover {
    background: var(--vpv-hover);
  }

  .vpv__more-row:disabled,
  .vpv__more-row--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .vpv__more-row strong {
    color: var(--vpv-muted);
    font-size: 13px;
    font-weight: 600;
  }

  .vpv__more-input {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .vpv__more-menu .vpv__select {
    min-width: 124px;
    height: 40px;
  }

  .vpv__sidebar {
    display: none;
  }

  .vpv__viewport {
    padding-bottom: 64px;
  }

  .vpv__mobilebar {
    position: sticky;
    bottom: 0;
    z-index: 30;
    display: grid;
    grid-template-columns: repeat(4, minmax(48px, 1fr));
    align-items: center;
    gap: 8px;
    padding: 8px max(10px, env(safe-area-inset-left)) calc(8px + env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-right));
    background: var(--vpv-mobilebar);
    border-top: 1px solid var(--vpv-border);
  }
}
</style>
