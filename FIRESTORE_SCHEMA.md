# Founder Space — Firestore Database Schema

> Platform: NoCap VC / Founder Space  
> Stack: Firebase Auth (Google Sign-In) + Firestore + Firebase Storage  
> Last updated: April 2026

---

## Overview

```
firestore/
├── users/{uid}
├── ideas/{ideaId}
│   └── updates/{updateId}          ← subcollection
├── ratings/{ratingId}
├── comments/{commentId}
└── wantToWork/{wantToWorkId}
```

---

## Collection 1: `users`

**Path:** `/users/{uid}`  
**Created when:** User signs in with Google for the first time.

| Field | Type | Required | Notes |
|---|---|---|---|
| `uid` | string | ✓ | Firebase Auth UID — matches document ID |
| `name` | string | ✓ | Display name from Google / editable |
| `title` | string | | LinkedIn-style tagline e.g. "Founder @ BYAJ · Fintech" |
| `whatImBuilding` | string | | 2–3 lines, max 300 chars |
| `linkedin` | string | | Full URL |
| `twitter` | string | | Full URL |
| `contactEmail` | string | | Publicly visible contact |
| `photoURL` | string | | Firebase Storage URL or Google photo |
| `role` | enum | ✓ | `"founder"` \| `"investor"` \| `"talent"` \| `"enthusiast"` |
| `isAdmin` | boolean | ✓ | Default `false`. Only set via Firebase console or Cloud Function |
| `createdAt` | timestamp | ✓ | Server timestamp on first sign-in |
| `updatedAt` | timestamp | ✓ | Server timestamp on profile edit |

**Example document:**
```json
{
  "uid": "abc123",
  "name": "Anuj Lahoti",
  "title": "Founder @ BYAJ · Fintech | GRE Quant 170",
  "whatImBuilding": "Democratizing stock lending for India's 8.5Cr retail investors. BYAJ turns idle demat holdings into passive yield — safely, simply, in real time.",
  "linkedin": "https://www.linkedin.com/in/anujlahotii/",
  "twitter": "https://twitter.com/anujlahotii",
  "contactEmail": "anuj@nocapvc.in",
  "photoURL": "https://storage.googleapis.com/...",
  "role": "founder",
  "isAdmin": true,
  "createdAt": "2026-04-05T00:00:00Z",
  "updatedAt": "2026-04-05T00:00:00Z"
}
```

---

## Collection 2: `ideas`

**Path:** `/ideas/{ideaId}`  
**Auto-ID:** Yes (Firestore auto-generated)  
**Created when:** Founder submits a pitch via the idea submission form.

### Status lifecycle
```
draft → pending_review → published
                      ↘ rejected (with rejectionReason)
```

### Core fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | ✓ | Firestore auto-ID (stored for convenience) |
| `authorUid` | string | ✓ | References `/users/{uid}` |
| `status` | enum | ✓ | `"draft"` \| `"pending_review"` \| `"published"` \| `"rejected"` |
| `rejectionReason` | string | | Only present if `status === "rejected"` |
| `submittedAt` | timestamp | ✓ | When submitted for review |
| `publishedAt` | timestamp | | Set by admin on approval |
| `viewCount` | number | ✓ | Default `0`, incremented client-side |
| `wantToWorkCount` | number | ✓ | Denormalized from `wantToWork` collection |
| `shareCount` | number | ✓ | Default `0` |

### Metadata

| Field | Type | Required | Notes |
|---|---|---|---|
| `ideaTitle` | string | ✓ | Startup / idea name e.g. "BYAJ" |
| `tagline` | string | ✓ | One-liner max 140 chars |
| `category` | enum | ✓ | `"fintech"` \| `"edtech"` \| `"healthtech"` \| `"saas"` \| `"ecommerce"` \| `"deeptech"` \| `"other"` |
| `stage` | enum | ✓ | `"idea"` \| `"mvp"` \| `"early_stage"` \| `"growth"` |
| `location` | string | | e.g. "Bengaluru, India" |
| `createdAt` | timestamp | ✓ | |
| `updatedAt` | timestamp | ✓ | |

### Pitch deck node fields
*Each main node maps to one slide of the Ratan Tata pitch deck template.*

