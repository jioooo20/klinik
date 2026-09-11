<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * ICD-10 reference code (EMR-06).
 *
 * Global dataset shared across clinics — no tenant scope on purpose.
 */
class Icd10Code extends Model
{
    protected $table = 'icd10_codes';

    protected $fillable = [
        'code',
        'name',
        'category',
    ];

    /**
     * Autocomplete search by code or name.
     *
     * @return Builder<Icd10Code>
     */
    public static function search(?string $term, int $limit = 20): Builder
    {
        return static::query()
            ->when($term, function (Builder $query, string $term): void {
                $like = '%'.str_replace(['%', '_'], ['\\%', '\\_'], $term).'%';
                $query->where(function (Builder $q) use ($like): void {
                    $q->where('code', 'ilike', $like)
                        ->orWhere('name', 'ilike', $like);
                });
            })
            ->orderBy('code')
            ->limit($limit);
    }
}
