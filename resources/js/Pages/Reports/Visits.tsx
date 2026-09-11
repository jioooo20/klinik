import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import AdminLayout from '@/Layouts/AdminLayout';

interface AppointmentRow {
    id: number;
    scheduled_at: string | null;
    status: string;
    queue_number: number | null;
    patient: string | null;
    doctor: string | null;
}

interface Paginated<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
}

interface DoctorOption {
    id: number;
    name: string | null;
}

interface VisitsProps {
    appointments: Paginated<AppointmentRow>;
    doctors: DoctorOption[];
    filters: {
        from: string;
        to: string;
        doctor_id: number | null;
        status: string | null;
    };
}

export default function Visits({ appointments, doctors, filters }: VisitsProps) {
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);
    const [doctorId, setDoctorId] = useState(filters.doctor_id ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

    const apply = () => {
        router.get(
            route('reports.visits'),
            { from, to, doctor_id: doctorId || undefined, status: status || undefined },
            { preserveState: true },
        );
    };

    return (
        <AdminLayout>
            <Head title="Laporan Kunjungan" />

            <h1 className="mb-4 text-xl font-semibold text-slate-800">Laporan Kunjungan</h1>

            <Card className="mb-4">
                <CardHeader>
                    <CardTitle className="text-sm">Filter</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-end gap-3">
                        <label className="text-sm">
                            Dari
                            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
                        </label>
                        <label className="text-sm">
                            Sampai
                            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
                        </label>
                        <label className="text-sm">
                            Dokter
                            <select
                                className="border-input flex h-9 rounded-md border bg-transparent px-3 text-sm"
                                value={doctorId}
                                onChange={(e) => setDoctorId(e.target.value)}
                            >
                                <option value="">Semua</option>
                                {doctors.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="text-sm">
                            Status
                            <select
                                className="border-input flex h-9 rounded-md border bg-transparent px-3 text-sm"
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                            >
                                <option value="">Semua</option>
                                <option value="pending">pending</option>
                                <option value="confirmed">confirmed</option>
                                <option value="completed">completed</option>
                                <option value="cancelled">cancelled</option>
                            </select>
                        </label>
                        <Button onClick={apply}>Terapkan</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Jadwal</th>
                                    <th className="px-4 py-3">Pasien</th>
                                    <th className="px-4 py-3">Dokter</th>
                                    <th className="px-4 py-3">No. Antrean</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-muted-foreground px-4 py-8 text-center">
                                            Tidak ada data pada rentang ini.
                                        </td>
                                    </tr>
                                )}
                                {appointments.data.map((row) => (
                                    <tr key={row.id} className="border-t">
                                        <td className="px-4 py-3">
                                            {row.scheduled_at
                                                ? new Date(row.scheduled_at).toLocaleString('id-ID')
                                                : '—'}
                                        </td>
                                        <td className="px-4 py-3">{row.patient ?? '—'}</td>
                                        <td className="px-4 py-3">{row.doctor ?? '—'}</td>
                                        <td className="px-4 py-3">{row.queue_number ?? '—'}</td>
                                        <td className="px-4 py-3 capitalize">{row.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <div className="mt-4 flex flex-wrap gap-2">
                {appointments.links.map((link, index) =>
                    link.url ? (
                        <a
                            key={index}
                            href={link.url}
                            className={`rounded-md border px-3 py-1 text-sm ${
                                link.active ? 'bg-slate-800 text-white' : 'bg-white'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ) : null,
                )}
            </div>
        </AdminLayout>
    );
}