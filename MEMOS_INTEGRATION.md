# Squoosh Memos 集成

这个项目是 Squoosh 的修改版本，专门用于将图片压缩为 AVIF 格式并自动上传到 Memos。

## 主要功能

1. **固定 AVIF 输出**: 所有图片都会被压缩为 AVIF 格式
2. **自动上传**: 压缩完成后自动上传到 Memos API
3. **可配置**: 支持自定义 Memos API 配置

## 使用方法

### 1. 配置 Memos API

1. 打开 Squoosh 应用
2. 上传一张图片
3. 在右侧设置面板中点击 ⚙️ 按钮
4. 输入你的 Memos API URL 和 Token
5. 选择是否启用自动上传

### 2. 压缩和上传

1. 上传图片后，系统会自动开始压缩
2. 压缩完成后，如果启用了自动上传，图片会自动上传到 Memos
3. 上传状态会在界面上显示

## API 配置

### Memos API 格式

```bash
curl https://your-memos-instance.com/api/v1/memos \
   -H "Accept: application/json" \
   -H "Authorization: your-token" \
   --request POST \
   --header 'Content-Type: application/json' \
   --data '{
     "content": "图片压缩完成",
     "resources": [
       {
         "filename": "image.avif",
         "content": "base64-encoded-image-data",
         "type": "image/avif",
         "size": "12345"
       }
     ]
   }'
```

### 配置参数

- **API URL**: 你的 Memos 实例的 API 地址
- **Token**: 你的 Memos API 访问令牌
- **自动上传**: 是否在压缩完成后自动上传

## 技术实现

### 主要修改

1. **固定编码器**: 修改了 `src/client/lazy-app/Compress/index.tsx`，将默认编码器设置为 AVIF
2. **隐藏选择器**: 修改了 `src/client/lazy-app/Compress/Options/index.tsx`，隐藏了编码器选择界面
3. **自动上传**: 在图片处理完成后自动调用 Memos API
4. **设置管理**: 添加了本地设置存储功能

### 文件结构

```
src/
├── shared/
│   ├── config.ts          # Memos API 配置
│   ├── memos-api.ts       # Memos API 服务
│   └── settings.ts        # 设置管理
└── client/lazy-app/Compress/
    ├── index.tsx          # 主要压缩逻辑
    ├── Options/
    │   ├── index.tsx      # 选项界面
    │   └── style.css      # 样式文件
    └── Results/
        ├── index.tsx      # 结果界面
        └── style.css      # 样式文件
```

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

## 注意事项

1. 确保你的 Memos 实例支持文件上传
2. API Token 需要有创建 memo 的权限
3. 图片会以 base64 格式上传，大文件可能需要较长时间
4. 设置会保存在浏览器的 localStorage 中

## 故障排除

### 上传失败

1. 检查 API URL 是否正确
2. 确认 Token 是否有效
3. 查看浏览器控制台的错误信息

### 压缩失败

1. 确保图片格式受支持
2. 检查浏览器是否支持 AVIF 编码
3. 尝试刷新页面重新加载

## 许可证

本项目基于 Squoosh 的 Apache 2.0 许可证。 