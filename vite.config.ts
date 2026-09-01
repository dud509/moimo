import { resolve } from 'node:path'
import { writeFile } from 'node:fs/promises'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/** 앵커 편집기의 "저장하기"가 src/data/anchors.json 을 직접 덮어쓰게 한다 */
function anchorSave(): Plugin {
  return {
    name: 'moimo-anchor-save',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url !== '/__anchors' || req.method !== 'POST') return next()
        const chunks: Buffer[] = []
        req.on('data', (c) => chunks.push(c as Buffer))
        req.on('end', async () => {
          try {
            const body = Buffer.concat(chunks).toString('utf8')
            JSON.parse(body) // 깨진 JSON은 쓰지 않는다
            await writeFile(resolve(__dirname, 'src/data/anchors.json'), body + '\n', 'utf8')
            res.statusCode = 200
            res.end('ok')
          } catch (err) {
            res.statusCode = 400
            res.end(String(err))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), anchorSave()],
  server: { host: true, port: 5173 },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        anchors: resolve(__dirname, 'anchors.html'),
      },
    },
  },
})
