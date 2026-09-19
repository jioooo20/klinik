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
    vitals: {
        sistolik?: string | number;
        diastolik?: string | number;
        suhu?: string | number;
        nadi?: string | number;
        respirasi?: string | number;
    } | null;
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

/** Batas atas kode ICD-10 per rekam medis (selaras dengan validasi server). */
const MAX_ICD10_CODES = 20;

/**
 * Batas fisiologis tanda vital (selaras dengan rules() di Form Request).
 * Sistolik/diastolik = mmHg, suhu = °C, nadi/respirasi = kali per menit.
 */
const VITAL_BOUNDS = {
    sistolik: { min: 60, max: 260, step: 1 },
    diastolik: { min: 30, max: 160, step: 1 },
    suhu: { min: 30, max: 45, step: 0.1 },
    nadi: { min: 20, max: 250, step: 1 },
    respirasi: { min: 5, max: 80, step: 1 },
} as const;

export default function Edit({ record, patient, icd10Options }: EditProps) {
    const { data, setData, put, processing, errors } = useForm({
        visited_at: record.visited_at ?? '',
        subjective: record.subjective ?? '',
        objective: record.objective ?? '',
        assessment: record.assessment ?? '',
        plan: record.plan ?? '',
        icd10_codes: record.icd10_codes ?? [],
        vitals: {
            sistolik: record.vitals?.sistolik ?? '',
            diastolik: record.vitals?.diastolik ?? '',
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

                            <div className="space-y-2">
                                <Label>Tekanan Darah (mmHg)</Label>
                                <div className="flex items-start gap-2">
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="vital-sistolik"
                                                type="number"
                                                inputMode="numeric"
                                                step={VITAL_BOUNDS.sistolik.step}
                                                min={VITAL_BOUNDS.sistolik.min}
                                                max={VITAL_BOUNDS.sistolik.max}
                                                placeholder="Sistolik"
                                                value={data.vitals.sistolik}
                                                onChange={(e) => setVital('sistolik', e.target.value)}
                                                aria-invalid={!!errors['vitals.sistolik']}
                                            />
                                            <span className="text-sm text-muted-foreground">mmHg</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">Sistolik</span>
                                        {errors['vitals.sistolik'] && (
                                            <p className="text-sm text-red-500">{errors['vitals.sistolik']}</p>
                                        )}
                                    </div>

                                    <span className="pt-2 text-lg text-muted-foreground">/</span>

                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Input
                                                id="vital-diastolik"
                                                type="number"
                                                inputMode="numeric"
                                                step={VITAL_BOUNDS.diastolik.step}
                                                min={VITAL_BOUNDS.diastolik.min}
                                                max={VITAL_BOUNDS.diastolik.max}
                                                placeholder="Diastolik"
                                                value={data.vitals.diastolik}
                                                onChange={(e) => setVital('diastolik', e.target.value)}
                                                aria-invalid={!!errors['vitals.diastolik']}
                                            />
                                            <span className="text-sm text-muted-foreground">mmHg</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">Diastolik</span>
                                        {errors['vitals.diastolik'] && (
                                            <p className="text-sm text-red-500">{errors['vitals.diastolik']}</p>
                                        )}
                                    </div>
                                </div>
                                {errors.vitals && (
                                    <p className="text-sm text-red-500">{errors.vitals}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label htmlFor="vital-suhu">Suhu</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="vital-suhu"
                                            type="number"
                                            inputMode="decimal"
                                            step={VITAL_BOUNDS.suhu.step}
                                            min={VITAL_BOUNDS.suhu.min}
                                            max={VITAL_BOUNDS.suhu.max}
                                            placeholder="36.8"
                                            value={data.vitals.suhu}
                                            onChange={(e) => setVital('suhu', e.target.value)}
                                            aria-invalid={!!errors['vitals.suhu']}
                                        />
                                        <span className="text-sm text-muted-foreground">°C</span>
                                    </div>
                                    {errors['vitals.suhu'] && (
                                        <p className="text-sm text-red-500">{errors['vitals.suhu']}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="vital-nadi">Nadi</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="vital-nadi"
                                            type="number"
                                            inputMode="numeric"
                                            step={VITAL_BOUNDS.nadi.step}
                                            min={VITAL_BOUNDS.nadi.min}
                                            max={VITAL_BOUNDS.nadi.max}
                                            placeholder="80"
                                            value={data.vitals.nadi}
                                            onChange={(e) => setVital('nadi', e.target.value)}
                                            aria-invalid={!!errors['vitals.nadi']}
                                        />
                                        <span className="text-sm text-muted-foreground">x/menit</span>
                                    </div>
                                    {errors['vitals.nadi'] && (
                                        <p className="text-sm text-red-500">{errors['vitals.nadi']}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="vital-respirasi">Respirasi</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="vital-respirasi"
                                            type="number"
                                            inputMode="numeric"
                                            step={VITAL_BOUNDS.respirasi.step}
                                            min={VITAL_BOUNDS.respirasi.min}
                                            max={VITAL_BOUNDS.respirasi.max}
                                            placeholder="18"
                                            value={data.vitals.respirasi}
                                            onChange={(e) => setVital('respirasi', e.target.value)}
                                            aria-invalid={!!errors['vitals.respirasi']}
                                        />
                                        <span className="text-sm text-muted-foreground">x/menit</span>
                                    </div>
                                    {errors['vitals.respirasi'] && (
                                        <p className="text-sm text-red-500">{errors['vitals.respirasi']}</p>
                                    )}
                                </div>
                            </div>
                        </fieldset>

                        <fieldset className="space-y-2">
                            <legend className="text-sm font-medium">Diagnosis ICD-10</legend>
                            <p className="text-xs text-muted-foreground">
                                Dipilih {data.icd10_codes.length}/{MAX_ICD10_CODES} kode.
                            </p>
                            <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto rounded-md border p-3 md:grid-cols-2">
                                {icd10Options.map((option) => (
                                    <label
                                        key={option.code}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={data.icd10_codes.includes(option.code)}
                                            disabled={
                                                !data.icd10_codes.includes(option.code) &&
                                                data.icd10_codes.length >= MAX_ICD10_CODES
                                            }
                                            onChange={(e) => toggleCode(option.code, e.target.checked)}
                                        />
                                        <span className="font-mono text-xs">{option.code}</span>
                                        <span>{option.label}</span>
                                    </label>
                                ))}
                            </div>
                            {errors.icd10_codes && (
                                <p className="text-sm text-red-500">{errors.icd10_codes}</p>
                            )}
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