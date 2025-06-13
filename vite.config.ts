import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // GITHUB_REPOSITORY is in the format 'owner/repo'. We need 'repo' for the base path.
    const repositoryName = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : '';

    return {
      // Set the base path for production build, especially for GitHub Pages.
      // If GITHUB_REPOSITORY is available (e.g., in GitHub Actions), use `/<repositoryName>/`.
      // Otherwise (e.g., local build or other deployment platforms), default to '/'.
      base: mode === 'production' && repositoryName ? `/${repositoryName}/` : '/',
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        // 'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY) // API_KEY is used in app
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});