import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEvent } from 'react';

import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import AdminLayout from '@/Layouts/AdminLayout';

interface PatientForm {
    id: number;
    nik: string;
    name: string;
    date_of_birth: string | null;
    gender: string | null;
    phone: string | null;
    address: string | null;
}

interface EditProps {
    patient: PatientForm;
}

export default function Edit({ patient }: EditProps) {
    const { data, setData, put, processing, errors } = useForm({
        id: patient.id,
        nik: patient.nik,
        name: patient.name,
        date_of_birth: patient.date_of_birth ?? '',
        gender: patient.gender ?? '',
        phone: patient.phone ?? '',
        address: patient.address ?? '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(route('patients.update', patient.id));
    };

    return (
        <AdminLayout>
            <Head title="Edit Pasien" />
            <Card className="mx-auto max-w-2xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Edit Data Pasien</CardTitle>
                        <Link href={route('patients.show', patient.id)}>
                            <Button variant="outline" size="sm">Kembali</Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="nik">NIK</Label>
                            <Input
                                id="nik"
                                value={data.nik}
                                onChange={(e) => setData('nik', e.target.value)}
                                aria-invalid={!!errors.nik}
                                maxLength={16}
                            />
                            {errors.nik && <p className="text-sm text-red-500">{errors.nik}</p>}
                        </div>

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
                            <Label htmlFor="date_of_birth">Tanggal Lahir</Label>
                            <Input
                                id="date_of_birth"
                                type="date"
                                value={data.date_of_birth}
                                onChange={(e) => setData('date_of_birth', e.target.value)}
                                aria-invalid={!!errors.date_of_birth}
                            />
                            {errors.date_of_birth && <p className="text-sm text-red-500">{errors.date_of_birth}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="gender">Jenis Kelamin</Label>
                            <select
                                id="gender"
                                value={data.gender}
                                onChange={(e) => setData('gender', e.target.value)}
                                className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
                                aria-invalid={!!errors.gender}
                            >
                                <option value="">Pilih...</option>
                                <option value="male">Laki-laki</option>
                                <option value="female">Perempuan</option>
                            </select>
                            {errors.gender && <p className="text-sm text-red-500">{errors.gender}</p>}
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
                            <Label htmlFor="address">Alamat</Label>
                            <textarea
                                id="address"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                rows={3}
                                className="border-input flex w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                            />
                            {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" disabled={processing}>Simpan Perubahan</Button>
                            <Link href={route('patients.show', patient.id)}>
                                <Button variant="ghost" type="button">Batal</Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AdminLayout>
    );
}