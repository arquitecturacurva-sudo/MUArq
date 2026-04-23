import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("curvDesktop", {
  isDesktop: true,
  openExternal: (url) => ipcRenderer.invoke("desktop:openExternal", url),
  importCotizacionXlsx: () => ipcRenderer.invoke("desktop:importCotizacionXlsx"),
});
