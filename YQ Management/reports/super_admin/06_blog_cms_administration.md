# Content Management System (CMS) Administration (`/super-admin/blogs`) Deep Audit

## 1. File & Component Metadata
- **Source File**: `frontend/src/pages/super-admin/blogs/index.tsx`
- **Route Path**: `/super-admin/blogs`
- **Target Audience**: Content marketers, SEO managers, and platform administrators publishing educational articles, feature announcements, and case studies.
- **Key Dependencies**: React (`useState`), `SuperAdminLayout`, TanStack Query, `fetchApi`, Sonner `toast`, `ConfirmModal`, Lucide Icons (`FileText`, `Plus`, `Edit`, `Trash2`, `Eye`, `Check`, `X`).

---

## 2. Frontend Architecture & Editorial Desk
- **Article Roster & Publication Management**:
  - Displays article title, slug, author, publication status (`PUBLISHED` vs `DRAFT`), view counters, and creation date.
  - Quick action buttons: View live article, Edit in modal, Delete article.
- **Article Editor Modal**:
  - **Article Title & Automatic Slug Generator**: Types title and generates kebab-case URL slug (e.g., "How to Reduce Clinic Wait Times" -> `/blog/how-to-reduce-clinic-wait-times`).
  - **Cover Image Uploader**: Asset uploader storing images in `/uploads` or cloud buckets.
  - **Markdown Body Editor**: Full-featured markdown input supporting headings, lists, quotes, tables, and code snippets.
  - **SEO Metadata Fields**: Custom SEO Title and SEO Description tags for search engine optimization.
  - **Publish Status Toggle**: Switch between draft preview and public production release.

---

## 3. Backend Integration & Service Matrix
- **API Endpoints**:
  - `GET /blogs` & `GET /blogs/:id` (`backend/src/blogs/blogs.controller.ts`).
  - `POST /blogs` (Creates new blog post).
  - `PUT /blogs/:id` (Updates article body and metadata).
  - `DELETE /blogs/:id` (Removes post).
- **Database Model (`Blog`)**:
  Stored in PostgreSQL `Blog` table with unique slug constraints.

---

## 4. Architecture & System Design
- **Incremental Static Regeneration (ISR) Invalidation**:
  When a blog post is published or modified from this administrative screen, the backend invokes Next.js on-demand revalidation (`res.revalidate('/blog')`), ensuring public visitors receive updated articles instantly without requiring a complete frontend container rebuild.
- **Sanitized HTML Rendering**: Markdown is sanitized to prevent stored Cross-Site Scripting (XSS) vectors.

---

## 5. Business Abstraction & Value Proposition
- **Organic Inbound Growth**: Eliminates reliance on external CMS platforms (WordPress, Ghost) by keeping content marketing tightly integrated into the core Next.js application, boosting organic search authority and domain rating.
- **Product Marketing Autonomy**: Empowers non-technical marketing team members to publish release announcements, guides, and customer case studies independently.

