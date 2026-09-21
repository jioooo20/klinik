import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';

import AuthShell from './partials/AuthShell';

import './auth.css';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Daftar" />
            <AuthShell
                eyebrow="Akun pasien baru"
                title="Daftar Pasien"
                subtitle="Buat akun untuk memesan janji temu dan melihat riwayat berobat."
            >
                <form onSubmit={submit} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nama Lengkap</Label>
                        <Input
                            id="name"
                            value={data.name}
                            autoComplete="name"
                            autoFocus
                            placeholder="Nama sesuai identitas"
                            onChange={(e) => setData('name', e.target.value)}
                            aria-invalid={!!errors.name}
                        />
                        {errors.name && (
                            <p className="text-destructive text-sm">{errors.name}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={data.email}
                            autoComplete="email"
                            placeholder="nama@email.com"
                            onChange={(e) => setData('email', e.target.value)}
                            aria-invalid={!!errors.email}
                        />
                        {errors.email && (
                            <p className="text-destructive text-sm">{errors.email}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">No. Telepon (opsional)</Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={data.phone}
                            autoComplete="tel"
                            placeholder="08xx xxxx xxxx"
                            onChange={(e) => setData('phone', e.target.value)}
                            aria-invalid={!!errors.phone}
                        />
                        {errors.phone && (
                            <p className="text-destructive text-sm">{errors.phone}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Kata Sandi</Label>
                        <Input
                            id="password"
                            type="password"
                            value={data.password}
                            autoComplete="new-password"
                            placeholder="••••••••"
                            onChange={(e) => setData('password', e.target.value)}
                            aria-invalid={!!errors.password}
                        />
                        {errors.password && (
                            <p className="text-destructive text-sm">{errors.password}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password_confirmation">Konfirmasi Kata Sandi</Label>
                        <Input
                            id="password_confirmation"
                            type="password"
                            value={data.password_confirmation}
                            autoComplete="new-password"
                            placeholder="••••••••"
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                        />
                    </div>

                    <Button
                        type="submit"
                        size="lg"
                        className="w-full rounded-full"
                        disabled={processing}
                    >
                        {processing ? 'Memproses…' : 'Daftar'}
                    </Button>

                    <p className="text-center text-sm text-[var(--landing-muted)]">
                        Sudah punya akun?{' '}
                        <Link
                            href={route('login')}
                            className="font-semibold text-[var(--landing-indigo)] hover:underline"
                        >
                            Masuk
                        </Link>
                    </p>
                </form>
            </AuthShell>
        </>
    );
}