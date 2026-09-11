import { Head } from '@inertiajs/react';

import { Button } from '@/Components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';

interface WelcomeProps {
    message: string;
}

export default function Welcome({ message }: WelcomeProps) {
    const homeUrl = route('welcome');

    return (
        <>
            <Head title="Welcome" />
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl text-indigo-600">Klinik MVP</CardTitle>
                        <CardDescription>{message}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground text-sm">
                            Route helper: <code>{homeUrl}</code>
                        </p>
                        <Button>Mulai</Button>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}