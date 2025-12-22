# 开发说明 / Development Guide

## PDF 支持 / PDF Support

此扩展现在支持 PDF 格式的简历上传！使用本地打包的 `pdfjs-dist` 库。

This extension now supports PDF CV uploads! Using locally bundled `pdfjs-dist` library.

## 构建 / Build

### 安装依赖 / Install Dependencies

```bash
npm install
```

### 开发模式 / Development Mode

```bash
npm run dev
```

这会监听文件变化并自动重新构建到 `dist/` 目录。

This watches for file changes and automatically rebuilds to `dist/` directory.

### 生产构建 / Production Build

```bash
npm run build
```

构建输出在 `dist/` 目录。

Build output is in `dist/` directory.

## 加载扩展 / Load Extension

1. 运行 `npm run build`
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 启用"开发者模式" / Enable "Developer mode"
4. 点击"加载已解压的扩展程序" / Click "Load unpacked"
5. 选择 `dist/` 文件夹

## 项目结构 / Project Structure

```
jd-cv-match-extension/
├── popup.js           # 源代码
├── pdfParser.js       # PDF 解析模块
├── background/        # Service worker
├── ...
├── dist/              # 构建输出 (不提交到 git)
│   ├── popup.js
│   ├── pdfParser.js  # 包含打包的 pdf.js
│   └── ...
├── vite.config.js     # Vite 配置
└── package.json
```

## 技术栈 / Tech Stack

- **pdfjs-dist**: PDF 文本提取
- **Vite**: 模块打包工具
- **Chrome Extension Manifest V3**: 扩展框架

## PDF 解析流程 / PDF Parsing Flow

1. 用户上传 PDF 文件
2. `pdfParser.js` 读取 ArrayBuffer
3. 使用 `pdfjs-dist` 提取所有页面文本
4. 清理和格式化文本
5. 保存到 `chrome.storage.local`
6. 缓存 PDF 元数据（文件名、时间戳）

## 注意事项 / Notes

- PDF.js 库约 400KB (gzipped ~120KB)
- 支持所有标准 PDF 格式
- 文本提取是客户端操作，无需上传到服务器
- 缓存保存在浏览器本地存储
