# WILLSHOP OS — BACKUP & DISASTER RECOVERY PLAN

This document outlines the backup strategies, disaster recovery procedures, Recovery Point Objectives (RPO), and Recovery Time Objectives (RTO) for WillShop OS.

---

## 🎯 OBJECTIVES & TARGETS

| Metric | Target | Description |
| :--- | :--- | :--- |
| **RPO (Recovery Point Objective)** | **< 5 minutes** | Maximum allowable data loss window in case of major outage. |
| **RTO (Recovery Time Objective)** | **< 30 minutes** | Maximum acceptable downtime to restore system operations. |
| **Backup Frequency** | Daily WAL + Continuous PITR | PostgreSQL Point-In-Time-Recovery active for 7 days minimum. |

---

## 💾 BACKUP ARCHITECTURE

### 1. Database (Supabase PostgreSQL)
- **Point-In-Time-Recovery (PITR):** Continuous Write-Ahead Log (WAL) archiving allows restoring the database to any millisecond within the past 7 days.
- **Daily Automated Physical Snapshots:** Executed every night at 02:00 UTC, retained for 30 days in multi-region encrypted S3/GCS buckets.
- **Logical Dump Backup (Nightly):** `pg_dump` executed via cron script, uploaded to secondary offsite backup storage (`s3://willshop-db-backups-offsite/`).

### 2. Storage Buckets (`payment-receipts`, `chat-media`)
- **Bucket Versioning:** Object versioning enabled to prevent accidental deletion or overwrite.
- **Cross-Region Replication:** Asynchronous replication to secondary storage region.

---

## 🔄 RESTORATION & RECOVERY PROCEDURES

### Scenario A: Accidental Data Corruption or Deletion
1. Identify exact timestamp of corruption (e.g., `2026-09-05 14:22:10 UTC`).
2. Open Supabase Dashboard -> **Database** -> **Backups** -> **Point in Time Restore**.
3. Select timestamp `2026-09-05 14:22:00 UTC` (10 seconds prior to incident).
4. Restore to new target database instance `willshop-restored-temp`.
5. Run Data Consistency Engine (`DataConsistencyEngine.ts`) on restored database to verify state integrity.
6. Swap connection string in Vercel environment variables to point to restored database.

### Scenario B: Database Instance Hard Failure
1. Trigger disaster recovery alert.
2. Spin up standby PostgreSQL instance from latest nightly dump or PITR base backup.
3. Run pending database migrations:
   ```bash
   npx supabase db push
   ```
4. Update Vercel environment variable `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
5. Redeploy Vercel production build.
6. Execute Golden Path E2E test suite to verify 100% operational health.

---

## 🧪 BACKUP DRILL SCHEDULE

- **Monthly Drill:** Perform dry-run Point-In-Time-Recovery on staging environment.
- **Quarterly Drill:** Perform full database restore from offsite `pg_dump` snapshot and run full automated UAT & integration test suites.
