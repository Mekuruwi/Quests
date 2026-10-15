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
  profile: {
    get: () => ipcRenderer.invoke('profile:get'),
    save: profile => ipcRenderer.invoke('profile:save', profile),
  },
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: () => ipcRenderer.invoke('window:toggleMaximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
    onMaximizedChange: callback => {
      const listener = (_event, maximized) => callback(maximized);
      ipcRenderer.on('window:maximized', listener);
      return () => ipcRenderer.removeListener('window:maximized', listener);
    },
  },
  invites: {
    compose: request => ipcRenderer.invoke('invites:compose', request),
  },
});
