interface ElectronAPI {
  getDesktopSources: () => Promise<{ id: string; name: string; thumbnail: string }[]>;
  platform: string;
}

interface Window {
  electronAPI?: ElectronAPI;
}
