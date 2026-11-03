import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || '';

const SYSTEM_SUBDOMAINS = new Set([
  'www',
  'api',
  'app',
  'superadmin',
  'admin',
  'evo',
  'status',
  'docs',
  'mail',
  'auth',
]);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - manifest.json, robots.txt, sw.js, workbox-* (PWA & SEO files)
     * - images, svg, icons (public files)
     * - all .png, .jpg, .jpeg, .svg files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|robots\\.txt|sw\\.js|workbox-.*|images|svg|icons|.*\\.(?:png|jpg|jpeg|svg|gif|webp)$).*)',
  ],
};

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  // Get raw hostname from proxy header or host header
  const rawHost = req.headers.get('x-forwarded-host') || req.headers.get('host') || req.nextUrl.host || '';
  const hostname = rawHost.split(':')[0].toLowerCase();
  const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1');

  // Check known base domains
  const baseCandidates: string[] = [];

  const envAppUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (envAppUrl) {
    try {
      baseCandidates.push(new URL(envAppUrl).hostname.toLowerCase());
    } catch {}
  }
  const envDomainBase = process.env.NEXT_PUBLIC_DOMAIN_BASE || process.env.DOMAIN_BASE;
  if (envDomainBase) {
    baseCandidates.push(envDomainBase.toLowerCase());
  }

  // Known production fallbacks
  baseCandidates.push('qmova.yqbuddy.com');
  baseCandidates.push('qmova.com');

  // Deduplicate candidates
  const uniqueBases = Array.from(new Set(baseCandidates.filter(Boolean)));

  let subdomain = '';

  if (isLocal) {
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[0] !== 'localhost' && parts[0] !== '127') {
      subdomain = parts[0];
    }
  } else {
    // If hostname exactly matches any apex/root domain, it is NOT a tenant subdomain
    const isRootDomain = uniqueBases.some(base => hostname === base);

    if (!isRootDomain) {
      // Find first matching base domain for subdomains
      for (const base of uniqueBases) {
        if (hostname.endsWith(`.${base}`)) {
          subdomain = hostname.slice(0, hostname.length - base.length - 1);
          break;
        }
      }

      // Generic fallback for subdomains if hostname has 3+ parts and not a reserved prefix
      if (!subdomain) {
        const parts = hostname.split('.');
        if (parts.length >= 3 && !SYSTEM_SUBDOMAINS.has(parts[0])) {
          subdomain = parts[0];
        }
      }
    }
  }

  const isSuperAdminSubdomain = subdomain === 'superadmin' || subdomain === 'admin';
  const isTenantSubdomain = Boolean(subdomain && !SYSTEM_SUBDOMAINS.has(subdomain));

  // Handle Next.js internal data fetching requests (_next/data)
  if (url.pathname.startsWith('/_next/data/')) {
    const parts = url.pathname.split('/');
    if (parts.length >= 4) {
      const buildId = parts[3];
      const dataSubPath = parts.slice(4).join('/');

      // Path-based tenant: /_next/data/[buildId]/t/[subdomain]/...
      if (dataSubPath.startsWith('t/')) {
        const tParts = dataSubPath.split('/');
        if (tParts.length >= 3) {
          const pathSub = tParts[1];
          const rest = tParts.slice(2).join('/');
          url.pathname = `/_next/data/${buildId}/_tenant/${pathSub}/${rest}`;
          return NextResponse.rewrite(url);
        }
      }
      // Subdomain-based tenant: /_next/data/[buildId]/...
      else if (isTenantSubdomain && !dataSubPath.startsWith('_tenant') && !dataSubPath.startsWith('dashboard') && !dataSubPath.startsWith('super-admin')) {
        url.pathname = `/_next/data/${buildId}/_tenant/${subdomain}/${dataSubPath}`;
        return NextResponse.rewrite(url);
      }
    }
  }

  // Extract path-based subdomain (/t/[subdomain]/...)
  if (url.pathname.startsWith('/t/')) {
    const parts = url.pathname.split('/');
    if (parts.length >= 3) {
      const pathSubdomain = parts[2];
      const restOfPath = parts.slice(3).join('/');
      url.pathname = `/_tenant/${pathSubdomain}/${restOfPath}`;
      return NextResponse.rewrite(url);
    }
  }

  // Route superadmin/admin subdomains directly to super-admin portal
  if (isSuperAdminSubdomain) {
    if (url.pathname === '/') {
      return NextResponse.redirect(new URL('/super-admin', req.url));
    }

    const superAdminPages = [
      'tenants',
      'pricing',
      'analytics',
      'blogs',
      'marketing',
      'communication',
      'inquiries',
      'system-control',
      'system-logs',
      'integrations',
    ];
    const firstSegment = url.pathname.split('/').filter(Boolean)[0];
    if (firstSegment && superAdminPages.includes(firstSegment)) {
      url.pathname = `/super-admin${url.pathname}`;
      return NextResponse.redirect(url);
    }
  }

  // Redirect booking links with a tenant slug on non-tenant domains (e.g. superadmin or apex)
  // e.g. https://superadmin.qmova.yqbuddy.com/booking/uniworld-1 -> https://uniworld-1.qmova.yqbuddy.com/booking
  if (!isTenantSubdomain && url.pathname.startsWith('/booking/')) {
    const bookingParts = url.pathname.split('/').filter(Boolean); // ['booking', 'tenant-slug', ...]
    if (bookingParts.length >= 2) {
      const candidateTenant = bookingParts[1];
      const restPath = bookingParts.slice(2).join('/');
      const targetPath = restPath ? `/booking/${restPath}` : '/booking';

      if (isLocal) {
        const port = req.nextUrl.port ? `:${req.nextUrl.port}` : '';
        const redirectUrl = new URL(`${req.nextUrl.protocol}//${candidateTenant}.localhost${port}${targetPath}`);
        url.searchParams.forEach((v, k) => redirectUrl.searchParams.set(k, v));
        return NextResponse.redirect(redirectUrl);
      } else {
        const baseDomain = uniqueBases[0] || 'qmova.yqbuddy.com';
        const redirectUrl = new URL(`https://${candidateTenant}.${baseDomain}${targetPath}`);
        url.searchParams.forEach((v, k) => redirectUrl.searchParams.set(k, v));
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  // Global paths that should never be rewritten to a tenant folder
  const globalPaths = [
    '/login',
    '/register',
    '/onboarding',
    '/dashboard',
    '/super-admin',
    '/features',
    '/pricing',
    '/about',
    '/contact',
    '/support',
    '/blog',
    '/changelog',
    '/docs',
    '/book-demo',
    '/privacy',
    '/terms',
    '/security',
    '/trust',
    '/cookies',
    '/refund-policy',
    '/data-request',
    '/for',
    '/404',
    '/customer',
    '/public',
    '/form',
    '/kiosk',
    '/staff-desk',
    '/join',
  ];
  const isGlobalPath = globalPaths.some(p => url.pathname.startsWith(p) || url.pathname === p);

  // Rewrite to the _tenant dynamic route for actual tenant subdomains
  if (isTenantSubdomain && !url.pathname.startsWith('/_tenant')) {
    // If accessing root of tenant subdomain, rewrite to _tenant/[subdomain]
    // which delegates to pages/_tenant/[subdomain]/index.tsx (redirecting to /booking)
    if (url.pathname === '/') {
      url.pathname = `/_tenant/${subdomain}`;
      return NextResponse.rewrite(url);
    }

    // Rewrite all non-global tenant routes (e.g. /booking, /tv, /status, /checkin, /pay)
    if (!isGlobalPath) {
      url.pathname = `/_tenant/${subdomain}${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // Extract token: always prioritize fresh SSO/login tokens in URL parameters over existing browser cookies
  const ssoToken = req.nextUrl.searchParams.get('token');
  const token = ssoToken || req.cookies.get('access_token')?.value || req.cookies.get('token')?.value;

  const response = NextResponse.next();
  if (ssoToken) {
    response.cookies.set('token', ssoToken, {
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
      sameSite: 'lax',
    });
  }

  // Authenticate dashboard and super-admin routes
  if (req.nextUrl.pathname.startsWith('/dashboard') || req.nextUrl.pathname.startsWith('/super-admin')) {
    if (!token) {
      const redirectRes = NextResponse.redirect(new URL('/login', req.url));
      redirectRes.cookies.delete('token');
      redirectRes.cookies.delete('access_token');
      return redirectRes;
    }
  }

  // Verify super-admin permissions
  if (req.nextUrl.pathname.startsWith('/super-admin')) {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || (process.env.NEXT_PUBLIC_DOMAIN_BASE ? 'https://api.' + process.env.NEXT_PUBLIC_DOMAIN_BASE : 'https://api.qmova.com');
      const res = await fetch(`${backendUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          cookie: `token=${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        const isSuper = data.role === 'SUPER_ADMIN' ||
          (SUPER_ADMIN_EMAIL && data.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase());
        if (!isSuper) {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
        return response;
      } else if (res.status === 401 || res.status === 403) {
        const redirectRes = NextResponse.redirect(new URL('/login', req.url));
        redirectRes.cookies.delete('token');
        redirectRes.cookies.delete('access_token');
        return redirectRes;
      }
    } catch {
      console.error('Middleware: Unable to verify auth with backend');
    }
  }

  return response;
}
