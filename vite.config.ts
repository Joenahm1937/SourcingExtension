import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [],
    build: {
        rollupOptions: {
            input: {
                serviceWorker: 'src/background/serviceWorker.ts',
                contentScript: 'src/content/contentScript.ts',
                popup: 'index.html',
            },
            output: {
                entryFileNames: `[name].js`,
                chunkFileNames: `[name].js`,
                assetFileNames: `[name].[ext]`,
            },
        },
        outDir: 'dist',
    },
});
