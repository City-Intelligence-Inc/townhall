// Point this at your backend — use your machine's LAN IP for device testing
// e.g. "http://192.168.1.100:8000"
export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
export const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? 'ws://localhost:8000';
