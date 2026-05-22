import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = resolve(root, 'public/sample.pdf')

const pages = 18
const objects = []

function addObject(body) {
  objects.push(body)
  return objects.length
}

function esc(text) {
  return text.replace(/[\\()]/g, '\\$&')
}

const catalogId = addObject('<< /Type /Catalog /Pages 2 0 R >>')
const pagesId = addObject('')
const fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')
const pageIds = []

for (let i = 1; i <= pages; i += 1) {
  const y = 760
  const lines = [
    'BT',
    '/F1 24 Tf',
    `72 ${y} Td (${esc(`Vue PDF Preview Demo - Page ${i}`)}) Tj`,
    '0 -42 Td /F1 13 Tf (Virtual scrolling, LRU cache, prerender and DPR-aware canvas rendering.) Tj',
    '0 -24 Td (Upload your own PDF from the control panel to test real documents.) Tj',
    'ET',
    '0.88 0.95 0.94 rg',
    '72 560 452 96 re f',
    '0.06 0.46 0.43 rg',
    '72 560 452 6 re f',
    '0.10 0.13 0.17 rg',
    'BT /F1 14 Tf 96 612 Td (This built-in sample is generated locally without external assets.) Tj ET',
    '0.82 0.87 0.92 RG',
    ...Array.from({ length: 9 }, (_, row) => {
      const yy = 480 - row * 38
      return `72 ${yy} m 524 ${yy} l S`
    }),
    'BT /F1 10 Tf',
    ...Array.from({ length: 9 }, (_, row) => {
      const yy = 488 - row * 38
      return `84 ${yy} Td (${esc(`Row ${row + 1}: sample page ${i} content for scroll testing`)}) Tj 0 0 Td`
    }),
    'ET'
  ]
  const stream = Buffer.from(lines.join('\n'))
  const compressed = deflateSync(stream)
  const contentId = addObject(`<< /Length ${compressed.length} /Filter /FlateDecode >>\nstream\n${compressed.toString('binary')}\nendstream`)
  const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`)
  pageIds.push(pageId)
}

objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages} >>`

let pdf = '%PDF-1.7\n'
const offsets = [0]

for (let i = 0; i < objects.length; i += 1) {
  offsets.push(Buffer.byteLength(pdf, 'binary'))
  pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`
}

const xrefOffset = Buffer.byteLength(pdf, 'binary')
pdf += `xref\n0 ${objects.length + 1}\n`
pdf += '0000000000 65535 f \n'
for (let i = 1; i < offsets.length; i += 1) {
  pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
}
pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`

await mkdir(dirname(out), { recursive: true })
await writeFile(out, Buffer.from(pdf, 'binary'))
console.log(`created ${out}`)