| Field | Type | Max | Pitch Deck Slide |
|---|---|---|---|
| `problemTitle` | string | 100 | PROBLEM — headline |
| `problemBody` | string | 300 | What problem are you solving? Validate with real-life examples |
| `revealTitle` | string | 100 | INSIGHT / REVEAL — what did you discover? |
| `revealBody` | string | 300 | The unique insight that led to the idea |
| `solutionTitle` | string | 100 | SOLUTION |
| `solutionBody` | string | 300 | What is your solution? USP — what makes it "never-before"? |
| `marketTitle` | string | 100 | TARGET MARKET |
| `marketBody` | string | 300 | Market size, customer profiling, distribution channels |
| `askTitle` | string | 100 | THE ASK / FUNDING SO FAR |
| `askBody` | string | 300 | Funding raised, soft commitments, what you need |

### Branch nodes (expansion cards per main node)

```
branchNodes: Array (max 4 objects)
```

| Sub-field | Type | Notes |
|---|---|---|
| `id` | string | UUID generated client-side |
| `parentNode` | enum | `"problem"` \| `"reveal"` \| `"solution"` \| `"market"` \| `"ask"` |
| `label` | string | Short tab label e.g. "Revenue Model", "Competition" |
| `title` | string | Heading, max 100 chars |
| `body` | string | Content, max 300 chars |
| `photoURL` | string | Optional. Firebase Storage URL |

*Branch nodes cover the remaining Ratan Tata slides: Revenue Model, Competition & Barrier to Entry, Your Product/Service, Milestones, The Team — each as an expansion off a main node.*

### Node photos (optional polaroid-style images per main node)

```
nodePhotos: {
  problem: string | null,
  reveal:  string | null,
  solution: string | null,
  market:   string | null,
  ask:      string | null
}
```

### Aggregated rating fields (denormalized for query performance)

| Field | Type | Notes |
|---|---|---|
| `ratingCount` | number | Total number of ratings |
| `avgProblemClarity` | number | Running average, 1 decimal |
| `avgMarketPotential` | number | Running average |
| `avgFounderCredibility` | number | Running average |
| `avgExecutionReadiness` | number | Running average |
| `avgOverallInvestability` | number | Running average |
| `avgOverall` | number | Mean of all 5 averages |

**Example document (abbreviated):**
```json
{
  "id": "idea_xyz789",
  "authorUid": "abc123",
  "status": "published",
  "ideaTitle": "BYAJ",
  "tagline": "Your idle stocks earn 7% yield — safely, via SEBI's SLBS framework",
  "category": "fintech",
  "stage": "idea",
  "location": "Indore, India",
  "problemTitle": "₹4.25 Lakh Crore Sitting Idle",
  "problemBody": "8.5 crore retail investors hold equity that earns zero passive income while institutions earn 8–15% on identical holdings via SLBS.",
  "solutionTitle": "BYAJ: The Retail Lending Pool",
  "solutionBody": "A gamified staking platform that aggregates retail demat holdings into an institutional-grade lending pool — NSCCL-backed, 125% collateralized.",
  "branchNodes": [
    {
      "id": "bn_001",
      "parentNode": "solution",
      "label": "Revenue Model",
      "title": "Three Revenue Streams",
      "body": "3% commission on lending yields (60%), SaaS fees from broker partners (25%), premium subscriptions ₹999/mo (15%).",
      "photoURL": null
    }
  ],
  "nodePhotos": { "problem": null, "reveal": null, "solution": "https://storage...", "market": null, "ask": null },
  "viewCount": 0,
  "wantToWorkCount": 0,
  "shareCount": 0,
  "ratingCount": 0,
  "avgOverall": 0,
  "submittedAt": "2026-04-05T10:00:00Z",
  "publishedAt": "2026-04-05T12:00:00Z",
  "createdAt": "2026-04-05T09:00:00Z",
  "updatedAt": "2026-04-05T12:00:00Z"
}
```

---

## Subcollection: `ideas/{ideaId}/updates`

**Path:** `/ideas/{ideaId}/updates/{updateId}`  
**Purpose:** Founder posts progress updates (like LinkedIn posts on an idea profile).

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | ✓ | Firestore auto-ID |
| `ideaId` | string | ✓ | Parent idea ID |
| `authorUid` | string | ✓ | Must match idea's `authorUid` |
| `tag` | string | ✓ | e.g. `"Product Launch"`, `"Funding"`, `"Milestone"`, `"Hiring"`, `"Marketing"` |
| `body` | string | ✓ | Max 300 chars |
| `createdAt` | timestamp | ✓ | |

