import { Locator, Page, expect } from '@playwright/test';

/** Page objects for the Phase 4 patient management screens (KLK-020..022). */
export class PatientsIndexPage {
    constructor(private readonly page: Page) {}

    async open(): Promise<void> {
        await this.page.goto('/patients');
        await expect(this.page.getByText('Daftar Pasien')).toBeVisible();
    }

    get search(): Locator {
        return this.page.getByPlaceholder('Cari nama atau NIK...');
    }

    get addButton(): Locator {
        return this.page.getByRole('button', { name: 'Tambah Pasien' });
    }

    async searchFor(term: string): Promise<void> {
        await this.search.fill(term);
        await this.page.getByRole('button', { name: 'Cari' }).click();
    }

    row(name: string): Locator {
        return this.page.getByRole('row', { name: new RegExp(name) });
    }

    /** Returns the numeric patient id of the first "Detail" link on the page (works from index or show). */
    async firstPatientId(): Promise<number> {
        // After creating a patient, we may be redirected to the detail page.
        // On the detail page, the "Kembali" link points back to /patients with the list.
        // Try to find a "Detail" link in any table row; if none, extract from current URL if on detail page.
        const detailLink = this.page.getByRole('link', { name: 'Detail' }).first();
        const count = await detailLink.count();
        if (count > 0) {
            const href = await detailLink.getAttribute('href');
            const match = href?.match(/\/patients\/(\d+)/);
            if (match) {
                return Number(match[1]);
            }
        }

        // Fallback: if we're already on a detail page (/patients/:id), extract from URL.
        const url = this.page.url();
        const urlMatch = url.match(/\/patients\/(\d+)/);
        if (urlMatch) {
            return Number(urlMatch[1]);
        }

        throw new Error(`Could not determine patient id from page`);
    }
}

export class PatientCreatePage {
    constructor(private readonly page: Page) {}

    async open(): Promise<void> {
        await this.page.goto('/patients/create');
        await expect(this.page.getByText('Tambah Pasien Baru')).toBeVisible();
    }

    async fill(input: {
        nik: string;
        name: string;
        dateOfBirth: string;
        gender: 'male' | 'female';
        phone?: string;
        address?: string;
    }): Promise<void> {
        await this.page.locator('#nik').fill(input.nik);
        await this.page.locator('#name').fill(input.name);
        await this.page.locator('#date_of_birth').fill(input.dateOfBirth);
        await this.page.locator('#gender').selectOption(input.gender);
        if (input.phone) {
            await this.page.locator('#phone').fill(input.phone);
        }
        if (input.address) {
            await this.page.locator('#address').fill(input.address);
        }
    }

    async submit(): Promise<void> {
        await this.page.getByRole('button', { name: 'Simpan' }).click();
    }
}

export class PatientShowPage {
    constructor(private readonly page: Page) {}

    async open(id: number): Promise<void> {
        await this.page.goto(`/patients/${id}`);
    }

    async expectProfileVisible(): Promise<void> {
        await expect(this.page.getByText('Data Diri')).toBeVisible();
        await expect(this.page.getByText('Riwayat Kunjungan')).toBeVisible();
        // "Janji Temu" is a section label (plain text), not a heading. Scope to <main> and use regex to avoid strict-mode clashes with sidebar/cell text.
        await expect(
            this.page.getByRole('main').getByText(/^Janji Temu$/),
        ).toBeVisible();
    }
}