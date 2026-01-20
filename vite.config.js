import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                popup: resolve(__dirname, 'popup.html'),
                'background/service_worker': resolve(__dirname, 'background/service_worker.js'),
                content: resolve(__dirname, 'contentScript.js'),
                floatingButton: resolve(__dirname, 'floatingButton.js'),
                cvGenerator: resolve(__dirname, 'cvGenerator.js'),
                pdfParser: resolve(__dirname, 'pdfParser.js'),
                azureOpenAI: resolve(__dirname, 'azureOpenAI.js'),
            },
            output: {
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                assetFileNames: '[name].[ext]',
                format: 'es',
            },
        },
        outDir: 'dist',
        emptyOutDir: true,
        copyPublicDir: false,
    },
    resolve: {
        alias: {
            'pdfjs-dist': 'pdfjs-dist/build/pdf.mjs',
        },
    },
    plugins: [
        {
            name: 'copy-files',
            closeBundle() {
                // 复制必要的文件到 dist
                const filesToCopy = [
                    'manifest.json',
                    'storage.js',
                    'floatingButton.css',
                    'overlay.js',
                    'pdf.worker.mjs',
                ];

                filesToCopy.forEach(file => {
                    try {
                        copyFileSync(resolve(__dirname, file), resolve(__dirname, 'dist', file));
                        console.log(`✓ Copied ${file}`);
                    } catch (err) {
                        console.warn(`⚠ Could not copy ${file}:`, err.message);
                    }
                });

                // 复制 icons 文件夹
                const iconsDir = resolve(__dirname, 'dist/icons');
                if (!existsSync(iconsDir)) {
                    mkdirSync(iconsDir, { recursive: true });
                }

                ['icon16.svg', 'icon48.svg', 'icon128.svg'].forEach(icon => {
                    try {
                        copyFileSync(
                            resolve(__dirname, 'icons', icon),
                            resolve(__dirname, 'dist/icons', icon)
                        );
                        console.log(`✓ Copied icons/${icon}`);
                    } catch (err) {
                        console.warn(`⚠ Could not copy icons/${icon}:`, err.message);
                    }
                });

                // 复制 background 文件夹结构
                const bgDir = resolve(__dirname, 'dist/background');
                if (!existsSync(bgDir)) {
                    mkdirSync(bgDir, { recursive: true });
                }

                console.log('\n✅ Build complete! Load the "dist" folder in Chrome.');
            }
        }
    ]
});
