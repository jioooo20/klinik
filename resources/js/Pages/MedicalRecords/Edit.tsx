import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

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

interface RecordForm {
    id: number;
    visited_at: string | null;
    subjective: string | null;
    objective: string | null;
    assessment: string | null;
    plan: string | null;
    icd10_codes: string[];
    vitals: { tensi?: string; suhu?: string; nadi?: string; respirasi?: string } | null;
    prescription: string;
}

interface Icd10Option {
    code: string;
    label: string;
}

interface EditProps {
    record: RecordForm;
    patient: PatientRef;
    icd10Options: Icd10Option[];
}

const textareaClass =
    'border-input flex w-full rounded-md border bg-transparent px-3 py-2 text-sm';

export default function Edit({ record, patient, icd10Options }: EditProps) {
    const { data, setData, put, processing, errors } = useForm({
        visited_at: record.visited_at ?? '',
        subjective: record.subjective ?? '',
        objective: record.objective ?? '',
        assessment: record.assessment ?? '',
        plan: record.plan ?? '',
        icd10_codes: record.icd10_codes ?? [],
        vitals: {
            tensi: record.vitals?.tensi ?? '',
            suhu: record.vitals?.suhu ?? '',
            nadi: record.vitals?.nadi ?? '',
            respirasi: record.vitals?.respirasi ?? '',
        },
        prescription: record.prescription ?? '',
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(route('medical-records.update', record.id));
    };

    const setVital = (key: keyof typeof data.vitals, value: string) => {
        setData('vitals', { ...data.vitals, [key]: value });
    };

    const toggleCode = (code: string, checked: boolean) => {
        setData(
            'icd10_codes',
            checked
                ? [...data.icd10_codes, code]
                : data.icd10_codes.filter((c) => c !== code),
        );
    };

    return (
        <MedicalRecordsLayout>
            <Head title={`Revisi Rekam Medis — ${patient.name}`} />
            <Card className="mx-auto max-w-3xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Revisi Rekam Medis</CardTitle>
                        <Link href={route('medical-records.show', record.id)}>
                            <Button variant="outline" size="sm">Kembali</Button>
                        </Link>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {patient.name} · <span className="font-mono">{patient.nik}</span>
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="visited_at">Tanggal Kunjungan</Label>
                            <Input
                                id="visited_at"
                                type="date"
                                value={data.visited_at}
                                onChange={(e) => setData('visited_at', e.target.value)}
                                aria-invalid={!!errors.visited_at}
                            />
                            {errors.visited_at && (
                                <p className="text-sm text-red-500">{errors.visited_at}</p>
                            )}
                        </div>

                        {(['subjective', 'objective', 'assessment', 'plan'] as const).map((field) => (
                            <div className="space-y-2" key={field}>
                                <Label htmlFor={field}>
                                    {field === 'subjective' && 'Subjective (S)'}
                                    {field === 'objective' && 'Objective (O)'}
                                    {field === 'assessment' && 'Assessment (A)'}
                                    {field === 'plan' && 'Plan (P)'}
                                </Label>
                                <textarea
                                    id={field}
                                    rows={3}
                                    value={data[field]}
                                    onChange={(e) => setData(field, e.target.value)}
                                    className={textareaClass}
                                    aria-invalid={!!errors[field]}
                                />
                                {errors[field] && (
                                    <p className="text-sm text-red-500">{errors[field]}</p>
                                )}
                            </div>
                        ))}

                        <fieldset className="space-y-3">
                            <legend className="text-sm font-medium">Tanda Vital</legend>
                            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                                {(['tensi', 'suhu', 'nadi', 'respirasi'] as const).map((vital) => (
                                    <div className="space-y-2" key={vital}>
                                        <Label htmlFor={`vital-${vital}`} className="capitalize">
                                            {vital}
                                        </Label>
                                        <Input
                                            id={`vital-${vital}`}
                                            value={data.vitals[vital]}
                                            onChange={(e) => setVital(vital, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </fieldset>

                        <fieldset className="space-y-2">
                            <legend className="text-sm font-medium">Diagnosis ICD-10</legend>
                            <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto rounded-md border p-3 md:grid-cols-2">
                                {icd10Options.map((option) => (
                                    <label
                                        key={option.code}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={data.icd10_codes.includes(option.code)}
                                            onChange={(e) => toggleCode(option.code, e.target.checked)}
                                        />
                                        <span className="font-mono text-xs">{option.code}</span>
                                        <span>{option.label}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>

                        <div className="space-y-2">
                            <Label htmlFor="prescription">Resep (satu baris per obat, opsional)</Label>
                            <textarea
                                id="prescription"
                                rows={3}
                                value={data.prescription}
                                onChange={(e) => setData('prescription', e.target.value)}
                                className={textareaClass}
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" disabled={processing}>Simpan Revisi</Button>
                            <Link href={route('medical-records.show', record.id)}>
                                <Button variant="ghost" type="button">Batal</Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </MedicalRecordsLayout>
    );
}