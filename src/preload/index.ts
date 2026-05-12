import { contextBridge, ipcRenderer } from 'electron';
import type { Api } from '@shared/api';

const api: Api = {
  system: {
    ping: () => ipcRenderer.invoke('system.ping'),
  },
  projects: {
    list: () => ipcRenderer.invoke('projects.list'),
    get: (input) => ipcRenderer.invoke('projects.get', input),
    create: (input) => ipcRenderer.invoke('projects.create', input),
    rename: (input) => ipcRenderer.invoke('projects.rename', input),
    duplicate: (input) => ipcRenderer.invoke('projects.duplicate', input),
    delete: (input) => ipcRenderer.invoke('projects.delete', input),
  },
};

contextBridge.exposeInMainWorld('api', api);
