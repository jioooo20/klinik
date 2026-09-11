import { Head, router } from '@inertiajs/react';

import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import AdminLayout from '@/Layouts/AdminLayout';

interface VisitStats {
    period: string;
    total_visits: number;
    new_patients: number;
    completed_appointments: number;
    pending_appointments: number;
}

interface Diagnosis {
    icd10_code: string;
    total: number;
}

interface AdminProps {
    stats: VisitStats;
    topDiagnoses: Diagnosis[];
    todayAppointments: Record<string, number>;
    totals: { patients: number; doctors: number };
    filters: { period: string };
}

const PERIODS = [
    { value: 'today', label: 'Hari ini' },
    { value: 'week', label: 'Minggu ini' },
    { value: 'month', label: 'Bulan ini' },
    { value: 'year', label: 'Tahun ini' },
];

export default function Admin({ stats, topDiagnoses, totals, filters }: AdminProps) {
    const changePeriod = (period: string) => {
        router.get(route('dashboard'), { period }, { preserveState: true });
    };

    return (
        <AdminLayout>
            <Head title="Dashboard Admin" />

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h1 className="text-xl font-semibold text-slate-800">Ringkasan Klinik</h1>
                <div className="flex gap-1">
                    {PERIODS.map((p) => (
                        <button
                            key={p.value}
                            type="button"
                            onClick={() => changePeriod(p.value)}
                            className={`rounded-md border px-3 py-1 text-sm ${
                                filters.period === p.value
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-white text-slate-700'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Kpi title="Total Kunjungan" value={stats.total_visits} />
                <Kpi title="Pasien Baru" value={stats.new_patients} />
                <Kpi title="Janji Selesai" value={stats.completed_appointments} />
                <Kpi title="Janji Aktif" value={stats.pending_appointments} />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
                <Kpi title="Total Pasien" value={totals.patients} />
                <Kpi title="Dokter Aktif" value={totals.doctors} />
            </div>

            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Top Diagnosis (ICD-10)</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Kode ICD-10</th>
                                    <th className="px-4 py-3">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topDiagnoses.length === 0 && (
                                    <tr>
                                        <td colSpan={2} className="text-muted-foreground px-4 py-8 text-center">
                                            Belum ada data diagnosis.
                                        </td>
                                    </tr>
                                )}
                                {topDiagnoses.map((d) => (
                                    <tr key={d.icd10_code} className="border-t">
                                        <td className="px-4 py-3 font-mono text-xs">{d.icd10_code}</td>
                                        <td className="px-4 py-3">{d.total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </AdminLayout>
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