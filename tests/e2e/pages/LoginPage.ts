import { Locator, Page, expect } from '@playwright/test';

/** Page object for resources/js/Pages/Auth/Login.tsx and Register.tsx. */
export class LoginPage {
    constructor(private readonly page: Page) {}

    get email(): Locator {
        return this.page.getByLabel('Email');
    }

    get password(): Locator {
        return this.page.getByLabel('Kata Sandi');
    }

    get submit(): Locator {
        return this.page.getByRole('button', { name: 'Masuk' });
    }

    async open(): Promise<void> {
        await this.page.goto('/login');
        await expect(this.page.getByText('Masuk ke Klinik')).toBeVisible();
    }

    async fill(email: string, password: string): Promise<void> {
        await this.email.fill(email);
        await this.password.fill(password);
    }

    async submitForm(): Promise<void> {
        await this.submit.click();
    }
}

/** Page object for the public registration screen. */
export class RegisterPage {
    constructor(private readonly page: Page) {}

    async open(): Promise<void> {
        await this.page.goto('/register');
        await expect(this.page.getByText('Daftar Pasien')).toBeVisible();
    }

    async register(input: {
        name: string;
        email: string;
        phone?: string;
        password: string;
        confirmation: string;
    }): Promise<void> {
        await this.page.getByLabel('Nama Lengkap').fill(input.name);
        await this.page.getByLabel('Email').fill(input.email);
        if (input.phone) {
            await this.page.getByLabel('No. Telepon (opsional)').fill(input.phone);
        }
        await this.page.getByLabel('Kata Sandi', { exact: true }).fill(input.password);
        await this.page.getByLabel('Konfirmasi Kata Sandi').fill(input.confirmation);
        await this.page.getByRole('button', { name: 'Daftar' }).click();
    }
}