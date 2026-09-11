<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

/**
 * KLK-027 / BR-11: encrypt already-stored plaintext SOAP narrative.
 *
 * The MedicalRecord model now casts subjective/objective/assessment/plan with
 * Laravel's `encrypted` cast. Existing rows written before that change would
 * otherwise fail to decrypt, so encrypt them in place using the same
 * Crypt::encryptString cipher the cast expects.
 */
return new class extends Migration
{
    /** @var array<int, string> */
    private array $columns = ['subjective', 'objective', 'assessment', 'plan'];

    public function up(): void
    {
        DB::table('medical_records')
            ->select(array_merge(['id'], $this->columns))
            ->orderBy('id')
            ->chunkById(100, function ($rows): void {
                foreach ($rows as $row) {
                    $update = [];

                    foreach ($this->columns as $column) {
                        $value = $row->{$column};

                        if ($value !== null && $value !== '' && ! $this->isEncrypted($value)) {
                            $update[$column] = Crypt::encryptString($value);
                        }
                    }

                    if ($update !== []) {
                        DB::table('medical_records')->where('id', $row->id)->update($update);
                    }
                }
            });
    }

    public function down(): void
    {
        DB::table('medical_records')
            ->select(array_merge(['id'], $this->columns))
            ->orderBy('id')
            ->chunkById(100, function ($rows): void {
                foreach ($rows as $row) {
                    $update = [];

                    foreach ($this->columns as $column) {
                        $value = $row->{$column};

                        if ($value !== null && $value !== '' && $this->isEncrypted($value)) {
                            $update[$column] = Crypt::decryptString($value);
                        }
                    }

                    if ($update !== []) {
                        DB::table('medical_records')->where('id', $row->id)->update($update);
                    }
                }
            });
    }

    private function isEncrypted(string $value): bool
    {
        try {
            Crypt::decryptString($value);

            return true;
        } catch (Throwable) {
            return false;
        }
    }
};
