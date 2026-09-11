import { Head, Link, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import MedicalRecordsLayout from '@/Pages/MedicalRecords/_Layout';

interface PatientRef {
    id: number;
    name: string;
    nik: string | null;
}

interface RecordRow {
    id: number;
    visited_at: string | null;
    icd10_code: string | null;
    assessment: string | null;
    doctor: string | null;
}

interface PaginatedRecords {
    data: RecordRow[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
}

interface IndexProps {
    patient: PatientRef;
    records: PaginatedRecords;
    filters: { from: string | null; to: string | null };
}

function formatDateTime(value: string | null): string {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('id-ID');
}

export default function Index({ patient, records, filters }: IndexProps) {
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');

    const applyFilter = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            route('patients.records.index', patient.id),
            { from, to },
            { preserveState: true },
        );
    };

    const resetFilter = () => {
        setFrom('');
        setTo('');
        router.get(route('patients.records.index', patient.id));
    };

    return (
        <MedicalRecordsLayout>
            <Head title={`Rekam Medis — ${patient.name}`} />

            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-slate-800">Riwayat Rekam Medis</h1>
                    <p className="text-sm text-muted-foreground">
                        {patient.name} · <span className="font-mono">{patient.nik}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href={route('patients.show', patient.id)}>
                        <Button variant="outline">Kembali ke Pasien</Button>
                    </Link>
                    <Link href={route('patients.records.create', patient.id)}>
                        <Button>Rekam Medis Baru</Button>
                    </Link>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Filter Tanggal</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={applyFilter} className="mb-4 flex flex-wrap items-end gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="from">Dari</Label>
                            <Input
                                id="from"
                                type="date"
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="to">Sampai</Label>
                            <Input
                                id="to"
                                type="date"
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                            />
                        </div>
                        <Button type="submit">Terapkan</Button>
                        <Button type="button" variant="ghost" onClick={resetFilter}>
                            Reset
                        </Button>
                    </form>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
                                <tr>
                                    <th className="px-4 py-3">Waktu Kunjungan</th>
                                    <th className="px-4 py-3">Dokter</th>
                                    <th className="px-4 py-3">ICD-10</th>
                                    <th className="px-4 py-3">Diagnosis</th>
                                    <th className="px-4 py-3">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                            Belum ada rekam medis pada rentang ini.
                                        </td>
                                    </tr>
                                )}
                                {records.data.map((record) => (
                                    <tr key={record.id} className="border-t">
                                        <td className="px-4 py-3">{formatDateTime(record.visited_at)}</td>
                                        <td className="px-4 py-3">{record.doctor ?? '—'}</td>
                                        <td className="px-4 py-3 font-mono text-xs">
                                            {record.icd10_code ?? '—'}
                                        </td>
                                        <td className="px-4 py-3">{record.assessment ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={route('medical-records.show', record.id)}
                                                className="text-indigo-600 hover:underline"
                                            >
                                                Detail
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {records.links.length > 0 && (
                        <div className="mt-4 flex justify-center gap-1">
                            {records.links.map((link, i) => (
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
        </MedicalRecordsLayout>
    );
}