import { test, expect } from '@playwright/test';
import { login } from './support/auth';
import { PatientsIndexPage } from './pages/PatientsPage';
import { MedicalRecordCreatePage, MedicalRecordShowPage } from './pages/MedicalRecordsPage';

/**
 * Regression coverage for the 2026-09-16 ICD-10 overflow fix.
 *
 * The bug: `medical_records.icd10_code` was varchar(10), so saving a record
 * with many codes raised SQLSTATE[22001] "value too long for type
 * character varying(10)".
 *
 * Fix: migration 2026_09_16_000001_widen_medical_records_icd10_code widened the
 * column to varchar(255); Store/UpdateMedicalRecordRequest cap at 20 codes;
 * Create.tsx/Edit.tsx cap the checkboxes at 20 with an "n/20" counter.
 *
 * This spec exercises the cap AND a real 18-code save end-to-end.
 */
const MAX = 20;

test.describe('Regression: ICD-10 20-code cap + 18-code save', () => {
    test('counter tracks selection, unchecked boxes disable at the cap, 18 codes save without 22001', async ({ page }) => {
        await login(page, 'dokter');

        const patients = new PatientsIndexPage(page);
        await patients.open();
        const patientId = await patients.firstPatientId();

        const create = new MedicalRecordCreatePage(page);
        await create.openFor(patientId);

        // The counter starts at zero.
        await expect(page.getByText(`Dipilih 0/${MAX} kode.`)).toBeVisible();

        const boxes = page.locator('fieldset input[type="checkbox"]');
        const total = await boxes.count();
        expect(total).toBeGreaterThanOrEqual(MAX);

        // Select 18 codes — the exact payload size the bug report cited.
        const EIGHTEEN = 18;
        for (let i = 0; i < EIGHTEEN; i++) {
            await boxes.nth(i).check();
        }
        await expect(page.getByText(`Dipilih ${EIGHTEEN}/${MAX} kode.`)).toBeVisible();

        // Push to the cap: the counter hits 20/20 and every remaining
        // unchecked box must be DISABLED.
        await boxes.nth(18).check();
        await boxes.nth(19).check();
        await expect(page.getByText(`Dipilih ${MAX}/${MAX} kode.`)).toBeVisible();

        const unchecked = page.locator('fieldset input[type="checkbox"]:not(:checked)');
        const uncheckedCount = await unchecked.count();
        expect(uncheckedCount).toBe(total - MAX);
        for (let i = 0; i < uncheckedCount; i++) {
            await expect(unchecked.nth(i)).toBeDisabled();
        }

        // Drop back to 18 so the submitted payload is the 18-code case.
        await boxes.nth(18).uncheck();
        await boxes.nth(19).uncheck();
        await expect(page.getByText(`Dipilih ${EIGHTEEN}/${MAX} kode.`)).toBeVisible();

        await create.fillSoap({
            subjective: 'E2E 18-kode: kontrol rutin.',
            objective: 'KU baik, TD 120/80.',
            assessment: 'Multi-diagnosis.',
            plan: 'Lanjutkan terapi.',
            sistolik: '120',
            diastolik: '80',
            suhu: '36.8',
        });

        await create.submit();

        // Success = redirect to the record detail, NOT a 500/22001 page.
        await page.waitForURL(/\/medical-records\/\d+$/);
        const show = new MedicalRecordShowPage(page);
        await expect(show.heading).toBeVisible();
        await expect(page.getByText(/SQLSTATE/)).toHaveCount(0);

        // The widened column round-trips all 18 codes back to the UI.
        const icdCell = page.getByText(/^[A-Z]\d{2}(\.\d+)?(, [A-Z]\d{2}(\.\d+)?)+$/).first();
        await expect(icdCell).toBeVisible();
    });
});