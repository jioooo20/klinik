import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Rebuilds the isolated `klinik_e2e` database and seeds demo + tenant fixtures.
 *
 * Laravel loads `.env.e2e` when `APP_ENV=e2e` is exported, so every artisan call
 * below is scoped to the E2E database and never touches the dev `klinik` DB.
 */
const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..', '..', '..');

function artisan(args: string[]): void {
    execFileSync('php', ['artisan', ...args], {
        cwd: root,
        stdio: 'inherit',
        env: { ...process.env, APP_ENV: 'e2e' },
    });
}

export default function globalSetup(): void {
    // Guard: refuse to run if APP_ENV was overridden to something destructive.
    if (process.env.APP_ENV && process.env.APP_ENV !== 'e2e') {
        throw new Error(`Refusing to run E2E with APP_ENV=${process.env.APP_ENV}`);
    }

    // Fresh schema + demo data (1 clinic, admin/dokter/pasien, patients, records).
    artisan(['migrate:fresh', '--seed', '--force']);

    // Second clinic used only by the multi-tenant isolation spec.
    execFileSync('php', [path.join(root, 'tests', 'e2e', 'support', 'seed-tenant.php')], {
        cwd: root,
        stdio: 'inherit',
        env: { ...process.env, APP_ENV: 'e2e' },
    });

    // A TODAY appointment with NO medical record, so the dokter dashboard's
    // "Antrean Hari Ini" table has an actionable row and the "Isi Rekam Medis"
    // button actually renders (every seeded appointment already has a record).
    execFileSync('php', [path.join(root, 'tests', 'e2e', 'support', 'seed-today-queue.php')], {
        cwd: root,
        stdio: 'inherit',
        env: { ...process.env, APP_ENV: 'e2e' },
    });

    // ONE patient with a NULL NIK, so the "Belum ada NIK" fallback on
    // /patients/{id} is reachable end-to-end (the demo seeder always sets a NIK).
    execFileSync('php', [path.join(root, 'tests', 'e2e', 'support', 'seed-null-nik-patient.php')], {
        cwd: root,
        stdio: 'inherit',
        env: { ...process.env, APP_ENV: 'e2e' },
    });
}