import { Head, Link, usePage } from '@inertiajs/react';

import { Button } from '@/Components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import PatientsLayout from '@/Pages/Patients/_Layout';

interface Patient {
    id: number;
    nik: string;
    name: string;
    date_of_birth: string | null;
    gender: string;
    blood_type: string | null;
    allergies: string | null;
    phone: string | null;
    address: string | null;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
}

interface AppointmentRow {
    id: number;
    scheduled_at: string | null;
    status: string;
    queue_number: number | null;
    complaint: string | null;
    doctor: string | null;
}

interface RecordRow {
    id: number;
    visited_at: string | null;
    icd10_code: string | null;
    assessment: string | null;
    doctor: string | null;
}

interface ShowProps {
    patient: Patient;
    appointments: AppointmentRow[];
    medicalRecords: RecordRow[];
}

interface SharedProps {
    auth: {
        roles: string[];
    };
}

function formatDate(value: string | null): string {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('id-ID');
}

export default function Show({ patient, appointments, medicalRecords }: ShowProps) {
    const { auth } = usePage<SharedProps>().props;
    const isAdmin = auth.roles?.includes('admin');

    return (
        <PatientsLayout>
            <Head title={`Pasien — ${patient.name}`} />

            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-slate-800">{patient.name}</h1>
                    <p className="text-muted-foreground font-mono text-sm">{patient.nik}</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href={route('patients.index')}>Kembali</Link>
                    </Button>
                    {isAdmin && (
                        <Button asChild>
                            <Link href={route('patients.edit', patient.id)}>Ubah</Link>
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle>Data Diri</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <Row label="Jenis Kelamin">
                            {patient.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
                        </Row>
                        <Row label="Tanggal Lahir">{formatDate(patient.date_of_birth)}</Row>
                        <Row label="Golongan Darah">{patient.blood_type ?? '—'}</Row>
                        <Row label="Alergi">{patient.allergies ?? '—'}</Row>
                        <Row label="Telepon">{patient.phone ?? '—'}</Row>
                        <Row label="Alamat">{patient.address ?? '—'}</Row>
                        <Row label="Kontak Darurat">
                            {patient.emergency_contact_name ?? '—'}
                            {patient.emergency_contact_phone
                                ? ` (${patient.emergency_contact_phone})`
                                : ''}
                        </Row>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Riwayat Kunjungan</CardTitle>
                        <Button asChild size="sm" variant="outline">
                            <Link href={route('patients.records.index', patient.id)}>
                                Lihat Semua Rekam Medis
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">Tanggal</th>
                                        <th className="px-4 py-3">Dokter</th>
                                        <th className="px-4 py-3">ICD-10</th>
                                        <th className="px-4 py-3">Diagnosis</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {medicalRecords.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="text-muted-foreground px-4 py-8 text-center"
                                            >
                                                Belum ada rekam medis.
                                            </td>
                                        </tr>
                                    )}
                                    {medicalRecords.map((record) => (
                                        <tr key={record.id} className="border-t">
                                            <td className="px-4 py-3">
                                                {formatDate(record.visited_at)}
                                            </td>
                                            <td className="px-4 py-3">{record.doctor ?? '—'}</td>
                                            <td className="px-4 py-3 font-mono text-xs">
                                                {record.icd10_code ?? '—'}
                                            </td>
                                            <td className="px-4 py-3">{record.assessment ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Janji Temu</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">Jadwal</th>
                                        <th className="px-4 py-3">Dokter</th>
                                        <th className="px-4 py-3">No. Antrean</th>
                                        <th className="px-4 py-3">Keluhan</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {appointments.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="text-muted-foreground px-4 py-8 text-center"
                                            >
                                                Belum ada janji temu.
                                            </td>
                                        </tr>
                                    )}
                                    {appointments.map((appointment) => (
                                        <tr key={appointment.id} className="border-t">
                                            <td className="px-4 py-3">
                                                {formatDate(appointment.scheduled_at)}
                                            </td>
                                            <td className="px-4 py-3">
                                                {appointment.doctor ?? '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {appointment.queue_number ?? '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {appointment.complaint ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 capitalize">
                                                {appointment.status}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PatientsLayout>
    );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex justify-between gap-4 border-b py-1.5 last:border-0">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-right font-medium text-slate-800">{children}</span>
        </div>
    );
}