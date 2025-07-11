export interface MemosConfig {
  apiUrl: string;
  token: string;
}

export const memosConfig: MemosConfig = {
  apiUrl: 'https://memos.apidocumentation.com/api/v1/memos',
  token: 'your-token-here', // 请替换为你的实际 token
};

export interface MemosResource {
  filename: string;
  content: string;
  externalLink: string;
  type: string;
  size: string;
}

export interface MemosRequest {
  state: string;
  creator: string;
  createTime: string;
  updateTime: string;
  displayTime: string;
  content: string;
  visibility: string;
  pinned: boolean;
  resources: MemosResource[];
  relations: any[];
  location: {
    placeholder: string;
    latitude: number;
    longitude: number;
  };
} 