export interface ParsedDeviceInfo {
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  clientName: string;
  raw?: string;
}

export function parseUserAgent(ua?: string): ParsedDeviceInfo {
  if (!ua) {
    return {
      browser: 'Web Browser',
      os: 'Unknown OS',
      deviceType: 'desktop',
      clientName: 'Desktop Web Browser',
    };
  }

  let os = 'Unknown OS';
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';

  // 1. Detect OS & Device Type
  if (/windows nt 10\.0/i.test(ua)) {
    os = 'Windows 10/11';
    deviceType = 'desktop';
  } else if (/windows nt 6\.3/i.test(ua)) {
    os = 'Windows 8.1';
    deviceType = 'desktop';
  } else if (/windows nt 6\.2|windows nt 6\.1/i.test(ua)) {
    os = 'Windows 7/8';
    deviceType = 'desktop';
  } else if (/ipad/i.test(ua)) {
    os = 'iPadOS';
    deviceType = 'tablet';
  } else if (/iphone/i.test(ua)) {
    os = 'iOS (iPhone)';
    deviceType = 'mobile';
  } else if (/macintosh|mac os x/i.test(ua)) {
    os = 'macOS';
    deviceType = 'desktop';
  } else if (/android/i.test(ua)) {
    os = 'Android';
    deviceType = /tablet|nexus 7|nexus 9|nexus 10/i.test(ua) ? 'tablet' : 'mobile';
  } else if (/cros/i.test(ua)) {
    os = 'ChromeOS';
    deviceType = 'desktop';
  } else if (/linux/i.test(ua)) {
    os = 'Linux';
    deviceType = 'desktop';
  }

  // 2. Detect Browser
  let browser = 'Web Browser';
  if (/edg\//i.test(ua)) {
    browser = 'Microsoft Edge';
  } else if (/opr\/|opera/i.test(ua)) {
    browser = 'Opera';
  } else if (/brave/i.test(ua)) {
    browser = 'Brave';
  } else if (/chrome|crios/i.test(ua)) {
    browser = 'Google Chrome';
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Mozilla Firefox';
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = 'Apple Safari';
  } else if (/samsungbrowser/i.test(ua)) {
    browser = 'Samsung Internet';
  }

  return {
    browser,
    os,
    deviceType,
    clientName: `${browser} on ${os}`,
    raw: ua,
  };
}

