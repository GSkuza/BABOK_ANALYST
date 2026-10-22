# STAGE 1: PRODUCT & REPOSITORY BASELINE

**Initiative ID:** SD-20260101-ABCD
**Baseline ID:** sample-app/baseline-01
**Date:** 2026-03-01
**Status:** APPROVED

---

## Executive Summary

Baseline diagnostic for Sample Core Services platform.

---

## Repository Inventory & Pinned Commits

| Repository | Host | Ref | Commit SHA | Dirty Tree? | Excluded Areas |
|------------|------|-----|------------|-------------|----------------|
| sample-core | github | main | a1b2c3d4e5f67890123456789abcdef012345678 | No | vendored deps |

---

## Business Context

**Purpose:** Provide unified authentication and profile lookup (EV-001).

**Users:** Internal microservices and partner gateways (EV-002).

**Domain rules:** Tokens expire after 3600 seconds with mandatory TLS 1.3 (EV-001).

**Prior decisions:** Migrated to OAuth2 standard in Q4.

---

## Technology Context

**Modules & entry points:** API gateway server.js and auth router (EV-001).

**Dependencies:** Node.js v20 LTS, Express v4.19, PostgreSQL 16.

**Data models & APIs:** REST API with bearer token header (EV-002).

**Tests:** Unit and integration suite with 85% branch coverage.

---

## System Inventory

| System / Component | Repository | Role | Evidence |
|---------------------|------------|------|----------|
| AuthGateway | sample-core | Ingress authentication | EV-001 |

---

## Architecture Context

**Component boundaries:** AuthGateway handles token verification and rate limiting.

**Data flow:** Inbound HTTPS requests are authenticated before proxy dispatch.

---

## SDLC Context

**CI/CD:** GitHub Actions workflow running lint and unit tests on pull requests.

**Deployment:** Containerized deployment to Kubernetes staging cluster.

---

## Baseline Metrics

| Metric | Current Value | Source | Confidence |
|--------|---------------|--------|------------|
| Test Coverage | 85% | CI coverage report | High |
| Build Duration | 120s | GitHub Actions log | High |

---

## Evidence Ledger

| ID | Repository | Ref/Commit | Path / Symbol | Claim Supported |
|----|------------|------------|---------------|-----------------|
| EV-001 | sample-core | main#a1b2c3d | src/server.js | Auth token validation |
| EV-002 | sample-core | main#a1b2c3d | src/routes/user.js | Profile lookup contract |

---

## Assumptions & Open Gaps

| ID | Statement | Type | Impact | Confidence |
|----|-----------|------|--------|------------|
| A-001 | Redis cache cluster availability exceeds 99.9% | Assumption | Session latency | High |
| A-002 | Token validation throughput reaches 500 rps | Hypothesis | Peak load scaling | Medium |
