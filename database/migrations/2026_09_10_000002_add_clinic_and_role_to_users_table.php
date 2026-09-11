<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('clinic_id')
                ->nullable()
                ->after('id')
                ->constrained('clinics')
                ->nullOnDelete();

            $table->string('role', 20)->default('pasien')->after('password');
            $table->string('phone', 30)->nullable()->after('role');
            $table->softDeletes();

            $table->index('role');
            $table->index('clinic_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['clinic_id']);
            $table->dropIndex(['role']);
            $table->dropIndex(['clinic_id']);
            $table->dropColumn(['clinic_id', 'role', 'phone', 'deleted_at']);
        });
    }
};
