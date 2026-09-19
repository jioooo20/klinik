import { Head, Link } from '@inertiajs/react';

import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import MedicalRecordsLayout from '@/Pages/MedicalRecords/_Layout';

interface PatientRef {
    id: number | null;
    name: string | null;
    nik: string | null;
}

interface RecordDetail {
    id: number;
    visited_at: string | null;
    subjective: string | null;
    objective: string | null;
    assessment: string | null;
    plan: string | null;
    icd10_codes: string[];
    vitals: {
        sistolik?: string | number;
        diastolik?: string | number;
        suhu?: string | number;
        nadi?: string | number;
        respirasi?: string | number;
    } | null;
    prescription: string[];
    doctor: string | null;
}

interface ShowProps {
    record: RecordDetail;
    patient: PatientRef;
    canUpdate: boolean;
}

function formatDateTime(value: string | null): string {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('id-ID');
}

function SoapBlock({ title, body }: { title: string; body: string | null }) {
    return (
        <div className="rounded-md border p-3">
            <div className="mb-1 text-xs font-semibold uppercase text-slate-500">{title}</div>
            <p className="whitespace-pre-wrap text-sm text-slate-800">{body || '—'}</p>
        </div>
    );
}

export default function Show({ record, patient, canUpdate }: ShowProps) {
    return (
        <MedicalRecordsLayout>
            <Head title="Detail Rekam Medis" />

            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-slate-800">Detail Rekam Medis</h1>
                    <p className="text-sm text-muted-foreground">
                        {patient.name ?? '—'} · <span className="font-mono">{patient.nik ?? '—'}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    {patient.id && (
                        <Link href={route('patients.records.index', patient.id)}>
                            <Button variant="outline">Riwayat Pasien</Button>
                        </Link>
                    )}
                    {canUpdate && (
                        <Link href={route('medical-records.edit', record.id)}>
                            <Button>Revisi</Button>
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Catatan SOAP</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <SoapBlock title="Subjective (S)" body={record.subjective} />
                        <SoapBlock title="Objective (O)" body={record.objective} />
                        <SoapBlock title="Assessment (A)" body={record.assessment} />
                        <SoapBlock title="Plan (P)" body={record.plan} />
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Metadata</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between border-b py-1.5">
                                <span className="text-muted-foreground">Waktu Kunjungan</span>
                                <span className="font-medium">{formatDateTime(record.visited_at)}</span>
                            </div>
                            <div className="flex justify-between border-b py-1.5">
                                <span className="text-muted-foreground">Dokter</span>
                                <span className="font-medium">{record.doctor ?? '—'}</span>
                            </div>
                            <div className="flex justify-between py-1.5">
                                <span className="text-muted-foreground">ICD-10</span>
                                <span className="font-mono text-xs">
                                    {record.icd10_codes.length > 0 ? record.icd10_codes.join(', ') : '—'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Tanda Vital</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <VitalRow label="Tensi" value={formatTensi(record.vitals)} />
                            <VitalRow label="Suhu" value={formatVital(record.vitals?.suhu, '°C')} />
                            <VitalRow label="Nadi" value={formatVital(record.vitals?.nadi, 'x/menit')} />
                            <VitalRow
                                label="Respirasi"
                                value={formatVital(record.vitals?.respirasi, 'x/menit')}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Resep</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                            {record.prescription.length > 0 ? (
                                <ul className="list-inside list-disc space-y-1">
                                    {record.prescription.map((item, i) => (
                                        <li key={i}>{item}</li>
                                    ))}
                                </ul>
                            ) : (
                                <span className="text-muted-foreground">—</span>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MedicalRecordsLayout>
    );
}

function VitalRow({ label, value }: { label: string; value?: string }) {
    return (
        <div className="flex justify-between border-b py-1.5 last:border-0">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium">{value || '—'}</span>
        </div>
    );
}

/** Nilai numerik tanda vital tunggal dengan satuan; '—' bila kosong. */
function formatVital(value: string | number | undefined | null, unit: string): string {
    if (value === undefined || value === null || value === '') {
        return '—';
    }

    return `${value} ${unit}`;
}

/** Gabungkan sistolik/diastolik menjadi satu bacaan, mis. "120/80 mmHg". */
function formatTensi(
    vitals:
        | { sistolik?: string | number; diastolik?: string | number }
        | null
        | undefined,
): string {
    const sistolik = vitals?.sistolik;
    const diastolik = vitals?.diastolik;
    const hasSistolik = sistolik !== undefined && sistolik !== null && sistolik !== '';
    const hasDiastolik = diastolik !== undefined && diastolik !== null && diastolik !== '';

    if (hasSistolik && hasDiastolik) {
        return `${sistolik}/${diastolik} mmHg`;
    }
    if (hasSistolik) {
        return `${sistolik} mmHg`;
    }
    if (hasDiastolik) {
        return `${diastolik} mmHg`;
    }

    return '—';
}