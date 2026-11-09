# Blog & Content Engine (`/blog`, `/blog/[slug]`) Deep Audit

## 1. File & Component Metadata
- **Source Files**:
  - `frontend/src/pages/blog/index.tsx` (Blog Index & Archive)
  - `frontend/src/pages/blog/[slug].tsx` (Individual Blog Article & Social Sharing)
- **Route Paths**: `/blog`, `/blog/[slug]`
- **Target Audience**: Organic search visitors, industry researchers, and existing customers looking for operational best practices in queue management.
- **Key Dependencies**: React, Next.js (`GetServerSideProps`, `GetStaticPaths`, `GetStaticProps`, `Head`, `Link`, `Image`, `useRouter`), `date-fns`, Lucide Icons (`FileText`, `ArrowRight`, `ArrowLeft`, `User`, `Calendar`, `Loader2`, `Share2`), Framer Motion, `useAuth`, `Logo`.

---

## 2. Frontend Architecture & UI/UX Audit
- **Listing UI (`/blog`)**:
  - Responsive card grid displaying article cover images, category badges, published dates, reading times, and author avatars.
  - Hover zoom effects on images with smooth Framer Motion transitions.
  - Fallback empty state (`No articles published yet`) if the CMS database is freshly seeded.
- **Article UI (`/blog/[slug]`)**:
  - Comprehensive SEO metadata: dynamic `<title>`, `<meta name="description">`, OpenGraph image and title tags.
  - Sticky social sharing widget (X / Twitter, LinkedIn, Facebook).
  - Rich typography prose styling with code block highlighting and structured headings.
  - Fallback loader (`Loader2`) for ISR dynamic generation.

---

## 3. Backend Integration & CMS Data Flow
- **API Endpoints**:
  - `GET /blogs` (`backend/src/blogs/blogs.controller.ts`) for listing published articles.
  - `GET /blogs/slug/:slug` for fetching full article content, author details, and SEO tags.
- **Database Model**: Stored in PostgreSQL `Blog` table (`id`, `title`, `slug: unique`, `excerpt`, `content`, `coverImage`, `authorName`, `seoTitle`, `seoDescription`, `published: boolean`, `publishedAt`, `createdAt`).
- **Super Admin Authoring**: Fully managed via the Super Admin CMS dashboard (`/super-admin/blogs`), providing markdown authoring, cover image uploading, and immediate publishing.

---

## 4. Architecture & System Design
- **Hybrid SSR / ISR Strategy**: Articles are rendered server-side or via Incremental Static Regeneration (ISR) with revalidation periods, ensuring instant edge delivery while reflecting live editorial edits.
- **Image Optimization**: Leverages `next/image` with responsive `sizes` and automatic webp conversion to optimize bandwidth.

---

## 5. Business Abstraction & Value Proposition
- **Inbound SEO & Lead Acquisition**: Captures high-intent educational search queries (e.g. "How to reduce patient wait times in private clinics", "Virtual queue system for busy salons"), converting casual readers into trial users via embedded CTA links.
- **Domain Authority & Thought Leadership**: Positions Qmova as the definitive authority on queueing theory, front-desk ergonomics, and waiting room psychology.

