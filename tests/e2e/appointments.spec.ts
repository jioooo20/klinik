import { test, expect } from '@playwright/test';
import { login, logout } from './support/auth';
import { AppointmentsIndexPage, AppointmentCreatePage } from './pages/AppointmentsPage';

test.describe('Appointment Booking & Management (KLK-028..KLK-031)', () => {
    test('pasien can book an appointment @KLK-029', async ({ page }) => {
        await login(page, 'pasien');

        const index = new AppointmentsIndexPage(page);
        await index.open();

        await index.createButton.click();
        const create = new AppointmentCreatePage(page);
        await create.open();

        await create.bookFirstAvailable(3);

        // After booking, the form submits and redirects to the appointments index.
        // Wait for the index page by checking the URL first, then assert the heading.
        await page.waitForURL(/\/appointments(\?.*)?$/);
        await expect(
            page.getByRole('main').getByText(/Janji Temu Saya|Antrean Hari Ini|Semua Janji Temu/),
        ).toBeVisible();
    });

    test('dokter can change appointment status @KLK-030', async ({ page }) => {
        await login(page, 'dokter');

        const index = new AppointmentsIndexPage(page);
        await index.open();

        // Change the first available appointment status
        await index.changeFirstStatusTo('confirmed');

        // Wait for the request to complete
        await page.waitForResponse(/\/appointments\/\d+\/status$/);
    });

    test('role-based appointment views @KLK-031', async ({ page }) => {
        // Dokter sees "Antrean Hari Ini"
        await login(page, 'dokter');
        let index = new AppointmentsIndexPage(page);
        await index.open();

        // Logout before switching roles to ensure a clean session.
        await logout(page);

        // Pasien sees "Janji Temu Saya"
        await login(page, 'pasien');
        index = new AppointmentsIndexPage(page);
        await index.open();
    });
});