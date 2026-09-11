import { ReactNode } from 'react';

import { usePage } from '@inertiajs/react';

import AdminLayout from '@/Layouts/AdminLayout';
import DoctorLayout from '@/Layouts/DoctorLayout';
import PatientLayout from '@/Layouts/PatientLayout';

interface SharedProps {
    auth: {
        user: { id: number; name: string; email: string } | null;
        roles: string[];
    };
}

/**
 * Role-aware shell for the Appointments pages.
 *
 * Appointments are shared by all three roles, so pick the matching shell from
 * the shared Inertia auth props instead of hard-coding one layout.
 */
export default function AppointmentsLayout({ children }: { children: ReactNode }) {
    const { auth } = usePage<SharedProps>().props;
    const roles = auth.roles ?? [];

    if (roles.includes('admin')) {
        return <AdminLayout>{children}</AdminLayout>;
    }

    if (roles.includes('dokter')) {
        return <DoctorLayout>{children}</DoctorLayout>;
    }

    return <PatientLayout>{children}</PatientLayout>;
}