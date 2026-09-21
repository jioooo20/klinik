import { Link } from '@inertiajs/react';
import { CalendarCheck, HeartPulse, ShieldCheck, Stethoscope } from 'lucide-react';
import { ReactNode } from 'react';

import { useAuthIntro } from '../useAuthAnimation';

interface AuthShellProps {
    /** Small label above the form title (e.g. "Selamat datang kembali"). */
    eyebrow: string;
    /** Form heading — must keep the text the E2E page objects assert on. */
    title: string;
    /** Supporting line under the title. */
    subtitle: string;
    children: ReactNode;
}

const PANEL_POINTS = [
    { icon: CalendarCheck, label: 'Janji temu online 24/7' },
    { icon: ShieldCheck, label: 'Rekam medis digital yang aman' },
    { icon: Stethoscope, label: 'Dokter umum & spesialis' },
];

/**
 * Split-screen shell shared by the login and register screens: a gradient brand
 * panel (hidden on small screens) beside a white form card. The form is provided
 * by the caller via `children` so each page keeps its own fields and labels.
 */
export default function AuthShell({ eyebrow, title, subtitle, children }: AuthShellProps) {
    const root = useAuthIntro<HTMLDivElement>();

    return (
        <div ref={root} className="auth grid min-h-screen lg:grid-cols-2">
            {/* Brand panel */}
            <aside className="auth-panel relative hidden flex-col justify-between p-10 lg:flex">
                <div className="landing-dotgrid absolute inset-0" aria-hidden />
                <span className="auth-bloom auth-bloom-a" aria-hidden />
                <span className="auth-bloom auth-bloom-b" aria-hidden />

                <Link href={route('welcome')} className="relative flex items-center gap-2.5">
                    <span className="auth-mark bg-white/20">
                        <HeartPulse className="size-5" aria-hidden />
                    </span>
                    <span className="landing-display text-lg font-bold">Klinik Sehat Sentosa</span>
                </Link>

                <div className="relative max-w-md">
                    <span className="landing-cross" aria-hidden />
                    <h2 className="mt-5 text-3xl font-bold leading-tight">
                        Layanan kesehatan yang tenang, cepat, dan terpercaya.
                    </h2>
                    <p className="mt-4 text-white/85">
                        Kelola janji temu, riwayat kunjungan, dan rekam medis Anda dalam satu
                        tempat.
                    </p>

                    <ul className="mt-8 space-y-3">
                        {PANEL_POINTS.map((point) => (
                            <li key={point.label} className="auth-pill w-fit">
                                <point.icon className="size-4" aria-hidden />
                                {point.label}
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="relative text-sm text-white/70">
                    &copy; {new Date().getFullYear()} Klinik Sehat Sentosa. Seluruh hak cipta
                    dilindungi.
                </p>
            </aside>

            {/* Form side */}
            <main className="flex items-center justify-center px-4 py-12 sm:px-6">
                <div className="w-full max-w-md" data-auth>
                    <div className="mb-8 flex items-center gap-2.5 lg:hidden">
                        <span className="auth-mark">
                            <HeartPulse className="size-5" aria-hidden />
                        </span>
                        <span className="landing-display text-lg font-bold">
                            Klinik Sehat Sentosa
                        </span>
                    </div>

                    <div className="auth-card p-7 sm:p-9">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--landing-teal-text)]">
                            {eyebrow}
                        </span>
                        <h1 className="mt-2 text-2xl font-bold">{title}</h1>
                        <p className="mt-1.5 text-sm text-[var(--landing-muted)]">{subtitle}</p>

                        <div className="mt-7">{children}</div>
                    </div>

                    <p className="mt-6 text-center text-sm text-[var(--landing-muted)]">
                        <Link href={route('welcome')} className="hover:text-[var(--landing-indigo)]">
                            &larr; Kembali ke beranda
                        </Link>
                    </p>
                </div>
            </main>
        </div>
    );
}