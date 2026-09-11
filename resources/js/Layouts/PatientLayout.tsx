import { ReactNode } from 'react';

import RoleLayout, { NavItem } from '@/Layouts/RoleLayout';

const nav: NavItem[] = [
    { label: 'Dasbor', href: '/dashboard/patient' },
    { label: 'Janji Temu Saya', href: '/appointments' },
    { label: 'Buat Janji Temu', href: '/appointments/create' },
];

export default function PatientLayout({ children }: { children: ReactNode }) {
    return (
        <RoleLayout title="Portal Pasien" accent="text-sky-600" nav={nav}>
            {children}
        </RoleLayout>
    );
}