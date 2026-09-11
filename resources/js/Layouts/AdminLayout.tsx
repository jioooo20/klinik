import { ReactNode } from 'react';

import RoleLayout, { NavItem } from '@/Layouts/RoleLayout';

const nav: NavItem[] = [
    { label: 'Dasbor', href: '/dashboard/admin' },
    { label: 'Pasien', href: '/patients' },
    { label: 'Dokter', href: '/doctors' },
    { label: 'Janji Temu', href: '/appointments' },
    { label: 'Laporan', href: '/reports/visits' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <RoleLayout title="Admin Klinik" accent="text-indigo-600" nav={nav}>
            {children}
        </RoleLayout>
    );
}