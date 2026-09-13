import { Locator, Page, expect } from '@playwright/test';

/** Page objects for the Phase 6 appointment screens. */
export class AppointmentsIndexPage {
    constructor(private readonly page: Page) {}

    async open(): Promise<void> {
        await this.page.goto('/appointments');
        // Role-aware card title: pasien "Janji Temu Saya", dokter "Antrean Hari Ini",
        // admin "Semua Janji Temu". Scoped to <main> and anchored so the sidebar
        // link and the "Buat Janji Temu" button do not create a strict-mode clash.
        await expect(
            this.page
                .getByRole('main')
                .getByText(/^(Janji Temu Saya|Antrean Hari Ini|Semua Janji Temu)$/),
        ).toBeVisible();
    }

    get createButton(): Locator {
        return this.page.getByRole('button', { name: 'Buat Janji Temu' });
    }

    /** Selects the first available "Ubah status..." dropdown and picks a status. */
    async changeFirstStatusTo(status: string): Promise<void> {
        const select = this.page.locator('select').first();
        await select.selectOption(status);
    }
}

export class AppointmentCreatePage {
    constructor(private readonly page: Page) {}

    async open(): Promise<void> {
        await this.page.goto('/appointments/create');
        // Card title is unique inside <main>; sidebar link also contains the same text.
        await expect(
            this.page.getByRole('main').getByText('Buat Janji Temu'),
        ).toBeVisible();
    }

    /** Picks the first doctor, a date, and the first non-disabled slot, then submits. */
    async bookFirstAvailable(dateOffsetDays = 3): Promise<void> {
        const doctorSelect = this.page.locator('#doctor_id');
        const options = await doctorSelect.locator('option').all();
        // Option 0 is the placeholder.
        const doctorValue = await options[1].getAttribute('value');
        await doctorSelect.selectOption(doctorValue!);

        const date = new Date();
        date.setDate(date.getDate() + dateOffsetDays);
        const iso = date.toISOString().slice(0, 10);
        await this.page.locator('#date').fill(iso);

        const slot = this.page
            .locator('button:not([disabled])')
            .filter({ hasText: /^\d{2}:00$/ })
            .first();
        await expect(slot).toBeVisible();
        await slot.click();

        await this.page.getByRole('button', { name: 'Simpan' }).click();
    }
}