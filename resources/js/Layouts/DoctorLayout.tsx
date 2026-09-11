import { ReactNode } from 'react';

import RoleLayout, { NavItem } from '@/Layouts/RoleLayout';

const nav: NavItem[] = [
    { label: 'Dasbor', href: '/dashboard/doctor' },
    { label: 'Antrean Hari Ini', href: '/appointments' },
    { label: 'Pasien Saya', href: '/patients' },
    { label: 'Rekam Medis', href: '/patients' },
];

export default function DoctorLayout({ children }: { children: ReactNode }) {
    return (
        <RoleLayout title="Portal Dokter" accent="text-emerald-600" nav={nav}>
            {children}
        </RoleLayout>
    );
}