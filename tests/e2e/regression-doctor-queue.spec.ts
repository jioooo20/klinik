import { test, expect } from '@playwright/test';
import { login } from './support/auth';

/**
 * Regression coverage for the 2026-09-16 "Isi Rekam Medis" 404 fix.
 *
 * The bug: Dashboard/Doctor.tsx built the link with the APPOINTMENT id while
 * `patients.records.create` is bound to the PATIENT model, so route-model
 * binding resolved a non-existent Patient and 404'd.
 *
 * These assertions pin the fix: the href must target `/patients/{id}/records/create`
 * and the id must address the SAME patient shown in the queue row.
 *
 * Relies on `tests/e2e/support/seed-today-queue.php`, which adds one unrecorded
 * appointment for today (the demo seeder records every appointment).
 */
test.describe('Regression: Dokter queue "Isi Rekam Medis" patient-id binding', () => {
    test('queue button links to the PATIENT records/create route and lands on that patient', async ({ page }) => {
        await login(page, 'dokter');
        await page.goto('/dashboard/doctor');

        // "Antrean Hari Ini" also exists as a sidebar link, so scope the
        // assertion to <main> to avoid a strict-mode collision.
        await expect(
            page.getByRole('main').getByText('Antrean Hari Ini'),
        ).toBeVisible();

        // Exactly one actionable row exists (the unrecorded today fixture).
        // Rows whose appointment already has a record must render NO button.
        const buttons = page.getByRole('link', { name: 'Isi Rekam Medis' });
        await expect(buttons).toHaveCount(1);

        const link = buttons.first();
        await expect(link).toBeVisible();

        const href = await link.getAttribute('href');
        expect(href).toBeTruthy();

        // Ziggy's route() emits an ABSOLUTE url (http://host/patients/1/...),
        // so compare the parsed PATHNAME rather than the raw attribute.
        const pathname = new URL(href!, 'http://localhost').pathname;
        const match = pathname.match(/^\/patients\/(\d+)\/records\/create$/);

        // Must be /patients/<digits>/records/create — never /appointments/<id>/...
        // (the pre-fix bug produced the appointment id here).
        expect(pathname).toMatch(/^\/patients\/\d+\/records\/create$/);
        expect(pathname).not.toContain('/appointments/');
        const patientIdFromHref = Number(match![1]);

        // Capture the patient NAME from the same table row.
        const row = page.getByRole('row').filter({ has: link });
        const patientName = (await row.locator('td').nth(1).innerText()).trim();
        expect(patientName).not.toBe('—');

        await link.click();
        await page.waitForURL(/\/patients\/\d+\/records\/create$/);

        // The URL we landed on carries the SAME id the href advertised.
        expect(new URL(page.url()).pathname).toBe(
            `/patients/${patientIdFromHref}/records/create`,
        );

        // Not the 404 page (the pre-fix symptom).
        await expect(page.getByRole('heading', { name: '404' })).toHaveCount(0);

        // The create form renders for the SAME patient shown in the queue row,
        // proving the id is the patient id and not a coincidental other id.
        await expect(page.getByText('Rekam Medis Baru')).toBeVisible();
        await expect(
            page.getByRole('main').getByText(patientName, { exact: false }).first(),
        ).toBeVisible();
    });

    test('dokter with an empty today queue sees the "Belum ada antrean." empty state', async ({ page }) => {
        // Clinic B's only appointment is scheduled for now()->addDays(2)
        // (seed-tenant.php:64), so its doctor has ZERO today rows — reachable
        // with the EXISTING fixtures, no extra seed. dokter1 (the queue-fixture
        // owner asserted above) is untouched, so this cannot destabilise the
        // "Isi Rekam Medis" test.
        await login(page, 'dokterB');
        await page.goto('/dashboard/doctor');

        // "Antrean Hari Ini" is also a sidebar link — scope to <main>.
        await expect(
            page.getByRole('main').getByText('Antrean Hari Ini'),
        ).toBeVisible();

        // The empty-state copy from Dashboard/Doctor.tsx:83-88.
        await expect(page.getByText('Belum ada antrean.')).toBeVisible();

        // And, symmetrically, no actionable row exists on an empty queue.
        await expect(page.getByRole('link', { name: 'Isi Rekam Medis' })).toHaveCount(0);
    });
});