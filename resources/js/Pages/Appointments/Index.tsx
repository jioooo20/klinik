import { Head, Link, router } from '@inertiajs/react';

import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import AppointmentsLayout from '@/Pages/Appointments/_Layout';

interface AppointmentRow {
    id: number;
    scheduled_at: string | null;
    status: string;
    status_label: string | null;
    queue_number: number | null;
    complaint: string | null;
    doctor: string | null;
    patient: string | null;
    can_update_status: boolean;
    can_delete: boolean;
}

interface PaginatedAppointments {
    data: AppointmentRow[];
    links: { url: string | null; label: string; active: boolean }[];
}

interface IndexProps {
    appointments: PaginatedAppointments;
    role: string;
    statuses: { value: string; label: string }[];
}

const statusColor: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-sky-100 text-sky-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-rose-100 text-rose-700',
};

export default function Index({ appointments, role, statuses }: IndexProps) {
    const canCreate = role === 'pasien' || role === 'admin';

    const changeStatus = (id: number, status: string) => {
        router.patch(route('appointments.status', id), { status }, { preserveScroll: true });
    };

    const remove = (id: number) => {
        if (confirm('Batalkan/hapus janji temu ini?')) {
            router.delete(route('appointments.destroy', id), { preserveScroll: true });
        }
    };

    const heading =
        role === 'dokter' ? 'Antrean Hari Ini' : role === 'pasien' ? 'Janji Temu Saya' : 'Semua Janji Temu';

    return (
        <AppointmentsLayout>
            <Head title="Janji Temu" />
            <Card className="mx-auto max-w-6xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>{heading}</CardTitle>
                        {canCreate && (
                            <Link href={route('appointments.create')}>
                                <Button>Buat Janji Temu</Button>
                            </Link>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="px-3 py-2 text-left font-medium">Jadwal</th>
                                    <th className="px-3 py-2 text-left font-medium">Pasien</th>
                                    <th className="px-3 py-2 text-left font-medium">Dokter</th>
                                    <th className="px-3 py-2 text-left font-medium">Antrean</th>
                                    <th className="px-3 py-2 text-left font-medium">Status</th>
                                    <th className="px-3 py-2 text-left font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                                            Belum ada janji temu.
                                        </td>
                                    </tr>
                                ) : (
                                    appointments.data.map((a) => (
                                        <tr key={a.id} className="border-b">
                                            <td className="px-3 py-2">
                                                {a.scheduled_at
                                                    ? new Date(a.scheduled_at).toLocaleString('id-ID')
                                                    : '-'}
                                            </td>
                                            <td className="px-3 py-2">{a.patient ?? '-'}</td>
                                            <td className="px-3 py-2">{a.doctor ?? '-'}</td>
                                            <td className="px-3 py-2">{a.queue_number ?? '-'}</td>
                                            <td className="px-3 py-2">
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                        statusColor[a.status] ?? 'bg-slate-100 text-slate-700'
                                                    }`}
                                                >
                                                    {a.status_label ?? a.status}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {a.can_update_status && (
                                                        <select
                                                            defaultValue=""
                                                            onChange={(e) => {
                                                                if (e.target.value) {
                                                                    changeStatus(a.id, e.target.value);
                                                                }
                                                            }}
                                                            className="border-input h-8 rounded-md border bg-transparent px-2 text-xs"
                                                        >
                                                            <option value="">Ubah status...</option>
                                                            {statuses
                                                                .filter((s) => s.value !== a.status)
                                                                .map((s) => (
                                                                    <option key={s.value} value={s.value}>
                                                                        {s.label}
                                                                    </option>
                                                                ))}
                                                        </select>
                                                    )}
                                                    {a.can_delete && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-rose-600"
                                                            onClick={() => remove(a.id)}
                                                        >
                                                            Batalkan
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {appointments.links.length > 0 && (
                        <div className="mt-4 flex justify-center gap-1">
                            {appointments.links.map((link, i) => (
                                <Button
                                    key={i}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => link.url && router.get(link.url)}
                                >
                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                </Button>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </AppointmentsLayout>
    );
}