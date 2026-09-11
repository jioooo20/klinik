import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, FormEvent } from 'react';

import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import PatientsLayout from '@/Pages/Patients/_Layout';

interface SharedProps {
    auth: {
        user: { id: number; name: string; email: string } | null;
        roles: string[];
    };
}

interface PatientRow {
    id: number;
    nik: string | null;
    name: string;
    date_of_birth: string | null;
    gender: string | null;
    phone: string | null;
}

interface PaginatedPatients {
    data: PatientRow[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
}

interface IndexProps {
    patients: PaginatedPatients;
    filters: { search: string };
}

export default function Index({ patients, filters }: IndexProps) {
    const { auth } = usePage<SharedProps>().props;
    const isAdmin = auth.roles?.includes('admin') ?? false;
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get('/patients', { search }, { preserveState: true });
    };

    return (
        <PatientsLayout>
            <Head title="Daftar Pasien" />
            <Card className="mx-auto max-w-5xl">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Daftar Pasien</CardTitle>
                        {isAdmin && (
                            <Link href={route('patients.create')}>
                                <Button>Tambah Pasien</Button>
                            </Link>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="mb-4 flex gap-2">
                        <Input
                            type="text"
                            placeholder="Cari nama atau NIK..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="max-w-sm"
                        />
                        <Button type="submit">Cari</Button>
                    </form>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="px-3 py-2 text-left font-medium">NIK</th>
                                    <th className="px-3 py-2 text-left font-medium">Nama</th>
                                    <th className="px-3 py-2 text-left font-medium">Tgl Lahir</th>
                                    <th className="px-3 py-2 text-left font-medium">Gender</th>
                                    <th className="px-3 py-2 text-left font-medium">Telepon</th>
                                    <th className="px-3 py-2 text-left font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {patients.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-muted-foreground">
                                            Belum ada data pasien.
                                        </td>
                                    </tr>
                                ) : (
                                    patients.data.map((p) => (
                                        <tr key={p.id} className="border-b">
                                            <td className="px-3 py-2">{p.nik ?? '-'}</td>
                                            <td className="px-3 py-2 font-medium">{p.name}</td>
                                            <td className="px-3 py-2">{p.date_of_birth ?? '-'}</td>
                                            <td className="px-3 py-2 capitalize">{p.gender ?? '-'}</td>
                                            <td className="px-3 py-2">{p.phone ?? '-'}</td>
                                            <td className="px-3 py-2">
                                                <Link
                                                    href={route('patients.show', p.id)}
                                                    className="text-indigo-600 hover:underline"
                                                >
                                                    Detail
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {patients.links.length > 0 && (
                        <div className="mt-4 flex justify-center gap-1">
                            {patients.links.map((link, i) => (
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
        </PatientsLayout>
    );
}
