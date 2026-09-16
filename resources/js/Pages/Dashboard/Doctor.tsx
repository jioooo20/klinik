import { Head, Link, router } from '@inertiajs/react';

import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import DoctorLayout from '@/Layouts/DoctorLayout';

interface VisitStats {
    period: string;
    total_visits: number;
    new_patients: number;
    completed_appointments: number;
    pending_appointments: number;
}

interface QueueRow {
    id: number;
    /** ID pasien (bukan id appointment) — dipakai untuk route rekam medis. */
    patient_id: number | null;
    scheduled_at: string | null;
    status: string;
    queue_number: number | null;
    patient: string | null;
    has_record: boolean;
}

interface DoctorProps {
    stats: VisitStats;
    queue: QueueRow[];
    topDiagnoses: { icd10_code: string; total: number }[];
    filters: { period: string };
}

export default function Doctor({ stats, queue }: DoctorProps) {
    const changePeriod = (period: string) => {
        router.get(route('dashboard'), { period }, { preserveState: true });
    };

    return (
        <DoctorLayout>
            <Head title="Dashboard Dokter" />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h1 className="text-xl font-semibold text-slate-800">Dashboard Dokter</h1>
                <div className="flex gap-1">
                    {['today', 'week', 'month', 'year'].map((p) => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => changePeriod(p)}
                            className={`rounded-md border px-3 py-1 text-sm capitalize ${
                                stats.period === p ? 'bg-slate-800 text-white' : 'bg-white text-slate-700'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
                <Kpi title="Kunjungan" value={stats.total_visits} />
                <Kpi title="Selesai" value={stats.completed_appointments} />
                <Kpi title="Aktif" value={stats.pending_appointments} />
                <Kpi title="Pasien Baru" value={stats.new_patients} />
            </div>

            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Antrean Hari Ini</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">No.</th>
                                    <th className="px-4 py-3">Pasien</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {queue.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-muted-foreground px-4 py-8 text-center">
                                            Belum ada antrean.
                                        </td>
                                    </tr>
                                )}
                                {queue.map((row) => (
                                    <tr key={row.id} className="border-t">
                                        <td className="px-4 py-3">{row.queue_number ?? '—'}</td>
                                        <td className="px-4 py-3">{row.patient ?? '—'}</td>
                                        <td className="px-4 py-3 capitalize">{row.status}</td>
                                        <td className="px-4 py-3">
                                            {!row.has_record && row.patient_id !== null && (
                                                <Button asChild size="sm" variant="outline">
                                                    <Link
                                                        href={route(
                                                            'patients.records.create',
                                                            row.patient_id,
                                                        )}
                                                    >
                                                        Isi Rekam Medis
                                                    </Link>
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </DoctorLayout>
    );
}

function Kpi({ title, value }: { title: string; value: number }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium text-slate-500">{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-3xl font-bold">{value}</CardContent>
        </Card>
    );
}