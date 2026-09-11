<?php

namespace App\Observers;

use App\Models\MedicalRecord;

/**
 * Audit trail for medical records (KLK-026 / BR-10).
 *
 * Records every create/update with the acting user and timestamp, while
 * keeping sensitive SOAP narrative out of the activity properties.
 */
class MedicalRecordObserver
{
    /** Fields whose values must never be written to the audit log (BR-11). */
    private const SENSITIVE = ['subjective', 'objective', 'assessment', 'plan'];

    public function created(MedicalRecord $record): void
    {
        $properties = $this->redact($record->getAttributes(), '[redacted]');
        unset($properties['created_at'], $properties['updated_at']);

        $this->write($record, 'created', $properties, 'Rekam medis dibuat');
    }

    public function updated(MedicalRecord $record): void
    {
        $properties = $this->redact($record->getChanges(), '[changed]');
        unset($properties['updated_at']);

        if ($properties === []) {
            return;
        }

        $this->write($record, 'updated', $properties, 'Rekam medis diperbarui');
    }

    /**
     * @param  array<string, mixed>  $properties
     */
    private function write(MedicalRecord $record, string $event, array $properties, string $description): void
    {
        $logger = activity('medical_record')
            ->performedOn($record)
            ->withProperties($properties)
            ->event($event);

        $causer = auth()->user();

        if ($causer !== null) {
            $logger->causedBy($causer);
        }

        $logger->log($description);
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    private function redact(array $attributes, string $placeholder): array
    {
        foreach (self::SENSITIVE as $key) {
            if (array_key_exists($key, $attributes)) {
                $attributes[$key] = $placeholder;
            }
        }

        return $attributes;
    }
}
