import { memosConfig } from './config';

export interface Settings {
  memosApiUrl: string;
  memosToken: string;
  autoUpload: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  memosApiUrl: memosConfig.apiUrl,
  memosToken: memosConfig.token,
  autoUpload: true,
};

const SETTINGS_KEY = 'squoosh-memos-settings';

export class SettingsManager {
  private settings: Settings;

  constructor() {
    this.settings = this.loadSettings();
  }

  private loadSettings(): Settings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('加载设置失败:', error);
    }
    return { ...DEFAULT_SETTINGS };
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  }

  getSettings(): Settings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<Settings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  getMemosConfig() {
    return {
      apiUrl: this.settings.memosApiUrl,
      token: this.settings.memosToken,
    };
  }

  isAutoUploadEnabled(): boolean {
    return this.settings.autoUpload;
  }
}

export const settingsManager = new SettingsManager(); 