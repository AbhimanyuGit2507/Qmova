import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface FAQItem {
  question: string;
  answer: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  keywords?: string[] | string;
  noindex?: boolean;
  faq?: FAQItem[];
  breadcrumbs?: BreadcrumbItem[];
  price?: string | number;
  currency?: string;
}

export default function SEO({ 
  title = "Qmova | Empty Your Waiting Room | Intelligent Queue & Appointment Platform", 
  description = "Qmova is the modern, affordable queue management and appointment scheduling platform. Launch in 3 minutes with zero hardware required. Used by clinics, salons, retail, and enterprises worldwide.",
  image = "/qmova-dark-logo.png",
  keywords = [
    "queue management system",
    "free queue management software",
    "smart waiting room software",
    "virtual queue system",
    "affordable appointment scheduling",
    "whatsapp queue ticket",
    "qr code walk in check in",
    "zero hardware queue management",
    "waitwhile alternative",
    "qminder alternative",
    "patient queue system"
  ],
  noindex = false,
  faq,
  breadcrumbs,
  price = "0",
  currency = "ZAR",
}: SEOProps) {
  const router = useRouter();
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://qmova.yqbuddy.com').replace(/\/$/, '');
  const cleanPath = (router.asPath || '/').split('?')[0];
  const canonicalUrl = `${baseUrl}${cleanPath === '/' ? '' : cleanPath}`;
  const fullImageUrl = image.startsWith('http') ? image : `${baseUrl}${image.startsWith('/') ? '' : '/'}${image}`;
  const keywordsString = Array.isArray(keywords) ? keywords.join(', ') : keywords;

  const graphItems: any[] = [
    {
      "@type": "SoftwareApplication",
      "@id": `${baseUrl}/#software`,
      "name": "QMova",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web, iOS, Android, macOS, Windows",
      "url": baseUrl,
      "description": description,
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "128",
        "bestRating": "5",
        "worstRating": "1"
      },
      "offers": {
        "@type": "Offer",
        "price": String(price),
        "priceCurrency": currency,
        "availability": "https://schema.org/InStock",
        "priceValidUntil": "2027-12-31"
      }
    },
    {
      "@type": "Organization",
      "@id": `${baseUrl}/#organization`,
      "name": "QMova",
      "url": baseUrl,
      "logo": `${baseUrl}/qmova-dark-logo.png`,
      "sameAs": [
        "https://yqbuddy.com"
      ]
    },
    {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      "url": baseUrl,
      "name": "QMova",
      "description": description,
      "publisher": {
        "@id": `${baseUrl}/#organization`
      }
    }
  ];

  if (faq && faq.length > 0) {
    graphItems.push({
      "@type": "FAQPage",
      "@id": `${canonicalUrl}#faq`,
      "mainEntity": faq.map((item) => ({
        "@type": "Question",
        "name": item.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": item.answer
        }
      }))
    });
  }

  if (breadcrumbs && breadcrumbs.length > 0) {
    graphItems.push({
      "@type": "BreadcrumbList",
      "@id": `${canonicalUrl}#breadcrumb`,
      "itemListElement": breadcrumbs.map((crumb, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "name": crumb.name,
        "item": crumb.url.startsWith('http') ? crumb.url : `${baseUrl}${crumb.url}`
      }))
    });
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": graphItems
  };

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywordsString && <meta name="keywords" content={keywordsString} />}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      
      {/* Robots & Indexing */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <>
          <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
          <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        </>
      )}

      {/* Canonical */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* OpenGraph */}
      <meta property="og:site_name" content="QMova" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:type" content="website" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Theme */}
      <meta name="theme-color" content="#09090b" />
      <link rel="icon" href="/favicon.ico" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="manifest" href="/manifest.json" />
    </Head>
  );
}
