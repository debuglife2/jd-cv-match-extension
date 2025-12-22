# 如何加载扩展 / How to Load the Extension

## 🚀 快速开始 / Quick Start

### 1. 构建扩展 / Build the Extension

```bash
cd jd-cv-match-extension
npm install
npm run build
```

构建完成后会生成 `dist/` 文件夹。

After building, a `dist/` folder will be generated.

### 2. 在 Chrome 中加载 / Load in Chrome

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 打开右上角的 **"开发者模式"** / Enable **"Developer mode"** (top right)
4. 点击 **"加载已解压的扩展程序"** / Click **"Load unpacked"**
5. 选择项目中的 **`dist`** 文件夹

### 3. 完成！ / Done!

扩展图标会出现在浏览器工具栏中。

The extension icon will appear in your browser toolbar.

## 📁 dist 文件夹结构 / dist Folder Structure

```
dist/
├── manifest.json          # 扩展配置
├── popup.html            # 弹窗界面
├── popup.js              # 弹窗逻辑
├── popup.css             # 弹窗样式
├── pdfParser.js          # PDF 解析 (含 pdf.js ~400KB)
├── storage.js            # 存储模块
├── azureOpenAI.js        # OpenAI 集成
├── content.js            # 内容脚本
├── floatingButton.js     # 浮动按钮
├── floatingButton.css    # 浮动按钮样式
├── background/
│   └── service_worker.js # 后台服务
└── icons/
    ├── icon16.svg
    ├── icon48.svg
    └── icon128.svg
```

## 🔄 开发模式 / Development Mode

如果你要修改代码，使用开发模式：

If you want to modify code, use dev mode:

```bash
npm run dev
```

这会监听文件变化并自动重新构建。修改后只需在 Chrome 中点击扩展的刷新按钮。

This watches for changes and auto-rebuilds. After changes, just click the reload button in Chrome extensions page.

## ⚠️ 注意事项 / Notes

- **必须先构建**: 不能直接加载源代码文件夹，必须加载 `dist/` 文件夹
- **PDF 支持**: 已包含在打包文件中，无需额外配置
- **开发者模式**: 只有在开发者模式下才能加载未打包的扩展

---

- **Must build first**: Cannot load the source folder directly, must load the `dist/` folder
- **PDF support**: Already bundled, no extra configuration needed
- **Developer mode**: Can only load unpacked extensions in developer mode

## 🐛 故障排除 / Troubleshooting

### 扩展加载失败 / Extension fails to load

1. 确认已运行 `npm run build`
2. 确认选择的是 `dist/` 文件夹
3. 查看 Chrome 扩展页面的错误信息

### PDF 上传失败 / PDF upload fails

1. 确保 PDF 文件不是加密的
2. 查看浏览器控制台的错误信息
3. 尝试先转换为 TXT 格式

### 重新构建后扩展不更新 / Extension doesn't update after rebuild

1. 在 `chrome://extensions/` 页面点击扩展的刷新按钮
2. 或者先移除扩展再重新加载
