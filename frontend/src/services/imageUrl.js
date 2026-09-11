const getApiOrigin = () => {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  return apiUrl.replace(/\/api\/?$/, '');
};

export const resolveImageUrl = (url, fallback) => {
  if (!url || typeof url !== 'string') return fallback;

  const trimmedUrl = url.trim();

  // Legacy records may store localhost/127 absolute links from admin machines.
  // Map those links to the configured API origin so images work across devices.
  if (/^https?:\/\//i.test(trimmedUrl)) {
    try {
      const parsed = new URL(trimmedUrl);
      const isLocalHost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
      if (isLocalHost && parsed.pathname.startsWith('/')) {
        return `${getApiOrigin()}${parsed.pathname}${parsed.search || ''}`;
      }
      return trimmedUrl;
    } catch {
      return trimmedUrl;
    }
  }

  return `${getApiOrigin()}${trimmedUrl.startsWith('/') ? '' : '/'}${trimmedUrl}`;
};
