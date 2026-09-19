import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        specialty: '',
        str_number: '',
        is_active: true,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        // Kirim boolean eksplisit agar checkbox yang tidak dicentang tetap
        // mengirim is_active=false (checkbox HTML tidak submit saat unchecked).
        post(route('doctors.store'));
    };

    return (
        <AdminLayout>
            <Head title="Tambah Dokter" />
            <Card className="mx-auto max-w-2xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Tambah Dokter Baru</CardTitle>
                        <Link href={route('doctors.index')}>
                            <Button variant="outline" size="sm">Kembali</Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nama Lengkap</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                aria-invalid={!!errors.name}
                            />
                            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                aria-invalid={!!errors.email}
                            />
                            {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Telepon</Label>
                            <Input
                                id="phone"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                aria-invalid={!!errors.phone}
                            />
                            {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Kata Sandi</Label>
                            <Input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                aria-invalid={!!errors.password}
                            />
                            {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password_confirmation">Konfirmasi Kata Sandi</Label>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                aria-invalid={!!errors.password_confirmation}
                            />
                            {errors.password_confirmation && (
                                <p className="text-sm text-red-500">{errors.password_confirmation}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="specialty">Spesialisasi</Label>
                            <Input
                                id="specialty"
                                value={data.specialty}
                                onChange={(e) => setData('specialty', e.target.value)}
                                aria-invalid={!!errors.specialty}
                            />
                            {errors.specialty && <p className="text-sm text-red-500">{errors.specialty}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="str_number">No. STR</Label>
                            <Input
                                id="str_number"
                                value={data.str_number}
                                onChange={(e) => setData('str_number', e.target.value)}
                                aria-invalid={!!errors.str_number}
                            />
                            {errors.str_number && <p className="text-sm text-red-500">{errors.str_number}</p>}
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                id="is_active"
                                type="checkbox"
                                checked={data.is_active}
                                onChange={(e) => setData('is_active', e.target.checked)}
                                className="h-4 w-4 rounded border-input"
                            />
                            <Label htmlFor="is_active">Aktif</Label>
                            {errors.is_active && <p className="text-sm text-red-500">{errors.is_active}</p>}
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" disabled={processing}>Simpan</Button>
                            <Link href={route('doctors.index')}>
                                <Button variant="ghost" type="button">Batal</Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}
