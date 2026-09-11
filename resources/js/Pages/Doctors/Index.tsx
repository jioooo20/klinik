import { Head } from '@inertiajs/react';

import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import AdminLayout from '@/Layouts/AdminLayout';

interface DoctorRow {
    id: number;
    name: string | null;
    specialty: string | null;
    str_number: string | null;
    is_active: boolean;
}

interface PaginatedDoctors {
    data: DoctorRow[];
    links: { url: string | null; label: string; active: boolean }[];
}

interface IndexProps {
    doctors: PaginatedDoctors;
}

export default function Index({ doctors }: IndexProps) {
    return (
        <AdminLayout>
            <Head title="Daftar Dokter" />
            <Card className="mx-auto max-w-5xl">
                <CardHeader>
                    <CardTitle>Daftar Dokter</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="px-3 py-2 text-left font-medium">Nama</th>
                                    <th className="px-3 py-2 text-left font-medium">Spesialisasi</th>
                                    <th className="px-3 py-2 text-left font-medium">No. STR</th>
                                    <th className="px-3 py-2 text-left font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {doctors.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="py-8 text-center text-muted-foreground">
                                            Belum ada data dokter.
                                        </td>
                                    </tr>
                                ) : (
                                    doctors.data.map((d) => (
                                        <tr key={d.id} className="border-b">
                                            <td className="px-3 py-2">{d.name ?? '-'}</td>
                                            <td className="px-3 py-2">{d.specialty ?? '-'}</td>
                                            <td className="px-3 py-2">{d.str_number ?? '-'}</td>
                                            <td className="px-3 py-2">
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                        d.is_active
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-slate-100 text-slate-700'
                                                    }`}
                                                >
                                                    {d.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {doctors.links.length > 0 && (
                        <div className="mt-4 flex justify-center gap-1">
                            {doctors.links.map((link, i) => (
                                <Button
                                    key={i}
                                    variant={link.active ? 'default' : 'outline'}
                                    size="sm"
                                    disabled={!link.url}
                                    onClick={() => link.url && window.location.assign(link.url)}
                                >
                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                </Button>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </AdminLayout>
    );
}