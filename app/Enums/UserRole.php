<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Dokter = 'dokter';
    case Pasien = 'pasien';

    public function label(): string
    {
        return match ($this) {
            self::Admin => 'Admin Klinik',
            self::Dokter => 'Dokter',
            self::Pasien => 'Pasien',
        };
    }
}
