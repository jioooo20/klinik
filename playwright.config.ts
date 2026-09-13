import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for the Klinik MVP (Laravel 12 + Inertia 2 + React 19).
 *
 * The suite runs against an ISOLATED database (`klinik_e2e`) and a dedicated
 * Laravel dev server on port 8123 so it never touches the `klinik` dev data.
 * `globalSetup` runs `migrate:fresh --seed` plus the tenant fixture before tests.
 */

const PORT = Number(process.env.E2E_PORT ?? 8123);
const BASE_URL = process.env.E2E_BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
    testDir: './tests/e2e',
    testMatch: '**/*.spec.ts',
    globalSetup: './tests/e2e/support/global-setup.ts',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: 1,
    timeout: 45_000,
    expect: { timeout: 10_000 },

    reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],

    use: {
        baseURL: BASE_URL,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        actionTimeout: 10_000,
        navigationTimeout: 20_000,
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    webServer: {
        command: `php artisan serve --host=127.0.0.1 --port=${PORT}`,
        url: `${BASE_URL}/up`,
        reuseExistingServer: false,
        stdout: 'pipe',
        stderr: 'pipe',
        timeout: 120_000,
        env: {
            APP_ENV: 'e2e',
            APP_URL: BASE_URL,
        },
    },
});