import { contextBridge, ipcRenderer } from 'electron';
import type { Api } from '@shared/api';

const api: Api = {
  system: {
    ping: () => ipcRenderer.invoke('system.ping'),
    showItemInFolder: (input) => ipcRenderer.invoke('system.showItemInFolder', input),
  },
  projects: {
    list: () => ipcRenderer.invoke('projects.list'),
    get: (input) => ipcRenderer.invoke('projects.get', input),
    create: (input) => ipcRenderer.invoke('projects.create', input),
    rename: (input) => ipcRenderer.invoke('projects.rename', input),
    updateTemplate: (input) => ipcRenderer.invoke('projects.updateTemplate', input),
    duplicate: (input) => ipcRenderer.invoke('projects.duplicate', input),
    delete: (input) => ipcRenderer.invoke('projects.delete', input),
    export: (input) => ipcRenderer.invoke('projects.export', input),
  },
  resume: {
    get: (input) => ipcRenderer.invoke('resume.get', input),
    save: (input) => ipcRenderer.invoke('resume.save', input),
  },
  templates: {
    list: () => ipcRenderer.invoke('templates.list'),
    renderPreview: (input) => ipcRenderer.invoke('templates.renderPreview', input),
  },
  import: {
    pickFile: () => ipcRenderer.invoke('import.pickFile'),
    parseFile: (input) => ipcRenderer.invoke('import.parseFile', input),
  },
  ai: {
    listConfigs: () => ipcRenderer.invoke('ai.listConfigs'),
    saveConfig: (input) => ipcRenderer.invoke('ai.saveConfig', input),
    setSecret: (input) => ipcRenderer.invoke('ai.setSecret', input),
    testConnection: (input) => ipcRenderer.invoke('ai.testConnection', input),
  },
};

contextBridge.exposeInMainWorld('api', api);
