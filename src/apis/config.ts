/**
 * VITE_API_MODE=live 이면 실제 백엔드를 호출한다.
 * 설정하지 않으면 예시 데이터로 동작해 백엔드 없이도 시연할 수 있다.
 */
export const USE_LIVE_API = import.meta.env.VITE_API_MODE === 'live'
