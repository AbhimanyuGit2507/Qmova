import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  noindex?: boolean;
}

export default function SEO({ 
  title = "Qmova | Empty Your Waiting Room | Intelligent Queue & Appointment Platform", 
  description = "Qmova is the intelligent visit and queue management platform for clinics, salons, retail, and enterprises. Manage walk-ins, digital appointments, WhatsApp ticket tracking, and multi-counter service desks seamlessly.",
  image = "/qmova-dark-logo.png",
  noindex = false,
}: SEOProps) {
  const router = useRouter();
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://qmova.yqbuddy.com').replace(/\/$/, '');
  const cleanPath = (router.asPath || '/').split('?')[0];
  const canonicalUrl = `${baseUrl}${cleanPath === '/' ? '' : cleanPath}`;
  const fullImageUrl = image.startsWith('http') ? image : `${baseUrl}${image.startsWith('/') ? '' : '/'}${image}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "name": "QMova",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web, iOS, Android",
        "url": baseUrl,
        "description": description,
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "ZAR"
        }
      },
      {
        "@type": "Organization",
        "name": "QMova",
        "url": baseUrl,
        "logo": `${baseUrl}/qmova-dark-logo.png`,
        "sameAs": [
          "https://yqbuddy.com"
        ]
      }
    ]
  };

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
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
