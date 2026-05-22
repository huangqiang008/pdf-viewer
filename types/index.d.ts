import type { DefineComponent } from 'vue'

export type PdfPreviewLanguage = 'zh-CN' | 'en-US' | string

export type PdfPreviewSource = string | URL | Uint8Array | ArrayBuffer | null

export interface PdfPreviewMenuVisibility {
  toolbar?: boolean
  thumbnails?: boolean
  previous?: boolean
  next?: boolean
  pageInput?: boolean
  zoom?: boolean
  language?: boolean
  watermarkToggle?: boolean
  download?: boolean
  print?: boolean
  fullscreen?: boolean
  theme?: boolean
  mobileBar?: boolean
}

export interface PdfPreviewWatermarkOptions {
  enabled?: boolean
  text?: string
  opacity?: number
  rotate?: number
  fontSize?: number
}

export interface PdfPreviewProps {
  src?: PdfPreviewSource
  pdfjs?: object | null
  lang?: PdfPreviewLanguage
  messages?: Record<string, Partial<Record<string, string>>>
  menuVisibility?: PdfPreviewMenuVisibility
  theme?: 'light' | 'dark' | string
  stickyToolbar?: boolean
  allowDownload?: boolean
  allowPrint?: boolean
  downloadName?: string
  watermark?: boolean | PdfPreviewWatermarkOptions
  initialPage?: number
  initialScale?: number
  minScale?: number
  maxScale?: number
  scaleStep?: number
  pageGap?: number
  buffer?: number
  cacheSize?: number
  prerender?: boolean
  thumbnailWidth?: number
  mobileBreakpoint?: number
  disableContextMenu?: boolean
  useNativeFallback?: boolean
}

declare const PdfPreview: DefineComponent<PdfPreviewProps>

export { PdfPreview }
export default PdfPreview
