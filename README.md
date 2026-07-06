# GU256 — Project Overview

---

## What Is GU256?

GU256 is a two-tech project — it has a **Frontend** and a **Backend**. The goal is to build a complete platform around a proposed unified genomic data standard called GU256.

---

## How The Project Is Structured

### Tech Split

| Layer | Status |
|-------|--------|
| Frontend | In progress — split across two repos |
| Backend | Planned |

### Frontend Split

The frontend is being built by two people independently. Each person owns their own repo:

| Repo | Developer | Status |
|------|-----------|--------|
| `frontend_gu256` (this org) | Thackshanaramana | Pushed |
| Rohit's repo | Sri Rohit Balaji | In progress |

Both developers build their modules separately. Once both are done, we come together and blend the two designs into one unified frontend using collaborative review and Claude as a tool for deciding what to keep, what to change, and how to merge the two visual languages into one coherent product.

---

## The Plan

1. Thackshanaramana pushes his frontend module — **done**
2. Sri Rohit Balaji pushes his frontend module — **pending**
3. Both review each other's work and use Claude to analyze, compare, and decide how to blend the designs
4. The merged result becomes the final GU256 frontend
5. Backend development begins or continues in parallel

---

## Prompt — Paste This Into Claude

> Use this when you're ready to start the design review and merge process.

---

```
I am working on a project called GU256. It is a two-tech project — it has a frontend layer and a backend layer.

The frontend itself is split into two separate repos, each built independently:

1. Thackshana's repo (already built and pushed) — a dark-mode marketing landing page for a genomic data standard. It is a vanilla HTML/CSS/JS single-page site with a scroll-driven 192-frame WebP hero animation, interactive benchmark charts, a fake terminal search demo, canvas animations, and a self-healing data simulator. It has no dependencies. The design is inspired by enterprise science-tech brands (Stripe/Vercel aesthetic) in deep black and blue.

2. Rohit's repo (being built separately) — [Rohit will describe his module here]

The plan:
- Both repos are built independently, then we come together and decide how to merge them into one unified frontend.
- We will use Claude to compare both designs, identify what works and what doesn't, and decide on a final unified design direction.

Please help us [describe your specific task — e.g., compare the two designs, identify inconsistencies, suggest a merge strategy, rewrite a section, fix bugs, etc.].
```
