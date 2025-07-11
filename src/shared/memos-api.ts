import { memosConfig, MemosRequest, MemosResource } from './config';
import { settingsManager } from './settings';

export class MemosApiService {
  private get config() {
    return settingsManager.getMemosConfig();
  }

  /**
   * 将图片文件转换为 base64 字符串
   */
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // 移除 data:image/avif;base64, 前缀
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * 创建 Memo，返回 name 字段
   */
  private async createMemo(content: string, pinned: boolean, visibility: 'PRIVATE' | 'PUBLIC' = 'PRIVATE'): Promise<string> {
    const now = new Date().toISOString();
    const requestBody = {
      state: 'NORMAL',
      creator: 'auto',
      createTime: now,
      updateTime: now,
      displayTime: now,
      content,
      visibility,
      pinned,
    };
    const response = await fetch(this.config.apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': this.config.token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    if (!response.ok) {
      throw new Error(`创建 Memo 失败: ${response.status}`);
    }
    const data = await response.json();
    if (!data.name) throw new Error('未获取到 memo.name');
    return data.name;
  }

  /**
   * 上传图片到 Memos（新版：先建 memo，再上传资源并绑定 memo）
   */
  async uploadImage(
    imageFile: File,
    content: string = '图片压缩完成',
    pinned: boolean = false,
    customFileName?: string,
    visibility: 'PRIVATE' | 'PUBLIC' = 'PRIVATE'
  ): Promise<any> {
    try {
      // 1. 创建 Memo，获取 name
      const memoName = await this.createMemo(content, pinned, visibility);

      // 2. 将图片转换为 base64
      const base64Content = await this.fileToBase64(imageFile);
      // 生成文件名
      let newFileName = customFileName;
      if (!newFileName) {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const originalName = imageFile.name.replace(/\.[^/.]+$/, '');
        newFileName = `${year}${month}${day}_${originalName}.avif`;
      }

      // 3. 构造资源对象，带 memo 字段
      const resourceBody = {
        filename: newFileName,
        content: base64Content,
        externalLink: '',
        type: imageFile.type,
        size: imageFile.size.toString(),
        memo: memoName,
      };

      // 4. 上传资源
      let resourceApiUrl = this.config.apiUrl;
      resourceApiUrl = resourceApiUrl.replace(/\/memos?$/, '/resources').replace(/\/memo$/, '/resources');
      const response = await fetch(resourceApiUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': this.config.token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resourceBody),
      });
      if (!response.ok) {
        throw new Error(`上传资源失败: ${response.status}`);
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('上传到 Memos 失败:', error);
      throw error;
    }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<typeof memosConfig>) {
    Object.assign(this.config, newConfig);
  }
}

export const memosApiService = new MemosApiService(); 