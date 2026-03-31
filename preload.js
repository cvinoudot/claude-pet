const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petBridge', {
  onInitState: (cb) => ipcRenderer.on('init-state', (_, state) => cb(state)),
  onClaudeEvent: (cb) => ipcRenderer.on('claude-event', (_, event) => cb(event)),
  saveState: (state) => ipcRenderer.send('save-state', state),
  mouseEnter: () => ipcRenderer.send('mouse-enter'),
  mouseLeave: () => ipcRenderer.send('mouse-leave')
});
