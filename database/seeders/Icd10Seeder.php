<?php

namespace Database\Seeders;

use App\Models\Icd10Code;
use Illuminate\Database\Seeder;

/**
 * Starter ICD-10 dataset (EMR-06).
 *
 * A practical subset covering the presentations a small Indonesian clinic
 * sees most often. `upsert` keeps the seeder idempotent and re-runnable.
 */
class Icd10Seeder extends Seeder
{
    /**
     * @var array<int, array{0: string, 1: string, 2: string}>
     */
    private const CODES = [
        // Infectious & parasitic
        ['A09', 'Diare dan gastroenteritis, diduga infeksius', 'Infeksi'],
        ['A15', 'Tuberkulosis paru', 'Infeksi'],
        ['B34.9', 'Infeksi virus, tidak spesifik', 'Infeksi'],
        ['B01.9', 'Varicella (cacar air)', 'Infeksi'],
        ['A90', 'Demam berdarah dengue (DBD)', 'Infeksi'],
        ['B50.9', 'Malaria, tidak spesifik', 'Infeksi'],
        ['A01.0', 'Demam tifoid', 'Infeksi'],

        // Respiratory
        ['J00', 'Nasofaringitis akut (common cold)', 'Respirasi'],
        ['J06.9', 'Infeksi saluran napas atas akut, tidak spesifik', 'Respirasi'],
        ['J18.9', 'Pneumonia, tidak spesifik', 'Respirasi'],
        ['J02.9', 'Faringitis akut, tidak spesifik', 'Respirasi'],
        ['J03.9', 'Tonsilitis akut, tidak spesifik', 'Respirasi'],
        ['J30.1', 'Rinitis alergi', 'Respirasi'],
        ['J45.9', 'Asma, tidak spesifik', 'Respirasi'],
        ['J44.9', 'Penyakit paru obstruktif kronik (PPOK)', 'Respirasi'],

        // Digestive
        ['K30', 'Dispepsia', 'Digestif'],
        ['K29.7', 'Gastritis, tidak spesifik', 'Digestif'],
        ['K21.0', 'Penyakit refluks gastroesofageal (GERD) dengan esofagitis', 'Digestif'],
        ['K59.0', 'Konstipasi', 'Digestif'],

        // Cardiovascular
        ['I10', 'Hipertensi esensial (primer)', 'Kardiovaskular'],
        ['I25.9', 'Penyakit jantung iskemik kronik, tidak spesifik', 'Kardiovaskular'],
        ['I50.9', 'Gagal jantung, tidak spesifik', 'Kardiovaskular'],

        // Endocrine & metabolic
        ['E11.9', 'Diabetes melitus tipe 2 tanpa komplikasi', 'Endokrin'],
        ['E78.5', 'Hiperlipidemia, tidak spesifik', 'Endokrin'],
        ['E03.9', 'Hipotiroidisme, tidak spesifik', 'Endokrin'],

        // Musculoskeletal
        ['M54.5', 'Nyeri punggung bawah', 'Muskuloskeletal'],
        ['M79.1', 'Mialgia', 'Muskuloskeletal'],
        ['M25.5', 'Nyeri sendi', 'Muskuloskeletal'],
        ['M17.9', 'Osteoartritis lutut, tidak spesifik', 'Muskuloskeletal'],

        // Neurological
        ['G43.9', 'Migrain, tidak spesifik', 'Neurologi'],
        ['G44.2', 'Nyeri kepala tipe tegang', 'Neurologi'],
        ['R51', 'Nyeri kepala', 'Neurologi'],

        // Skin
        ['L30.9', 'Dermatitis, tidak spesifik', 'Kulit'],
        ['L20.9', 'Dermatitis atopik, tidak spesifik', 'Kulit'],
        ['L50.9', 'Urtikaria, tidak spesifik', 'Kulit'],
        ['B35.9', 'Dermatofitosis (tinea), tidak spesifik', 'Kulit'],

        // Genitourinary
        ['N39.0', 'Infeksi saluran kemih (ISK), lokasi tidak spesifik', 'Genitourinari'],
        ['N30.9', 'Sistitis, tidak spesifik', 'Genitourinari'],

        // Symptoms & signs
        ['R50.9', 'Demam, tidak spesifik', 'Gejala'],
        ['R05', 'Batuk', 'Gejala'],
        ['R11', 'Mual dan muntah', 'Gejala'],
        ['R42', 'Pusing dan pusing berputar (vertigo)', 'Gejala'],
        ['R53', 'Malaise dan kelelahan', 'Gejala'],

        // Pregnancy-related
        ['Z34.9', 'Pengawasan kehamilan normal, tidak spesifik', 'Obstetri'],

        // Health checks
        ['Z00.0', 'Pemeriksaan kesehatan umum', 'Pemeriksaan'],
        ['Z76.0', 'Penerbitan resep ulang', 'Pemeriksaan'],
    ];

    public function run(): void
    {
        $now = now();

        $rows = array_map(
            fn (array $code): array => [
                'code' => $code[0],
                'name' => $code[1],
                'category' => $code[2],
                'created_at' => $now,
                'updated_at' => $now,
            ],
            self::CODES,
        );

        Icd10Code::query()->upsert($rows, ['code'], ['name', 'category', 'updated_at']);

        $this->command?->info(sprintf('Seeded: %d ICD-10 codes.', count($rows)));
    }
}
