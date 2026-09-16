<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * KLK-026 / BR-05: lebarkan kolom icd10_code.
 *
 * Form rekam medis mengirim BEBERAPA kode ICD-10 sekaligus, lalu controller
 * menggabungkannya dengan koma ke dalam satu kolom
 * (MedicalRecordController::joinCodes). Kolom lama bertipe varchar(10),
 * sehingga memilih 18 kode menghasilkan ~96 karakter dan PostgreSQL menolak
 * dengan SQLSTATE[22001] "value too long for type character varying(10)".
 *
 * varchar(255) cukup untuk ~20 kode @10 karakter + 19 pemisah koma (219
 * karakter) dan tetap kompatibel dengan index
 * medical_records_icd10_code_index — PostgreSQL otomatis membangun ulang
 * index saat tipe kolom berubah, jadi index tidak perlu di-drop manual.
 */
return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('medical_records', function (Blueprint $table): void {
            $table->string('icd10_code', 255)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     *
     * PERINGATAN: rollback ini TIDAK aman bila sudah ada baris dengan panjang
     * icd10_code > 10. PostgreSQL akan menggagalkan ALTER TABLE (aman, tidak
     * memotong data), tetapi rollback tidak akan selesai sampai baris tersebut
     * dibersihkan. Pada mesin ini seluruh data lama <= 5 karakter, jadi
     * rollback masih bersih.
     */
    public function down(): void
    {
        Schema::table('medical_records', function (Blueprint $table): void {
            $table->string('icd10_code', 10)->nullable()->change();
        });
    }
};