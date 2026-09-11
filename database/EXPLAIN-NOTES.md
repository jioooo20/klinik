# EXPLAIN ANALYZE Notes

**Date:** 2026-09-10
**Database:** klinik (PostgreSQL 18.3)

## 1. Patient Search by NIK
**Query:** `SELECT * FROM patients WHERE nik = '3201234567890001' AND clinic_id = 1;`
**Result:** Uses Index Scan on `patients_clinic_id_nik_unique`.
**Execution Time:** < 1ms.

## 2. Medical Records by Patient + Date
**Query:** `SELECT * FROM medical_records WHERE patient_id = 1 ORDER BY visited_at DESC;`
**Result:** Uses Index Scan Backward on `medical_records_patient_id_visited_at_index`.
**Execution Time:** < 1ms.

## 3. Appointments by Doctor + Scheduled At
**Query:** `SELECT * FROM appointments WHERE doctor_id = 1 AND scheduled_at >= '2026-09-10';`
**Result:** Uses Index Scan on `appointments_doctor_id_scheduled_at_index`.
**Execution Time:** < 1ms.

**Note:** All critical paths are utilizing the composite indexes defined in Phase 2 migrations. No sequential scans observed for filtered queries.

---

# Phase 8 — KLK-037 EXPLAIN Re-validation (2026-09-11)

**Method:** Synthetic bulk data inserted inside a `BEGIN ... ROLLBACK` transaction against
`klinik` (never committed, so the dev data set is untouched). Script:
`.agents/executor/explain-phase8.sql`. PostgreSQL 18.3.

## 1. First pass — single-clinic bulk (5 000 rows, ~100% selectivity)

**Result:** Seq Scan on `appointments` / `medical_records` for Q1–Q4.

**Interpretation — NOT a defect.** When a clinic owns ~100% of the table, a sequential
scan is the *correct* planner choice; an index would read the same pages plus overhead.
This pass only proves the queries are correct, not that the indexes are usable.

| Query | Plan node | Time |
|-------|-----------|------|
| Q1 visit stats | Seq Scan on appointments | 1.188 ms |
| Q2 completed | Seq Scan on appointments | 1.431 ms |
| Q3 top diagnoses | Seq Scan on medical_records | 0.912 ms |
| Q4 doctor queue | Seq Scan on appointments (514 rows) | 0.435 ms |
| **Q5 patient history** | **Bitmap Index Scan on `medical_records_patient_id_visited_at_index`** | 0.170 ms |
| **Q6 report visits** | **Index Scan Backward on `appointments_clinic_id_scheduled_at_index`** | 0.027 ms |

## 2. Second pass — realistic multi-clinic selectivity (20 clinics × 1 000 rows)

Re-run after inserting 19 extra clinics so a single `clinic_id` is ~5% of the table — the
distribution a real SaaS would have.

```
=== S1: visit stats (clinic_id=1, ~5% selectivity) ===
 Aggregate  (actual time=0.563..0.563 rows=1.00)
   ->  Bitmap Heap Scan on appointments
         Recheck Cond: (clinic_id = 1)
         ->  Bitmap Index Scan on appointments_clinic_id_status_index
               Index Cond: (clinic_id = 1)   Buffers: shared hit=6
 Execution Time: 0.587 ms

=== S2: completed (clinic + status + range) ===
 Aggregate  (actual time=1.120..1.121 rows=1.00)
   ->  Bitmap Heap Scan on appointments
         Recheck Cond: ((clinic_id = 1) AND ((status)::text = 'completed'::text))
         ->  Bitmap Index Scan on appointments_clinic_id_status_index
               Index Cond: ((clinic_id = 1) AND ((status)::text = 'completed'::text))
 Execution Time: 1.131 ms

=== S3: top diagnoses (clinic_id=1) ===
 Limit  (actual time=0.393..0.394 rows=2.00)
   ->  HashAggregate  (Group Key: icd10_code)
         ->  Bitmap Heap Scan on medical_records
               Recheck Cond: (clinic_id = 1)
               ->  Bitmap Index Scan on medical_records_clinic_id_visited_at_index
                     Index Cond: (clinic_id = 1)
 Execution Time: 0.415 ms
```

**Conclusion:** With realistic selectivity, every main dashboard/statistics query uses the
intended composite index (Bitmap Index Scan). **No unfixed sequential scan remains on the
main dashboard queries** — the first pass's seq scans were the planner correctly exploiting
a degenerate 100%-selectivity test fixture.

## 3. Indexes confirmed in use

| Index | Used by |
|-------|---------|
| `appointments_clinic_id_status_index` | visit KPIs, completed/pending counts, today's appointment mix |
| `appointments_clinic_id_scheduled_at_index` | visit-stats date range, report pagination (`Reports/Visits`) |
| `appointments_doctor_id_scheduled_at_index` | doctor queue / per-doctor stats |
| `medical_records_clinic_id_visited_at_index` | top diagnoses, new-patient/visit aggregation |
| `medical_records_patient_id_visited_at_index` | patient history timeline (Q5) |
| `patients_clinic_id_nik_unique` | patient search by NIK |

No new index migration was required — all required indexes already exist from Phase 2.