import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';

import AuthShell from './partials/AuthShell';

import './auth.css';

interface LoginProps {
    status?: string;
}

export default function Login({ status }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Masuk" />
            <AuthShell
                eyebrow="Selamat datang kembali"
                title="Masuk ke Klinik"
                subtitle="Gunakan email dan kata sandi akun Anda."
            >
                {status && (
                    <div
                        role="status"
                        className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
                    >
                        {status}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            autoComplete="username"
                            autoFocus
                            placeholder="nama@email.com"
                            onChange={(e) => setData('email', e.target.value)}
                            aria-invalid={!!errors.email}
                        />
                        {errors.email && (
                            <p className="text-destructive text-sm">{errors.email}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Kata Sandi</Label>
                        <Input
                            id="password"
                            type="password"
                            value={data.password}
                            autoComplete="current-password"
                            placeholder="••••••••"
                            onChange={(e) => setData('password', e.target.value)}
                            aria-invalid={!!errors.password}
                        />
                        {errors.password && (
                            <p className="text-destructive text-sm">{errors.password}</p>
                        )}
                    </div>

                    <label className="flex items-center gap-2 text-sm text-[var(--landing-muted)]">
                        <input
                            type="checkbox"
                            className="size-4 rounded border-[var(--landing-line)] accent-[var(--landing-indigo)]"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                        />
                        Ingat saya
                    </label>

                    <Button
                        type="submit"
                        size="lg"
                        className="w-full rounded-full"
                        disabled={processing}
                    >
                        {processing ? 'Memproses…' : 'Masuk'}
                    </Button>

                    <p className="text-center text-sm text-[var(--landing-muted)]">
                        Belum punya akun?{' '}
                        <Link
                            href={route('register')}
                            className="font-semibold text-[var(--landing-indigo)] hover:underline"
                        >
                            Daftar sebagai pasien
                        </Link>
                    </p>
                </form>
            </AuthShell>
        </>
    );
}