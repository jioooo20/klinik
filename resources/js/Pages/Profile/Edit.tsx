import { Head, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import PatientLayout from '@/Layouts/PatientLayout';

/**
 * Profil Saya — pasien self-service.
 *
 * Hanya field non-master yang dapat diubah sendiri (golongan darah, alergi,
 * telepon, alamat, kontak darurat). NIK / nama / tanggal lahir / jenis kelamin
 * ditampilkan read-only karena dikendalikan admin.
 */
interface ProfileProps {
    patient: {
        id: number;
        nik: string | null;
        name: string;
        blood_type: string | null;
        allergies: string | null;
        phone: string | null;
        address: string | null;
        emergency_contact_name: string | null;
        emergency_contact_phone: string | null;
    };
}

export default function Edit({ patient }: ProfileProps) {
    const { data, setData, put, processing, errors } = useForm({
        blood_type: patient.blood_type ?? '',
        allergies: patient.allergies ?? '',
        phone: patient.phone ?? '',
        address: patient.address ?? '',
        emergency_contact_name: patient.emergency_contact_name ?? '',
        emergency_contact_phone: patient.emergency_contact_phone ?? '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(route('profile.update'));
    };

    return (
        <PatientLayout>
            <Head title="Profil Saya" />
            <Card className="mx-auto max-w-2xl">
                <CardHeader>
                    <CardTitle>Profil Saya</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4 space-y-1 rounded-md bg-slate-50 p-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Nama</span>
                            <span className="font-medium text-slate-800">{patient.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">NIK</span>
                            <span className="font-mono font-medium text-slate-800">
                                {patient.nik && patient.nik.trim() !== '' ? patient.nik : 'Belum ada NIK'}
                            </span>
                        </div>
                        <p className="pt-1 text-xs text-muted-foreground">
                            Nama dan NIK hanya dapat diubah oleh admin klinik.
                        </p>
                    </div>

                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="blood_type">Golongan Darah</Label>
                            <select
                                id="blood_type"
                                value={data.blood_type}
                                onChange={(e) => setData('blood_type', e.target.value)}
                                className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
                                aria-invalid={!!errors.blood_type}
                            >
                                <option value="">Pilih...</option>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="AB">AB</option>
                                <option value="O">O</option>
                            </select>
                            {errors.blood_type && <p className="text-sm text-red-500">{errors.blood_type}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="allergies">Alergi</Label>
                            <textarea
                                id="allergies"
                                value={data.allergies}
                                onChange={(e) => setData('allergies', e.target.value)}
                                rows={2}
                                className="border-input flex w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                                aria-invalid={!!errors.allergies}
                            />
                            {errors.allergies && <p className="text-sm text-red-500">{errors.allergies}</p>}
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
                                aria-invalid={!!errors.address}
                            />
                            {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="emergency_contact_name">Nama Kontak Darurat</Label>
                            <Input
                                id="emergency_contact_name"
                                value={data.emergency_contact_name}
                                onChange={(e) => setData('emergency_contact_name', e.target.value)}
                                aria-invalid={!!errors.emergency_contact_name}
                            />
                            {errors.emergency_contact_name && (
                                <p className="text-sm text-red-500">{errors.emergency_contact_name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="emergency_contact_phone">Telepon Kontak Darurat</Label>
                            <Input
                                id="emergency_contact_phone"
                                value={data.emergency_contact_phone}
                                onChange={(e) => setData('emergency_contact_phone', e.target.value)}
                                aria-invalid={!!errors.emergency_contact_phone}
                            />
                            {errors.emergency_contact_phone && (
                                <p className="text-sm text-red-500">{errors.emergency_contact_phone}</p>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" disabled={processing}>Simpan Perubahan</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </PatientLayout>
    );
}