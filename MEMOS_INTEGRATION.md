# Squoosh Memos 集成

这个项目是 Squoosh 的修改版本，支持多种图片格式压缩并可以上传到 Memos。

## 主要功能

1. **多格式支持**: 支持 AVIF, WebP, JPEG, PNG, JXL, WP2, QOI 等多种格式
2. **图片对比**: 左右分屏对比压缩效果
3. **手动上传**: 压缩完成后手动选择是否上传到 Memos
4. **可配置**: 支持自定义 Memos API 配置

## 使用方法

### 1. 配置 Memos API

1. 打开 Squoosh 应用
2. 上传一张图片
3. 在右侧设置面板中点击 ⚙️ 按钮
4. 输入你的 Memos 域名（如：memos.example.com）
5. 输入你的 Memos Token（无需 Bearer 前缀）

### 2. 压缩和对比

1. 上传图片后，左侧显示原始图片
2. 右侧选择编码格式和参数
3. 实时查看压缩效果和文件大小对比
4. 左侧显示下载按钮，右侧显示上传按钮

### 3. 上传到 Memos

1. 压缩完成后，点击右侧"上传到 Memos"按钮
2. 输入文件名（无需后缀，支持中文）
3. 系统自动上传并创建 Memo

## API 配置

### Memos API 流程

当前实现采用两步上传流程：

1. **创建 Memo**:
```bash
curl https://your-memos-instance.com/api/v1/memos \
   -H "Accept: application/json" \
   -H "Authorization: Bearer your-token" \
   --request POST \
   --header 'Content-Type: application/json' \
   --data '{
     "content": "图片压缩完成",
     "visibility": "PUBLIC"
   }'
```

2. **上传资源**:
```bash
curl https://your-memos-instance.com/api/v1/resource/blob \
   -H "Accept: application/json" \
   -H "Authorization: Bearer your-token" \
   --request POST \
   --header 'Content-Type: multipart/form-data' \
   --form 'file=@image.avif' \
   --form 'memo=your-memo-name'
```

### 配置参数

- **域名**: 你的 Memos 实例域名（如：memos.example.com）
- **Token**: 你的 Memos API 访问令牌（自动添加 Bearer 前缀）

## 技术实现

### 主要修改

1. **多格式支持**: 保留了所有编码器选择，用户可以自由选择格式
2. **图片对比**: 左侧显示原始图片，右侧显示压缩后的图片
3. **手动上传**: 用户需要手动点击上传按钮，而不是自动上传
4. **设置管理**: 添加了本地设置存储功能
5. **上传流程**: 实现了先创建 Memo 再上传资源的两步流程

### 文件结构

```
src/
├── shared/
│   ├── memos-api.ts       # Memos API 服务
│   └── settings.ts        # 设置管理
└── client/lazy-app/Compress/
    ├── index.tsx          # 主要压缩逻辑
    ├── Options/
    │   ├── index.tsx      # 选项界面（包含设置按钮）
    │   └── style.css      # 样式文件
    └── Results/
        ├── index.tsx      # 结果界面（包含上传/下载按钮）
        └── style.css      # 样式文件
```

### 关键功能

1. **格式选择器**: 用户可以在右侧选择不同的编码格式
2. **对比显示**: 左右分屏显示原始图片和压缩后的图片
3. **按钮逻辑**: 
   - 左侧：下载按钮（下载到本地）
   - 右侧：上传按钮（上传到 Memos）
4. **设置界面**: 点击 ⚙️ 按钮配置 Memos API
5. **上传状态**: 显示上传进度和状态

## 开发

### 构建项目

```bash
npm install
npm run build
```

### 本地开发

```bash
npm run dev
```

访问 http://localhost:5000

## 注意事项

1. 确保你的 Memos 实例支持文件上传
2. API Token 需要有创建 memo 和上传资源的权限
3. 图片会以文件形式上传，支持各种格式
4. 设置会保存在浏览器的 localStorage 中
5. 上传前需要手动输入文件名

## 故障排除

### 上传失败

1. 检查域名配置是否正确
2. 确认 Token 是否有效且有足够权限
3. 查看浏览器控制台的错误信息
4. 确认 Memos 实例支持文件上传

### 压缩失败

1. 确保图片格式受支持
2. 检查浏览器是否支持选择的编码格式
3. 尝试刷新页面重新加载
4. 对于大图片，建议先调整尺寸

### 设置问题

1. 域名格式：直接输入域名，如 `memos.example.com`
2. Token 格式：直接输入 token，系统会自动添加 Bearer 前缀
3. 设置保存后需要重新配置才能生效

## 更新日志

### v2.0.0
- 支持多格式压缩（AVIF, WebP, JPEG, PNG, JXL, WP2, QOI）
- 添加图片对比功能
- 改为手动上传模式
- 优化上传流程（先创建 Memo 再上传资源）
- 改进设置界面和用户体验

## 许可证

本项目基于 Squoosh 的 Apache 2.0 许可证。 