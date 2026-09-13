import { test, expect } from '@playwright/test';
import { USERS, login, logout, attemptLogin } from './support/auth';
import { LoginPage, RegisterPage } from './pages/LoginPage';

test.describe('Authentication & Registration', () => {
    test('admin can login and reach dashboard @KLK-015', async ({ page }) => {
        await login(page, 'admin');
        await expect(page).toHaveURL(/\/dashboard\/admin$/);
    });

    test('dokter can login and reach dashboard @KLK-015', async ({ page }) => {
        await login(page, 'dokter');
        await expect(page).toHaveURL(/\/dashboard\/doctor$/);
    });

    test('pasien can login and reach dashboard @KLK-015', async ({ page }) => {
        await login(page, 'pasien');
        await expect(page).toHaveURL(/\/dashboard\/patient$/);
    });

    test('new pasien can register and land on dashboard @BUG-01', async ({ page }) => {
        const reg = new RegisterPage(page);
        await reg.open();

        const unique = Date.now().toString().slice(-6);
        const email = `e2e-pasien-${unique}@klinik.test`;

        await reg.register({
            name: `Pasien E2E ${unique}`,
            email,
            phone: '081234567890',
            password: 'password',
            confirmation: 'password',
        });

        // After successful registration the app redirects to the patient dashboard.
        await expect(page).toHaveURL(/\/dashboard\/patient$/);
    });

    test('invalid credentials show error toast @BUG-01', async ({ page }) => {
        await attemptLogin(page, 'wrong@klinik.test', 'nope');
        // Accept either Indonesian or English auth failure message.
        await expect(page.getByText(/Email atau kata sandi salah|These credentials do not match our records/)).toBeVisible();
    });

    test('logout returns user to login screen', async ({ page }) => {
        await login(page, 'pasien');
        await logout(page);
        await expect(page).toHaveURL(/\/login$/);
    });
});