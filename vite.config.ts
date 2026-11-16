import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const apiBaseUrl = env.VITE_API_BASE_URL

  if (!apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL 환경변수를 설정해주세요.')
  }

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
          configure(proxy) {
            proxy.on('proxyReq', request => {
              // 개발 서버 간 요청에는 브라우저의 Origin 헤더를 전달하지 않는다.
              request.removeHeader('origin')
            })
          },
        },
      },
    },
  }
})
