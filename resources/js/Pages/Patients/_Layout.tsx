import { ReactNode } from 'react';

import { usePage } from '@inertiajs/react';

import AdminLayout from '@/Layouts/AdminLayout';
import DoctorLayout from '@/Layouts/DoctorLayout';

interface SharedProps {
    auth: {
        user: { id: number; name: string; email: string } | null;
        roles: string[];
    };
}

/**
 * Role-aware shell for the Patients pages.
 *
 * The routes are shared by `admin` and `dokter`, so pick the matching shell
 * from the shared Inertia `auth.roles` prop instead of hard-coding one layout.
 */
export default function PatientsLayout({ children }: { children: ReactNode }) {
    const { auth } = usePage<SharedProps>().props;
    const isDoctor = auth.roles?.includes('dokter') && !auth.roles?.includes('admin');

    return isDoctor ? <DoctorLayout>{children}</DoctorLayout> : <AdminLayout>{children}</AdminLayout>;
}