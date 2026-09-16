import { test, expect } from '@playwright/test';
import { login } from './support/auth';
import { PatientsIndexPage, PatientShowPage } from './pages/PatientsPage';

/**
 * Regression coverage for the 2026-09-16 NIK "Belum ada NIK" fallback.
 *
 * The feature: Patients/Show.tsx:76-80 renders the patient's NIK in a
 * monospace element, and falls back to the Indonesian literal "Belum ada NIK"
 * when `patient.nik` is null or blank. PatientController::show() emits
 * `$patient->nik` unguarded and the TS type is `string | null`.
 *
 * Reaching that branch end-to-end requires a patient with a NULL NIK, which the
 * demo seeder never produces — hence `tests/e2e/support/seed-null-nik-patient.php`,
 * wired in as the fourth fixture by global-setup.ts.
 *
 * NOTE: no row id is hard-coded. The ids are resolved from the patient list by
 * name (`PatientsIndexPage.idForName`), which parses the "Detail" link href.
 */
test.describe('Regression: NIK "Belum ada NIK" fallback on /patients/{id}', () => {
    test('null-NIK patient shows the "Belum ada NIK" fallback', async ({ page }) => {
        await login(page, 'admin');

        const index = new PatientsIndexPage(page);
        await index.open();

        // Resolve the fixture patient's id from the searchable list, not from
        // an assumed row id.
        const id = await index.idForName('Pasien Tanpa NIK');

        const show = new PatientShowPage(page);
        await show.open(id);

        await expect(page.getByRole('main').getByText('Data Diri')).toBeVisible();
        await expect(page.getByText('Belum ada NIK')).toBeVisible();
    });

    test('patient WITH a NIK renders the NIK and NOT the fallback', async ({ page }) => {
        await login(page, 'admin');

        const index = new PatientsIndexPage(page);
        await index.open();

        // 'Pasien Contoh' is the seeded patient whose NIK is 3201234567890001
        // (DatabaseSeeder.php:74). The NIK is asserted only for shape
        // (16 digits in a monospace element) so this test is not coupled to
        // that literal value.
        const id = await index.idForName('Pasien Contoh');

        const show = new PatientShowPage(page);
        await show.open(id);

        await expect(page.getByRole('main').getByText('Data Diri')).toBeVisible();

        const nik = page.getByRole('main').locator('p.font-mono').first();
        await expect(nik).toBeVisible();
        await expect(nik).toHaveText(/^\d{16}$/);

        // The inverse assertion: the fallback must NOT appear for this patient.
        await expect(page.getByText('Belum ada NIK')).toHaveCount(0);
    });
});
