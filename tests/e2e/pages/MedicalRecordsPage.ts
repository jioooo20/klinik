import { Locator, Page, expect } from '@playwright/test';

/** Page objects for the Phase 5 medical record (SOAP) screens. */
export class MedicalRecordCreatePage {
    constructor(private readonly page: Page) {}

    async openFor(patientId: number): Promise<void> {
        await this.page.goto(`/patients/${patientId}/records/create`);
        await expect(this.page.getByText('Rekam Medis Baru')).toBeVisible();
    }

    async fillSoap(input: {
        subjective: string;
        objective: string;
        assessment: string;
        plan: string;
        tensi?: string;
        suhu?: string;
    }): Promise<void> {
        await this.page.locator('#subjective').fill(input.subjective);
        await this.page.locator('#objective').fill(input.objective);
        await this.page.locator('#assessment').fill(input.assessment);
        await this.page.locator('#plan').fill(input.plan);

        if (input.tensi) {
            await this.page.locator('#vital-tensi').fill(input.tensi);
        }
        if (input.suhu) {
            await this.page.locator('#vital-suhu').fill(input.suhu);
        }
    }

    async submit(): Promise<void> {
        await this.page.getByRole('button', { name: 'Simpan Rekam Medis' }).click();
    }
}

export class MedicalRecordShowPage {
    constructor(private readonly page: Page) {}

    get heading(): Locator {
        // The detail page shows "Detail Rekam Medis" as h1.
        return this.page.getByRole('heading', { name: 'Detail Rekam Medis' });
    }

    async expectSoapVisible(): Promise<void> {
        // Wait for the page to stabilize and ensure React has hydrated.
        await this.page.waitForLoadState('networkidle');
        await this.page.waitForTimeout(2000);
        
        // Verify SOAP sections exist. Use regex to be resilient to minor formatting changes.
        await expect(this.page.getByText(/Subjective \(S\)/)).toBeVisible({ timeout: 10000 });
        await expect(this.page.getByText(/Objective \(O\)/)).toBeVisible();
        await expect(this.page.getByText(/Assessment \(A\)/)).toBeVisible();
        await expect(this.page.getByText(/Plan \(P\)/)).toBeVisible();
    }
}

export class MedicalRecordsIndexPage {
    constructor(private readonly page: Page) {}

    async openFor(patientId: number): Promise<void> {
        await this.page.goto(`/patients/${patientId}/records`);
        await expect(this.page.getByText('Riwayat Rekam Medis')).toBeVisible();
    }

    get newRecordButton(): Locator {
        return this.page.getByRole('button', { name: 'Rekam Medis Baru' });
    }
}