# Documentation Portal (`/docs/[[...slug]]`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/docs/[[...slug]].tsx`
- **Route Path**: `/docs/[[...slug]]` (Catch-all dynamic documentation portal)
- **Target Audience**: Developers, operations administrators, IT teams, and integration partners implementing or configuring Qmova.
- **Key Dependencies**: React, Next.js (`GetStaticProps`, `GetStaticPaths`), `next-mdx-remote` (`MDXRemote`, `serialize`), `rehype-slug`, `rehype-autolink-headings`, `DocsLayout`, `MDXComponents`, `Breadcrumbs`, `PrevNext`, `lib/docs.ts`.

---

## 2. Frontend Architecture & UI/UX Audit
- **Layout & Structure**:
  - `DocsLayout`: Left-hand collapsible sidebar with multi-level section hierarchies (`Product`, `API`, `Trust`, `Compliance`, `Help`, `Release Notes`).
  - `Breadcrumbs`: Automatic directory path navigation tokens (`Docs > Product > Getting Started`).
  - `PrevNext`: Bottom-of-page sequential navigation links enabling linear tutorial reading.
- **Custom MDX Components (`MDXComponents.tsx`)**:
  - Custom alerts, callouts, and code blocks with syntax highlighting and one-click copy buttons.
  - Interactive diagram embeds and responsive API endpoint parameter tables.
  - Headings auto-linked with anchor IDs via `rehype-slug` and `rehype-autolink-headings` for direct bookmarking.

---

## 3. Content Architecture & Document Repository
- **Content Directory**: `frontend/content/docs/`
- **Document Taxonomy**:
  - `product/`: Getting started guides, queue configuration, staff desk setup, glossary.
  - `api/`: REST API documentation, authentication headers, Webhook payload schemas, and event contracts.
  - `trust/`: Security overview, system architecture diagrams, third-party subprocessor catalog.
  - `compliance/`: POPIA / GDPR regulatory compliance roadmaps.
  - `help/`: Frequently asked questions and operational troubleshooting.

---

## 4. Architecture & System Design
- **SSG Static Generation**: Uses `getAllDocs()` to crawl the markdown file tree and generate static HTML for all routes at build time.
- **Fast Build Times**: Uses lightweight `serialize` pipeline from `next-mdx-remote` rather than heavy build-time compiler plugins.
- **404 Fallback**: Any non-existent slug returns `{ notFound: true }` rendering the standardized Next.js 404 page.

---

## 5. Business Abstraction & Value Proposition
- **Self-Service Customer Onboarding**: Reduces time-to-first-value (TTFV) from days to minutes. New tenants can configure their first queue, customize WhatsApp messaging, and launch their public booking link without calling support.
- **API Developer Ecosystem**: Enables hospital IT teams and retail enterprise integrators to build custom check-in flows, EHR sync scripts, or private CRM hooks.