---

## Collection 3: `ratings`

**Path:** `/ratings/{ratingId}`  
**Constraint:** One document per `(ideaId, userId)` pair — enforced by Firestore rules + composite index.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | ✓ | Firestore auto-ID |
| `ideaId` | string | ✓ | References `/ideas/{ideaId}` |
| `userId` | string | ✓ | References `/users/{uid}` |
| `problemClarity` | number | ✓ | Integer 1–5 |
| `marketPotential` | number | ✓ | Integer 1–5 |
| `founderCredibility` | number | ✓ | Integer 1–5 |
| `executionReadiness` | number | ✓ | Integer 1–5 |
| `overallInvestability` | number | ✓ | Integer 1–5 |
| `createdAt` | timestamp | ✓ | |

**Note:** On write, a Cloud Function (or transaction) updates the `avg*` and `ratingCount` fields on the parent `/ideas/{ideaId}` document.

---

## Collection 4: `comments`

**Path:** `/comments/{commentId}`  
**Moderation:** New comments default to `"pending"`. Only approved comments are shown publicly.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | ✓ | Firestore auto-ID |
| `ideaId` | string | ✓ | References `/ideas/{ideaId}` |
| `authorUid` | string | ✓ | References `/users/{uid}` |
| `body` | string | ✓ | Max 500 chars |
| `status` | enum | ✓ | `"pending"` \| `"approved"` \| `"flagged"` — default `"pending"` |
| `parentCommentId` | string | | Optional. For threaded replies. References another `commentId` |
| `createdAt` | timestamp | ✓ | |

**Note:** The review widget (`ByajReviewWidget`) handles star ratings. The comment section is a separate UI below it — pure text discussion, no star overlap.

---

## Collection 5: `wantToWork`

**Path:** `/wantToWork/{wantToWorkId}`  
**Purpose:** Talent / investors can signal intent to join or fund an idea. One document per `(ideaId, userId)`.

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | ✓ | Firestore auto-ID |
| `ideaId` | string | ✓ | References `/ideas/{ideaId}` |
| `userId` | string | ✓ | References `/users/{uid}` |
| `note` | string | | Optional message to founder, max 200 chars |
| `createdAt` | timestamp | ✓ | |

**On write:** Increment `wantToWorkCount` on parent idea via Cloud Function or transaction.

---

## Indexes Required

```
# Composite indexes (create in Firebase Console or firestore.indexes.json)

ideas:
  - status ASC + publishedAt DESC          (feed: all published, newest first)
  - status ASC + category ASC + publishedAt DESC  (feed: filtered by category)
  - authorUid ASC + status ASC             (my ideas page)
  - status ASC + avgOverall DESC            (trending: highest rated)
  - status ASC + wantToWorkCount DESC       (trending: most wanted)
  - status ASC + viewCount DESC             (trending: most viewed)

ratings:
  - ideaId ASC + userId ASC               (one-per-user check)

comments:
  - ideaId ASC + status ASC + createdAt ASC    (load comments for idea)
  - ideaId ASC + parentCommentId ASC + createdAt ASC  (threaded replies)

wantToWork:
  - ideaId ASC + userId ASC               (one-per-user check)
  - ideaId ASC + createdAt DESC           (list who wants to work on an idea)
```

---

## Storage Buckets

```
Firebase Storage structure:

/avatars/{uid}/profile.jpg              ← User profile photos
/ideas/{ideaId}/nodes/{nodeName}.jpg    ← Polaroid node photos
/ideas/{ideaId}/branches/{branchId}.jpg ← Branch node photos
```

---

## Data Flow Summary

```
1. User signs in with Google
   → /users/{uid} created (if new)

2. Founder fills idea submission form
   → /ideas/{ideaId} created with status: "pending_review"

3. Admin reviews in Admin Console
   → Updates status to "published" or "rejected"

4. Published idea appears in Founder Space feed

5. Visitors:
   → Rate it         → /ratings/{id} created → avg* fields updated on idea
   → Comment         → /comments/{id} created (pending) → admin approves
   → Want to work    → /wantToWork/{id} created → wantToWorkCount incremented
   → Founder posts update → /ideas/{ideaId}/updates/{id} created
```

---

## firestore.rules

See `firestore.rules` file in project root.
