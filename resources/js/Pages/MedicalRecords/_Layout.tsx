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
 * Role-aware shell for the MedicalRecords pages.
 *
 * The listing/detail routes are shared by `admin` and `dokter`; the create/edit
 * routes are dokter-only. Pick the shell from the shared Inertia auth props.
 */
export default function MedicalRecordsLayout({ children }: { children: ReactNode }) {
    const { auth } = usePage<SharedProps>().props;
    const isDoctor = auth.roles?.includes('dokter') && !auth.roles?.includes('admin');

    return isDoctor ? <DoctorLayout>{children}</DoctorLayout> : <AdminLayout>{children}</AdminLayout>;
}