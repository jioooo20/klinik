import { Link, usePage } from '@inertiajs/react';
import { ReactNode } from 'react';

import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';

export interface NavItem {
    label: string;
    href: string;
    icon?: ReactNode;
}

interface RoleLayoutProps {
    title: string;
    accent: string;
    nav: NavItem[];
    children: ReactNode;
}

interface SharedProps {
    auth: {
        user: { id: number; name: string; email: string } | null;
        roles: string[];
    };
}

/**
 * Shared role-aware shell: sidebar navigation + header with logout.
 */
export default function RoleLayout({ title, accent, nav, children }: RoleLayoutProps) {
    const { auth } = usePage<SharedProps>().props;
    const current = typeof window !== 'undefined' ? window.location.pathname : '';

    return (
        <div className="flex min-h-screen bg-slate-50">
            <aside className="hidden w-64 flex-col border-r bg-white p-4 md:flex">
                <div className={cn('mb-6 px-2 text-lg font-bold', accent)}>{title}</div>
                <nav className="flex flex-1 flex-col gap-1">
                    {nav.map((item) => {
                        const active = current === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                    active
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : 'text-slate-600 hover:bg-slate-100',
                                )}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            <div className="flex flex-1 flex-col">
                <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
                    <div className="text-sm text-slate-500">Klinik MVP</div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-slate-700">
                            {auth.user?.name}
                        </span>
                        <Link href={route('logout')} method="post" as="button">
                            <Button variant="outline" size="sm">
                                Keluar
                            </Button>
                        </Link>
                    </div>
                </header>

                <main className="flex-1 p-4 md:p-6">{children}</main>
            </div>
        </div>
    );
}