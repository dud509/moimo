/**
 * 인쇄용 포스터 내보내기.
 *
 *   npm run poster            기본값 (A2 세로, 120마리, 300dpi)
 *   npm run poster -- --count=180 --seed=3 --dpi=350 --width=500 --height=700
 *
 * out/ 에 세 벌이 떨어진다.
 *   poster.svg   벡터 원본 — 인쇄소에 넘기기 가장 좋다
 *   poster.pdf   벡터 PDF — 종이 크기가 박혀 있다
 *   poster.png   래스터 — 확인용 · 굿즈용
 *
 * 화면(/poster.html)과 같은 코드를 쓰므로 미리 본 그림이 그대로 나온다.
 */

import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'out')
const PORT = 5273

/** 플레이라이트는 이 컨테이너에 전역으로 깔려 있다 */
const require = createRequire(import.meta.url)
const { chromium } = require(
  process.env.PLAYWRIGHT_PATH ?? '/opt/node22/lib/node_modules/playwright',
)

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => a.slice(2).split('=')),
)
const dpi = Number(args.dpi ?? 300)
delete args.dpi

const query = new URLSearchParams(args).toString()
const url = `http://localhost:${PORT}/poster.html${query ? `?${query}` : ''}`

const alive = async () => {
  try {
    const res = await fetch(`http://localhost:${PORT}/poster.html`)
    return res.ok
  } catch {
    return false
  }
}

/** 이미 켜져 있으면 그 서버를 쓰고, 없으면 잠깐 띄웠다 끈다 */
async function server() {
  if (await alive()) return () => {}
  const proc = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
    cwd: ROOT, stdio: 'ignore', detached: false,
  })
  for (let i = 0; i < 60; i++) {
    await new Promise((r) => setTimeout(r, 500))
    if (await alive()) return () => proc.kill()
  }
  proc.kill()
  throw new Error('개발 서버가 뜨지 않았습니다')
}

const stop = await server()
const browser = await chromium.launch()

try {
  await mkdir(OUT, { recursive: true })

  const page = await browser.newPage({ viewport: { width: 1200, height: 1600 } })
  page.on('console', (m) => m.type() === 'error' && console.error('  [page]', m.text()))
  await page.goto(url, { waitUntil: 'load' })
  await page.waitForFunction('window.__posterReady === true', null, { timeout: 120_000 })

  const svg = await page.evaluate('window.__posterSVG')
  const placed = await page.evaluate('window.__posterCount')
  await writeFile(resolve(OUT, 'poster.svg'), svg, 'utf8')

  // 종이 크기 — 벡터에 적힌 mm 를 그대로 읽어 온다
  const [, wmm, hmm] = svg.match(/width="([\d.]+)mm" height="([\d.]+)mm"/).map(Number)
  const px = (mm) => Math.round((mm / 25.4) * dpi)

  const shot = await browser.newPage({
    viewport: { width: px(wmm), height: px(hmm) },
    deviceScaleFactor: 1,
  })
  await shot.setContent(
    `<html><head><style>
       @page { size: ${wmm}mm ${hmm}mm; margin: 0 }
       html,body { margin:0; padding:0; background:#fff }
       svg { display:block; width:100%; height:auto }
     </style></head><body>${svg.replace(/ (width|height)="[\d.]+mm"/g, '')}</body></html>`,
    { waitUntil: 'networkidle' },
  )
  await shot.screenshot({ path: resolve(OUT, 'poster.png'), clip: { x: 0, y: 0, width: px(wmm), height: px(hmm) } })
  await shot.pdf({ path: resolve(OUT, 'poster.pdf'), width: `${wmm}mm`, height: `${hmm}mm`, printBackground: true })

  console.log(`모이모 ${placed}마리 · ${wmm}×${hmm}mm · ${dpi}dpi (${px(wmm)}×${px(hmm)}px)`)
  console.log('  out/poster.svg  out/poster.pdf  out/poster.png')
} finally {
  await browser.close()
  stop()
}
