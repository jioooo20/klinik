import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import AppointmentsLayout from '@/Pages/Appointments/_Layout';

interface DoctorOption {
    id: number;
    name: string;
    specialty: string | null;
}

interface TakenSlot {
    doctor_id: number;
    scheduled_at: string;
}

interface CreateProps {
    doctors: DoctorOption[];
    takenSlots: TakenSlot[];
    isAdmin: boolean;
}

/** Hourly slot grid from 08:00 to 17:00. */
const SLOTS = Array.from({ length: 10 }, (_, i) => {
    const hour = (8 + i).toString().padStart(2, '0');

    return `${hour}:00`;
});

export default function Create({ doctors, takenSlots, isAdmin }: CreateProps) {
    const [doctorId, setDoctorId] = useState<number | ''>('');
    const [date, setDate] = useState('');
    const [slot, setSlot] = useState('');

    const { data, setData, post, processing, errors } = useForm({
        doctor_id: '' as number | '',
        scheduled_at: '',
        complaint: '',
    });

    const taken = useMemo(() => {
        const set = new Set<string>();

        takenSlots
            .filter((t) => t.doctor_id === doctorId)
            .forEach((t) => set.add(t.scheduled_at));

        return set;
    }, [takenSlots, doctorId]);

    const isTaken = (value: string) => taken.has(value);

    const submit = (e: FormEvent) => {
        e.preventDefault();

        if (!doctorId || !date || !slot) {
            return;
        }

        const scheduledAt = `${date}T${slot}:00`;

        setData('doctor_id', doctorId);
        setData('scheduled_at', scheduledAt);

        post(route('appointments.store'));
    };

    return (
        <AppointmentsLayout>
            <Head title="Buat Janji Temu" />
            <Card className="mx-auto max-w-2xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Buat Janji Temu</CardTitle>
                        <Link href={route('appointments.index')}>
                            <Button variant="outline" size="sm">
                                Kembali
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="doctor_id">Dokter</Label>
                            <select
                                id="doctor_id"
                                value={doctorId}
                                onChange={(e) => {
                                    setDoctorId(e.target.value ? Number(e.target.value) : '');
                                    setSlot('');
                                }}
                                className="border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm"
                            >
                                <option value="">Pilih dokter...</option>
                                {doctors.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.name}
                                        {d.specialty ? ` — ${d.specialty}` : ''}
                                    </option>
                                ))}
                            </select>
                            {errors.doctor_id && <p className="text-sm text-red-500">{errors.doctor_id}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="date">Tanggal</Label>
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                min={new Date().toISOString().slice(0, 10)}
                                onChange={(e) => {
                                    setDate(e.target.value);
                                    setSlot('');
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Slot Tersedia</Label>
                            {!doctorId || !date ? (
                                <p className="text-sm text-muted-foreground">
                                    Pilih dokter dan tanggal untuk melihat slot.
                                </p>
                            ) : (
                                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                                    {SLOTS.map((s) => {
                                        const value = `${date}T${s}`;
                                        const disabled = isTaken(value);
                                        const active = slot === s;

                                        return (
                                            <button
                                                key={s}
                                                type="button"
                                                disabled={disabled}
                                                onClick={() => setSlot(s)}
                                                className={`rounded-md border px-2 py-1 text-sm ${
                                                    disabled
                                                        ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 line-through'
                                                        : active
                                                          ? 'border-indigo-600 bg-indigo-600 text-white'
                                                          : 'border-slate-300 hover:border-indigo-400'
                                                }`}
                                            >
                                                {s}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            {errors.scheduled_at && (
                                <p className="text-sm text-red-500">{errors.scheduled_at}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="complaint">Keluhan (opsional)</Label>
                            <textarea
                                id="complaint"
                                value={data.complaint}
                                onChange={(e) => setData('complaint', e.target.value)}
                                rows={3}
                                className="border-input flex w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                            />
                            {errors.complaint && <p className="text-sm text-red-500">{errors.complaint}</p>}
                        </div>

                        {isAdmin && (
                            <p className="text-sm text-muted-foreground">
                                Sebagai admin, janji temu akan ditautkan ke pasien yang sesuai.
                            </p>
                        )}

                        <div className="flex gap-2">
                            <Button type="submit" disabled={processing || !slot}>
                                Simpan
                            </Button>
                            <Link href={route('appointments.index')}>
                                <Button variant="ghost" type="button">
                                    Batal
                                </Button>
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </AppointmentsLayout>
    );
}