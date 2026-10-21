/**
 * 이름 목록 → 격자 한 장. 엽서·굿즈 고를 때 늘어놓고 본다.
 *   /sheet.html?names=김다영,박민준,...&cols=3
 */
import { loadParts, composeMoimo, moimoDataUri } from '../moimo/compose'
import { normalizeTable } from '../moimo/parts'
import anchorsJson from '../data/anchors.json'
import { genesFromName } from '../moimo/name'

const q = new URLSearchParams(location.search)
const names = (q.get('names') ?? '').split(',').map((s) => s.trim()).filter(Boolean)
const cols = Number(q.get('cols') ?? 3)

const main = async () => {
  const cache = await loadParts()
  const table = normalizeTable(anchorsJson)
  const grid = document.getElementById('grid')!
  grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`
  for (const n of names) {
    const g = genesFromName(n)
    if (!g) continue
    const cell = document.createElement('div')
    cell.className = 'cell'
    cell.innerHTML =
      `<img src="${moimoDataUri(composeMoimo(g, cache, table))}" alt="${n}">` +
      `<b>${n}</b><span>몸통 ${g.body} · 색 ${g.color}</span>`
    grid.appendChild(cell)
  }
  ;(window as unknown as Record<string, unknown>).__sheetReady = true
}
main()
