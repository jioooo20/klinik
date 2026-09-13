import { test, expect } from '@playwright/test';
import { login } from './support/auth';
import { PatientsIndexPage, PatientCreatePage, PatientShowPage } from './pages/PatientsPage';

test.describe('Patient Management (KLK-019..KLK-022)', () => {
    test('admin can create patient and view detail @KLK-020 @KLK-021 @KLK-022', async ({ page }) => {
        await login(page, 'admin');

        const index = new PatientsIndexPage(page);
        await index.open();

        // Search works (KLK-020)
        await index.searchFor('Pasien Contoh');
        await expect(index.row('Pasien Contoh')).toBeVisible();

        // Create new patient (KLK-021)
        await index.addButton.click();
        // Wait for navigation to the create page before asserting copy.
        await page.waitForURL(/\/patients\/create$/);
        const create = new PatientCreatePage(page);
        await expect(create['page'].getByText('Tambah Pasien Baru')).toBeVisible();

        const unique = Date.now().toString().slice(-4);
        await create.fill({
            nik: `320123456789${unique}`,
            name: `E2E Patient ${unique}`,
            dateOfBirth: '1995-06-15',
            gender: 'male',
            phone: '081234567890',
            address: 'Jl. E2E No. 1',
        });
        await create.submit();

        // After submit we should be back on the index with a success flash or the new row.
        await expect(page.getByText(`E2E Patient ${unique}`)).toBeVisible();

        // Open detail (KLK-022)
        const show = new PatientShowPage(page);
        const id = await index.firstPatientId();
        await show.open(id);
        await show.expectProfileVisible();
    });

    test('dokter can search patients but cannot see create button @KLK-020', async ({ page }) => {
        await login(page, 'dokter');
        const index = new PatientsIndexPage(page);
        await index.open();

        await index.searchFor('Contoh');
        await expect(index.row('Pasien Contoh')).toBeVisible();

        // Dokter should not have "Tambah Pasien" button
        await expect(index.addButton).not.toBeVisible();
    });
});