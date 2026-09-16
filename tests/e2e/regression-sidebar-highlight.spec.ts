import { test, expect } from '@playwright/test';
import { login } from './support/auth';

/**
 * Regression coverage for the 2026-09-16 doctor-sidebar fixes:
 *
 *  1. The phantom "Rekam Medis" sidebar entry must not exist (it was served
 *     from a stale Vite bundle and had a duplicate href of "Pasien Saya").
 *  2. RoleLayout.tsx must highlight EXACTLY ONE nav item, including on a
 *     nested route such as `/patients/{id}/records`.
 *
 * The active style is the Tailwind class pair `bg-indigo-50 text-indigo-700`
 * (see resources/js/Layouts/RoleLayout.tsx).
 */
const ACTIVE_SELECTOR = 'a[class*="bg-indigo-50"]';

test.describe('Regression: Dokter sidebar single-highlight', () => {
    test('no "Rekam Medis" sidebar entry and exactly one active item on /dashboard/doctor', async ({ page }) => {
        await login(page, 'dokter');
        await page.goto('/dashboard/doctor');

        const nav = page.locator('aside nav');
        await expect(nav).toBeVisible();

        // The phantom entry must be gone.
        await expect(
            nav.getByRole('link', { name: 'Rekam Medis', exact: true }),
        ).toHaveCount(0);

        // The dokter sidebar is exactly these three items.
        await expect(nav.getByRole('link')).toHaveCount(3);

        const active = nav.locator(ACTIVE_SELECTOR);
        await expect(active).toHaveCount(1);
        await expect(active).toContainText('Dasbor');
    });

    test('nested /patients/{id}/records highlights exactly one item ("Pasien Saya")', async ({ page }) => {
        await login(page, 'dokter');

        // Discover a real patient id from the list page.
        await page.goto('/patients');
        await expect(page.getByText('Daftar Pasien')).toBeVisible();
        const detailLink = page.getByRole('link', { name: 'Detail' }).first();
        const href = await detailLink.getAttribute('href');
        const patientId = href?.match(/\/patients\/(\d+)/)?.[1];
        expect(patientId).toBeTruthy();

        await page.goto(`/patients/${patientId}/records`);
        await expect(page.getByText('Riwayat Rekam Medis')).toBeVisible();

        const nav = page.locator('aside nav');
        const active = nav.locator(ACTIVE_SELECTOR);

        // Longest-prefix rule: '/patients/5/records' nests under '/patients',
        // so only "Pasien Saya" is highlighted — never two at once.
        await expect(active).toHaveCount(1);
        await expect(active).toContainText('Pasien Saya');
    });
});