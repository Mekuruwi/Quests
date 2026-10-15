const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  database: {
    getConfig: () => ipcRenderer.invoke('database:getConfig'),
    saveConfig: config => ipcRenderer.invoke('database:saveConfig', config),
    testConnection: config => ipcRenderer.invoke('database:testConnection', config),
  },
  quests: {
    list: () => ipcRenderer.invoke('quests:list'),
    create: quest => ipcRenderer.invoke('quests:create', quest),
    addSubquest: request => ipcRenderer.invoke('quests:addSubquest', request),
    completeSubquest: request => ipcRenderer.invoke('quests:completeSubquest', request),
    complete: request => ipcRenderer.invoke('quests:complete', request),
  },
  groups: {
    list: () => ipcRenderer.invoke('groups:list'),
    save: request => ipcRenderer.invoke('groups:save', request),
  },
});
