import { contextBridge, ipcRenderer } from 'electron';
import type { Api } from '@shared/api';

const api: Api = {
  system: {
    ping: () => ipcRenderer.invoke('system.ping'),
  },
};

contextBridge.exposeInMainWorld('api', api);
