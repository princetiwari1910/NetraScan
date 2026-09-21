# NetraScan Production Operations Runbook

## 1. System Overview & Production Architecture

NetraScan is an AI-assisted clinical retinal triage platform for early detection of Diabetic Retinopathy (DR).

| Component | Service / Hosting | Endpoint / Identifier |
| :--- | :--- | :--- |
| **Frontend UI** | Vercel Edge Global CDN | `https://netra-scan-nu.vercel.app` |
| **Production Backend** | AWS ECS Fargate Express Mode (`ap-south-1`) | `https://ne-ef6c85ddd0fc44bfbd12502b61eee466.ecs.ap-south-1.on.aws` |
| **Relational Database** | Supabase PostgreSQL 17.6 (`ap-northeast-2`) | Project Ref: `lmdyorbajnlcmckffjob` (Session Pooler Port 5432) |
| **Blob Storage** | Supabase Private Storage (`ap-northeast-2`) | Buckets: `fundus-originals`, `fundus-gradcam` |
| **Container Registry** | AWS ECR (`ap-south-1`) | `754860801240.dkr.ecr.ap-south-1.amazonaws.com/netrascan-backend` |
| **Logging & Metrics** | AWS CloudWatch (`ap-south-1`) | Log Group: `/ecs/netrascan-production` |
| **Secrets Engine** | AWS Secrets Manager (`ap-south-1`) | `netrascan/production/*` |
| **Rollback Standby** | Modal Serverless Backend | `https://princetiwari1910--netrascan-backend-fastapi-app.modal.run` |

---

## 2. Health & Telemetry Endpoints

- **System Health**: `GET https://ne-ef6c85ddd0fc44bfbd12502b61eee466.ecs.ap-south-1.on.aws/health`
  - Expected: `HTTP 200` with `{"status": "healthy", "mode": "live", ...}`
- **ONNX Model Health**: `GET https://ne-ef6c85ddd0fc44bfbd12502b61eee466.ecs.ap-south-1.on.aws/health/model`
  - Expected: `HTTP 200` with `{"status": "ready", "model": "NetraScan ResNet-18", ...}`

---

## 3. CloudWatch Alarms & Monitoring

| Alarm Name | Metric | Threshold | Period | Evaluation |
| :--- | :--- | :---: | :---: | :---: |
| `netrascan-prod-5xx-high` | `HTTPCode_Target_5XX_Count` | `> 5.0` | 300s (5 min) | 1 period |
| `netrascan-prod-target-unhealthy` | `HealthyHostCount` | `< 1.0` | 60s (1 min) | 2 periods |

---

## 4. Production Deployment Verification Steps

To verify any new deployment or container update:

1. **Verify Target Health**:
   ```bash
   aws elbv2 describe-target-health \
     --target-group-arn arn:aws:elasticloadbalancing:ap-south-1:754860801240:targetgroup/netrascan-prod-tg/9ccfddd9c0085da4 \
     --region ap-south-1
   ```
2. **Check System Health**:
   ```bash
   curl -s -i "https://ne-ef6c85ddd0fc44bfbd12502b61eee466.ecs.ap-south-1.on.aws/health"
   ```
3. **Verify ONNX Model Checksum**:
   Expected SHA-256: `105e88dd30f013c2439d945abdbab4ab892be71d4591332a29a204c79df8d0be`
4. **Audit CloudWatch Logs**:
   ```bash
   aws logs filter-log-events \
     --log-group-name /ecs/netrascan-production \
     --region ap-south-1 \
     --filter-pattern "ERROR"
   ```

---

## 5. Emergency Rollback Runbook

If critical degradation occurs on the AWS ECS production service:

1. **Confirm Modal Standby Health**:
   ```bash
   curl -s -i "https://princetiwari1910--netrascan-backend-fastapi-app.modal.run/health"
   ```
2. **Re-point Frontend API Base URL**:
   In `frontend/.env.production` and `frontend/src/services/api.js`, update `VITE_API_BASE_URL`:
   ```javascript
   export const API_BASE_URL = "https://princetiwari1910--netrascan-backend-fastapi-app.modal.run";
   ```
3. **Deploy Frontend Update**:
   ```bash
   git add frontend/ && git commit -m "rollback: point frontend to fallback backend" && git push origin main
   ```
4. **Verify Recovery**:
   Check `https://netra-scan-nu.vercel.app` login and patient listing.

---

## 6. Critical Operational Security Rules

1. **No Secrets in Code/Logs**: Never hardcode, log, or commit database credentials, Supabase secret keys, or JWT secrets.
2. **Private Storage Buckets**: Both `fundus-originals` and `fundus-gradcam` must always remain `public = False`. Access is strictly through time-limited cryptographic signed URLs.
3. **No PHI in Object Paths**: Storage object paths must use synthetic UUIDs (`{patient_uid}/{screening_uid}_{uuid}.jpg`).
4. **Role-Based Access Control**:
   - `SUPER_ADMIN`: Fleet-wide administrative oversight.
   - `DOCTOR`: Clinical review and sign-off (`/api/screenings/{id}/verify`).
   - `STAFF`: Patient intake and screening submission. Forbidden from signing off on doctor reviews.
5. **Tenant Isolation**: Cross-PHC access is strictly blocked at the ORM dependency level.

---

## 7. Prohibited Incident Actions (What NOT to do)

During an active incident or investigation:
- **DO NOT** delete the Modal deployment (`princetiwari1910--netrascan-backend-fastapi-app.modal.run`).
- **DO NOT** delete or recreate the `netrascan-staging` service.
- **DO NOT** drop database tables or modify database schemas directly.
- **DO NOT** make Supabase Storage buckets public.
- **DO NOT** delete historical patient or screening rows in Supabase.
- **DO NOT** rotate production secrets without staging the replacement secret first.

---

## 8. Performance Baseline Reference

| Endpoint / Operation | Target Latency (p50) | Target Throughput |
| :--- | :---: | :---: |
| `GET /health` | ~47–68 ms | > 150 RPS |
| `GET /api/patients` | ~1.1–1.6 s | > 5 RPS |
| `GET /api/screenings` | ~1.4–1.5 s | > 5 RPS |
| `POST /api/screenings` (AI Inference) | ~2.8–3.0 s | ~0.5–1.0 RPS |

---

## 9. 14-Day Production Bake-In

- **Bake-In Start Timestamp**: `2026-09-21 21:05:00 UTC` (`2026-09-22 02:35:00 IST`)
- **Bake-In Evaluation Period**: 14 calendar days
- **Bake-In Criteria**:
  - Zero unhandled fatal exceptions.
  - Zero sustained 5xx alarms on `netrascan-prod-5xx-high`.
  - Target healthy host count remains `1.0`.
  - 100% availability of patient intake, ONNX AI inference, and signed URL generation.
  - Modal standby preserved throughout the entire bake window.
