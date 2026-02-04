import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';

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
                config: resolve(__dirname, 'config.js'),
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
            name: 'load-env-to-config',
            buildStart() {
                // Read .env file and generate config.js
                try {
                    const envPath = resolve(__dirname, '.env');
                    const envContent = readFileSync(envPath, 'utf-8');
                    const env = {};

                    envContent.split('\n').forEach(line => {
                        const [key, ...valueParts] = line.split('=');
                        if (key && valueParts.length > 0) {
                            env[key.trim()] = valueParts.join('=').trim();
                        }
                    });

                    const configContent = `// Auto-generated from .env - DO NOT EDIT MANUALLY
// This file is regenerated on each build

export const DEFAULT_CONFIG = {
    azureEndpoint: '${env.openai || ''}',
    apiKey: '${env.openai_key || ''}',
    deployment: '${env.openai_deployment || ''}',
    apiVersion: '2024-04-01-preview'
};
`;

                    writeFileSync(resolve(__dirname, 'config.js'), configContent);
                    console.log('✓ Generated config.js from .env');
                } catch (err) {
                    console.error('⚠ Failed to generate config.js:', err.message);
                }
            }
        },
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
