import { Head, Link } from '@inertiajs/react';

import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import PatientLayout from '@/Layouts/PatientLayout';

interface PatientProps {
    summary: {
        total_visits: number;
        last_visit: string | null;
        next_appointment: {
            id: number;
            scheduled_at: string | null;
            status: string;
            doctor: string | null;
            queue_number: number | null;
        } | null;
    };
}

function formatDate(value: string | null): string {
    if (!value) {
        return '—';
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('id-ID');
}

export default function Patient({ summary }: PatientProps) {
    return (
        <PatientLayout>
            <Head title="Dashboard Pasien" />

            <h1 className="mb-4 text-xl font-semibold text-slate-800">Ringkasan Saya</h1>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Total Kunjungan</CardTitle>
                    </CardHeader>
                    <CardContent className="text-3xl font-bold">{summary.total_visits}</CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Kunjungan Terakhir</CardTitle>
                    </CardHeader>
                    <CardContent className="text-lg font-medium">{formatDate(summary.last_visit)}</CardContent>
                </Card>
            </div>

            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>Janji Temu Berikutnya</CardTitle>
                </CardHeader>
                <CardContent>
                    {summary.next_appointment ? (
                        <div className="space-y-1 text-sm">
                            <p className="font-medium">{formatDate(summary.next_appointment.scheduled_at)}</p>
                            <p className="text-muted-foreground">
                                Dokter: {summary.next_appointment.doctor ?? '—'}
                            </p>
                            <p className="text-muted-foreground capitalize">
                                Status: {summary.next_appointment.status}
                            </p>
                            <p className="text-muted-foreground">
                                No. Antrean: {summary.next_appointment.queue_number ?? '—'}
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground text-sm">Belum ada janji temu terjadwal.</span>
                            <Button asChild size="sm">
                                <Link href={route('appointments.create')}>Buat Janji Temu</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </PatientLayout>
    );
}