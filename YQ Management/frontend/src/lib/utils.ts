import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getTenantUrl(subdomain: string, path: string = '') {
  if (!subdomain) return '';
  if (typeof window === 'undefined') return '';
  
  const isLocal = window.location.hostname.includes('localhost') || window.location.hostname.includes('127.0.0.1');
  const portPart = window.location.port ? `:${window.location.port}` : '';
  const formattedPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';

  if (isLocal) {
    return `${window.location.protocol}//${subdomain}.localhost${portPart}${formattedPath}`;
  }
  
  // Extract root apex host
  let baseHostname = '';
  if (process.env.NEXT_PUBLIC_DOMAIN_BASE) {
    baseHostname = process.env.NEXT_PUBLIC_DOMAIN_BASE.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
  } else if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      baseHostname = new URL(process.env.NEXT_PUBLIC_APP_URL).hostname;
    } catch {}
  }
  
  if (!baseHostname) {
    baseHostname = window.location.hostname;
  }

  // Strip port if present
  baseHostname = baseHostname.split(':')[0].toLowerCase();

  // Strip known system prefixes or any existing subdomain from baseHostname
  const SYSTEM_PREFIXES = ['app', 'www', 'superadmin', 'admin', 'evo', 'api'];
  const parts = baseHostname.split('.');
  if (SYSTEM_PREFIXES.includes(parts[0]) || parts[0] === subdomain.toLowerCase()) {
    baseHostname = parts.slice(1).join('.');
  } else if (baseHostname.endsWith('.qmova.yqbuddy.com') && baseHostname !== 'qmova.yqbuddy.com') {
    baseHostname = 'qmova.yqbuddy.com';
  } else if (baseHostname.endsWith('.qmova.com') && baseHostname !== 'qmova.com') {
    baseHostname = 'qmova.com';
  } else if (parts.length >= 4) {
    baseHostname = parts.slice(1).join('.');
  }

  return `${window.location.protocol}//${subdomain}.${baseHostname}${portPart}${formattedPath}`;
}

export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}
