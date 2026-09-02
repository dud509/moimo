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

/** 파츠 SVG 를 갈아끼우면 페이지를 새로 고친다 (public/ 은 Vite 가 안 봐준다) */
function watchParts(): Plugin {
  return {
    name: 'moimo-watch-parts',
    configureServer(server) {
      const dir = resolve(__dirname, 'public/parts')
      server.watcher.add(dir)
      server.watcher.on('all', (_event, file) => {
        if (file.startsWith(dir)) {
          server.config.logger.info(`  파츠 변경 감지 → 새로 고침  ${file.slice(dir.length + 1)}`)
          server.ws.send({ type: 'full-reload' })
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), anchorSave(), watchParts()],
  server: {
    host: true,
    // 예전 프로젝트(5173)와 겹치지 않는 포트.
    // strictPort 를 켜두면 포트가 차 있을 때 조용히 옮겨가지 않고 에러를 낸다.
    port: 5273,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        anchors: resolve(__dirname, 'anchors.html'),
      },
    },
  },
})
