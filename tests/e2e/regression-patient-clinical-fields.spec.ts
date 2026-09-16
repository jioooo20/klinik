import { test, expect } from '@playwright/test';
import { login } from './support/auth';
import { PatientsIndexPage, PatientCreatePage, PatientEditPage } from './pages/PatientsPage';

/**
 * Regression coverage for the 2026-09-16 clinical fields on the ADMIN patient
 * forms (gap §7 row 4a / §8 of e2e-verification-2026-09-16.md).
 *
 * The four fields added to Patients/Create.tsx and Patients/Edit.tsx:
 *   - blood_type               (select, server rule `in:A,B,AB,O`)
 *   - allergies                (textarea)
 *   - emergency_contact_name   (input)
 *   - emergency_contact_phone  (input)
 *
 * This spec is intentionally SEPARATE from patients.spec.ts (KLK-020..022) so
 * that ticket-scoped suite is not widened. The page-object additions in
 * tests/e2e/pages/PatientsPage.ts are all-optional, so patients.spec.ts's
 * existing `create.fill({...})` call keeps compiling and passing unchanged.
 *
 * Server-side rejection of an out-of-range blood_type is covered by the PHP
 * feature suite (StorePatientRequest `in:A,B,AB,O`); it is NOT re-tested here
 * by DOM tampering.
 */
test.describe('Regression: admin patient clinical-field round-trip', () => {
    test('create form round-trips all four clinical fields', async ({ page }) => {
        await login(page, 'admin');

        const index = new PatientsIndexPage(page);
        await index.open();
        await index.addButton.click();
        await page.waitForURL(/\/patients\/create$/);

        const unique = Date.now().toString().slice(-4);
        const name = `E2E Klinis ${unique}`;

        const create = new PatientCreatePage(page);
        await create.fill({
            nik: `320123456788${unique}`,
            name,
            dateOfBirth: '1994-03-12',
            gender: 'female',
            bloodType: 'B',
            allergies: `Alergi penisilin ${unique}`,
            emergencyContactName: `Kontak Darurat ${unique}`,
            emergencyContactPhone: '081298765432',
        });
        await create.submit();

        // store() redirects to patients.show.
        await page.waitForURL(/\/patients\/\d+$/);

        const main = page.getByRole('main');
        await expect(main.getByText('Data Diri')).toBeVisible();
        await expect(main.getByText('B', { exact: true })).toBeVisible();
        await expect(main.getByText(`Alergi penisilin ${unique}`)).toBeVisible();
        await expect(main.getByText(`Kontak Darurat ${unique} (081298765432)`)).toBeVisible();
    });

    test('edit form pre-fills the four clinical fields and persists a change', async ({ page }) => {
        await login(page, 'admin');

        // Create the patient to edit so the test owns its own fixture and is
        // order-independent.
        const index = new PatientsIndexPage(page);
        await index.open();
        await index.addButton.click();
        await page.waitForURL(/\/patients\/create$/);

        const unique = Date.now().toString().slice(-4);
        const name = `E2E Klinis Edit ${unique}`;

        const create = new PatientCreatePage(page);
        await create.fill({
            nik: `320123456787${unique}`,
            name,
            dateOfBirth: '1991-07-07',
            gender: 'male',
            bloodType: 'A',
            allergies: `Alergi debu ${unique}`,
            emergencyContactName: `Kontak ${unique}`,
            emergencyContactPhone: '081200001111',
        });
        await create.submit();
        await page.waitForURL(/\/patients\/\d+$/);

        // Resolve the id from the URL we landed on (no hard-coded row id).
        const id = Number(page.url().match(/\/patients\/(\d+)/)?.[1]);
        expect(Number.isInteger(id)).toBe(true);

        const edit = new PatientEditPage(page);
        await edit.open(id);

        // PRE-FILL: every clinical control reflects what the create form sent.
        await expect(page.locator('#blood_type')).toHaveValue('A');
        await expect(page.locator('#allergies')).toHaveValue(`Alergi debu ${unique}`);
        await expect(page.locator('#emergency_contact_name')).toHaveValue(`Kontak ${unique}`);
        await expect(page.locator('#emergency_contact_phone')).toHaveValue('081200001111');

        // ROUND-TRIP: change blood type to a different allowed value.
        await edit.setBloodType('AB');
        await edit.submit();
        await page.waitForURL(/\/patients\/\d+$/);

        // Persisted on the detail page.
        await expect(page.getByRole('main').getByText('AB', { exact: true })).toBeVisible();

        // And still persisted after a fresh server read.
        await page.reload();
        await expect(page.getByRole('main').getByText('AB', { exact: true })).toBeVisible();
    });

    test('blood-type select offers exactly the empty placeholder plus A, B, AB, O', async ({ page }) => {
        await login(page, 'admin');

        // Any edit screen carries the select. Reuse the seeded 'Pasien Contoh'.
        const index = new PatientsIndexPage(page);
        await index.open();
        const id = await index.idForName('Pasien Contoh');

        const edit = new PatientEditPage(page);
        await edit.open(id);

        const values = await edit.bloodTypeOptionValues();

        // Mirrors StorePatientRequest's `in:A,B,AB,O` rule — catches silent drift
        // in either the select options or the server rule.
        expect(values).toEqual(['', 'A', 'B', 'AB', 'O']);
    });
});
