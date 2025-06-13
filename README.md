# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:** Node.js

1.  Create a `.env` file in the root of your project.
    (You can copy `.env.example` if one exists, or create it from scratch).
2.  Add your Gemini API key to the `.env` file:
    ```
    GEMINI_API_KEY="YOUR_API_KEY_HERE"
    ```
    Replace `YOUR_API_KEY_HERE` with your actual Gemini API key.
3.  Install dependencies:
    ```bash
    npm install
    ```
4.  Run the app:
    ```bash
    npm run dev
    ```
The app will typically be accessible at `http://localhost:5173`.

## Build for Production

To build the app for production, run:
```bash
npm run build
```
This will create a `dist` folder in your project root with the optimized static assets.

## Deploying to GitHub Pages (Example)

This section provides an example of how to deploy your Vite application to GitHub Pages using GitHub Actions.

1.  **Ensure `vite.config.ts` is Configured for GitHub Pages**:
    The `base` option in `vite.config.ts` should be configured to match your GitHub Pages URL structure (e.g., `/<repository-name>/`). The provided `vite.config.ts` attempts to set this dynamically using the `GITHUB_REPOSITORY` environment variable, which is available in GitHub Actions.

    ```typescript
    // vite.config.ts snippet
    // ...
    export default defineConfig(({ mode }) => {
        // ...
        const repositoryName = process.env.GITHUB_REPOSITORY ? process.env.GITHUB_REPOSITORY.split('/')[1] : '';
        return {
          base: mode === 'production' && repositoryName ? `/${repositoryName}/` : '/',
          // ...
        };
    });
    ```

2.  **Set up GitHub Actions Workflow**:
    Create a workflow file in your repository at `.github/workflows/deploy.yml` with the following content:

    ```yaml
    name: Deploy to GitHub Pages

    on:
      push:
        branches:
          - main # Or your default branch, e.g., master
      workflow_dispatch: # Allows manual triggering

    # Grant permissions for the workflow to deploy to GitHub Pages
    permissions:
      contents: read
      pages: write
      id-token: write

    jobs:
      build:
        runs-on: ubuntu-latest
        steps:
          - name: Checkout repository
            uses: actions/checkout@v4

          - name: Setup Node.js
            uses: actions/setup-node@v4
            with:
              node-version: '20' # Specify your Node.js version from package.json engines or LTS
              cache: 'npm'

          - name: Install dependencies
            run: npm ci # Use ci for cleaner installs in CI

          - name: Build project
            run: npm run build
            env:
              # Pass the API key to the build process
              GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
              # GITHUB_REPOSITORY is automatically available for vite.config.ts
              
          - name: Upload production-ready build files
            uses: actions/upload-pages-artifact@v3
            with:
              path: ./dist # Path to the build output directory

      deploy:
        needs: build
        runs-on: ubuntu-latest
        environment:
          name: github-pages
          url: ${{ steps.deployment.outputs.page_url }} # Output the deployment URL
        steps:
          - name: Deploy to GitHub Pages
            id: deployment
            uses: actions/deploy-pages@v4 # Action to deploy to GitHub Pages
    ```

3.  **Configure Repository Settings for GitHub Pages**:
    *   Go to your GitHub repository.
    *   Click on "Settings" > "Pages".
    *   Under "Build and deployment", for the "Source", select "GitHub Actions".

4.  **Add API Key to GitHub Secrets**:
    *   In your GitHub repository, go to "Settings".
    *   In the left sidebar, navigate to "Secrets and variables" > "Actions".
    *   Click the "New repository secret" button.
    *   Name the secret `GEMINI_API_KEY`.
    *   Paste your actual Gemini API key into the "Value" field.
    *   Click "Add secret".

**Important Notes:**
*   **API Key Security**: Never hardcode your `GEMINI_API_KEY` directly into your source code or commit it to your repository. Always use environment variables for local development (e.g., via a `.env` file that is in `.gitignore`) and repository secrets for CI/CD environments like GitHub Actions.
*   **Paths**: Vite generally handles asset paths correctly during the build process when the `base` configuration is set appropriately. If you encounter issues with images or CSS not loading, double-check the generated paths in your `dist/index.html` and ensure they align with your deployment structure.
*   **Troubleshooting**: If deployment fails, check the "Actions" tab in your GitHub repository for logs from the workflow run. Browser developer console errors on the deployed page can also provide clues.
```