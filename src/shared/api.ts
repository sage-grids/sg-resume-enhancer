export interface Api {
  system: {
    ping: () => Promise<{ ok: true; data: 'pong' }>;
  };
}

declare global {
  interface Window {
    api: Api;
  }
}
