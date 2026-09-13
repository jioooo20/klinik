import { Page, expect } from '@playwright/test';

/** Demo accounts created by DatabaseSeeder (password is the same for all). */
export const USERS = {
    admin: { email: 'admin@klinik.test', password: 'password' },
    dokter: { email: 'dokter1@klinik.test', password: 'password' },
    pasien: { email: 'pasien@klinik.test', password: 'password' },
    adminB: { email: 'admin.b@klinik.test', password: 'password' },
    dokterB: { email: 'dokter.b@klinik.test', password: 'password' },
} as const;

export type Role = 'admin' | 'dokter' | 'pasien' | 'adminB' | 'dokterB';

const DASHBOARD: Record<Role, string> = {
    admin: '/dashboard/admin',
    dokter: '/dashboard/doctor',
    pasien: '/dashboard/patient',
    // Clinic B accounts share the same role dashboards as clinic A.
    adminB: '/dashboard/admin',
    dokterB: '/dashboard/doctor',
};

/** Opens /login, fills credentials and submits; waits for the role dashboard. */
export async function login(page: Page, role: Role): Promise<void> {
    const user = USERS[role];

    await page.goto('/login');
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Kata Sandi').fill(user.password);
    await page.getByRole('button', { name: 'Masuk' }).click();

    await page.waitForURL(new RegExp(`${DASHBOARD[role]}$`));
    await expect(page).toHaveURL(new RegExp(`${DASHBOARD[role]}$`));
}

/** Logs in with arbitrary credentials without asserting the destination. */
export async function attemptLogin(
    page: Page,
    email: string,
    password: string,
): Promise<void> {
    await page.goto('/login');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Kata Sandi').fill(password);
    await page.getByRole('button', { name: 'Masuk' }).click();
}

/** Clicks the "Keluar" (logout) button in the role layout header. Uses .last() to handle nested wrapper buttons. */
export async function logout(page: Page): Promise<void> {
    await page.getByRole('button', { name: 'Keluar' }).last().click();
    await page.waitForURL(/\/login$/);
}