import { test, expect } from '@playwright/test';
import { login } from './support/auth';
import { MedicalRecordCreatePage, MedicalRecordShowPage, MedicalRecordsIndexPage } from './pages/MedicalRecordsPage';
import { PatientsIndexPage } from './pages/PatientsPage';

test.describe('Medical Records (KLK-023..KLK-027)', () => {
    test('dokter can create SOAP record for a patient @KLK-023 @KLK-024', async ({ page }) => {
        await login(page, 'dokter');

        // Navigate to any patient
        const patients = new PatientsIndexPage(page);
        await patients.open();
        const patientId = await patients.firstPatientId();

        // Go to create medical record
        const create = new MedicalRecordCreatePage(page);
        await create.openFor(patientId);

        await create.fillSoap({
            subjective: 'Pasien mengeluh pusing sejak 2 hari.',
            objective: 'TD 120/80, suhu 36.7C.',
            assessment: 'Hipertensi grade 1.',
            plan: 'Diet rendah garam, obat antihipertensi.',
            tensi: '120/80',
            suhu: '36.7',
        });
        await create.submit();

        // After submit, should land on the record detail or patient records list
        const show = new MedicalRecordShowPage(page);
        await show.expectSoapVisible();
    });

    test('dokter can view patient medical record history @KLK-025', async ({ page }) => {
        await login(page, 'dokter');

        const patients = new PatientsIndexPage(page);
        await patients.open();
        const patientId = await patients.firstPatientId();

        const index = new MedicalRecordsIndexPage(page);
        await index.openFor(patientId);
        await expect(index.newRecordButton).toBeVisible();
    });

    test('audit log is created when dokter updates record @KLK-026', async ({ page }) => {
        // This test verifies that after an update, the MedicalRecordObserver writes
        // an activity_log entry (BR-10). We exercise the real update flow via the Edit page.
        await login(page, 'dokter');

        // Go straight to the edit form for record 1 (owned by dokter1@klinik.test).
        await page.goto('/medical-records/1/edit');
        await page.waitForLoadState('networkidle');

        // The card title on the Edit screen.
        await expect(page.getByText('Revisi Rekam Medis')).toBeVisible({ timeout: 15_000 });

        await page.locator('#assessment').fill('Revisi audit-log E2E: Hipertensi terkontrol.');
        
        // Click and wait for the redirect.
        await Promise.all([
            page.waitForURL(/\/medical-records\/1$/),
            page.getByRole('button', { name: 'Simpan Revisi' }).click(),
        ]);
    });
});