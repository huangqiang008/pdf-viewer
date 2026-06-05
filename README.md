# Vue3 Smart PDF Preview

无额外运行时依赖的 Vue 3 PDF 预览组件。组件自身只把 Vue 作为 peer dependency，PDF 渲染器通过 `pdfjs` prop 或全局 `window.pdfjsLib` 由宿主应用注入，因此不会把 `pdfjs-dist`、字体库或图标库打进组件。

## 功能

- 中文工具栏，支持切换中文 / English，也可传入自定义文案。
- 上一页、下一页、页码跳转。
- 缩放按钮和缩放百分比输入。
- 缩略图侧边栏。
- 水印开关和水印参数配置。
- 下载 / 打印按钮可显隐，也可通过 `allowDownload`、`allowPrint` 禁用。
- 加载、错误、原生预览兜底状态。
- 大文件分页渲染、虚拟滚动、可视页前后 buffer。
- 页面 LRU 缓存、下一页预渲染。
- 基于 `devicePixelRatio` 的高清 Canvas 渲染。
- 移动端自适应工具栏和底部控制条。
- 无字体 / 图标依赖，所有图标为内联 SVG。

## 使用

安装：

```bash
npm install vue3-smart-pdf-preview pdfjs-dist
```

引入组件和样式：

```vue
<template>
  <PdfPreview
    class="viewer"
    src="/demo.pdf"
    :pdfjs="pdfjsLib"
    lang="zh-CN"
    theme="light"
    :allow-download="false"
    :allow-print="false"
    :watermark="{ enabled: true, text: '内部资料' }"
    :menu-visibility="{ language: true, print: true, download: true }"
  />
</template>

<script setup>
import PdfPreview from 'vue3-smart-pdf-preview'
import 'vue3-smart-pdf-preview/style.css'
// 宿主项目可以选择安装/加载 pdfjs-dist，组件本身不直接依赖它。
import * as pdfjsLib from 'pdfjs-dist'

// ⚠️ 必须配置 worker，否则 PDF 无法渲染！
// Vite 项目：
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

// Webpack / Vue CLI 项目（如果 ?url 不可用，请改用以下方式）：
// import workerUrl from 'pdfjs-dist/build/pdf.worker.entry'
// pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl
// 或使用 CDN：
// pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`
</script>

<style scoped>
.viewer {
  height: 100dvh;
}
</style>
```

> **重要**：`pdfjs` prop 和 `workerSrc` 缺一不可。如果只传了 `src` 而没有注入 pdfjs 渲染器，组件会尝试浏览器原生预览兜底（不支持缩略图、虚拟滚动等功能）。如果 worker 未配置，pdfjs-dist 会报错导致 "PDF 加载失败"。

## 本地 Demo

```bash
npm install
npm run demo:pdf
npm run dev
```

打开 `http://localhost:5173/`。Demo 默认加载 `public/sample.pdf`，也可以上传本地 PDF 测试。

如果不传 `pdfjs` 且页面存在 `window.pdfjsLib`，组件会自动使用全局渲染器。若没有渲染器且 `src` 是字符串，会启用浏览器原生 PDF 预览兜底；原生预览不支持缩略图、虚拟滚动、水印等增强功能。

## 常用 Props

| Prop | 默认值 | 说明 |
| --- | --- | --- |
| `src` | `null` | PDF 地址、`URL`、`Uint8Array` 或 `ArrayBuffer`。 |
| `pdfjs` | `null` | 兼容 PDF.js `getDocument` 的渲染器对象。 |
| `lang` | `zh-CN` | 当前语言。内置 `zh-CN`、`en-US`。 |
| `messages` | `{}` | 自定义多语言文案。 |
| `menuVisibility` | 全部显示 | 控制工具栏、缩略图、缩放、语言、下载、打印等菜单显隐。 |
| `stickyToolbar` | `true` | PDF 内容滚动时工具栏自动吸顶。 |
| `menuVisibility.fullscreen` | `true` | 控制全屏按钮显隐，PC 端在顶部工具栏，移动端在更多菜单。 |
| `theme` | `light` | 主题，支持 `light` / `dark`。 |
| `menuVisibility.theme` | `true` | 控制主题切换按钮显隐，PC 端在顶部工具栏，移动端在更多菜单。 |
| `allowDownload` | `false` | 是否允许下载。 |
| `allowPrint` | `false` | 是否允许打印。 |
| `watermark` | `true` | `boolean` 或 `{ enabled, text, opacity, rotate, fontSize }`。 |
| `initialPage` | `1` | 初始页码。 |
| `initialScale` | `1` | 初始缩放。 |
| `minScale` / `maxScale` | `0.5` / `3` | 缩放边界。 |
| `buffer` | `2` | 虚拟滚动渲染可视页前后页数。 |
| `cacheSize` | `8` | 页面 Canvas LRU 缓存数量。 |
| `prerender` | `true` | 是否预渲染下一页。 |
| `mobileBreakpoint` | `720` | 移动端布局断点。 |

## 事件

| 事件 | 参数 |
| --- | --- |
| `loaded` | `pageCount` |
| `error` | `error` |
| `page-change` | `page` |
| `scale-change` | `scale` |
| `theme-change` | `theme` |

## 关于禁止下载 / 打印

前端只能隐藏、禁用或拦截常规入口，无法从根本上阻止浏览器开发者工具、网络面板、截图、缓存文件等绕过方式。真正的权限控制需要后端鉴权、短期签名 URL、按页图片化或文档水印审计等方案配合。
