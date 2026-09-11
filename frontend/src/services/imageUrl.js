export const DEFAULT_CAMP_IMAGE =
  'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80';

const getApiOrigin = () => {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  return apiUrl.replace(/\/api\/?$/, '');
};

/**
 * Normalizes any image URL or link pasted by user or returned by backend.
 * Handles:
 * - Unsplash photo page links (converts HTML page URL to direct CDN image)
 * - Google Images redirect links (extracts direct imgurl)
 * - Data URLs (base64)
 * - Protocol-relative links (//...)
 * - Localhost / relative backend upload paths
 * - Fallbacks if empty or invalid
 */
export const resolveImageUrl = (url, fallback = DEFAULT_CAMP_IMAGE) => {
  if (!url || typeof url !== 'string') return fallback;

  let trimmed = url.trim().replace(/^['"`]|['"`]$/g, '');
  if (!trimmed) return fallback;

  // 1. Check if it's a Google Images search result link (extract actual image URL)
  if (trimmed.includes('google.') && trimmed.includes('imgurl=')) {
    try {
      const parsedGoogle = new URL(trimmed);
      const directImg = parsedGoogle.searchParams.get('imgurl');
      if (directImg) {
        trimmed = decodeURIComponent(directImg);
      }
    } catch {
      // ignore parsing error
    }
  }

  // 2. Convert Unsplash photo webpage URLs to direct CDN images
  // Matches: https://unsplash.com/photos/a-tent-pitched-...-78A265wPiO4 or https://unsplash.com/photos/78A265wPiO4
  const unsplashPageMatch = trimmed.match(/unsplash\.com\/photos\/(?:[\w-]+-)?([a-zA-Z0-9_-]+)/i);
  if (unsplashPageMatch && unsplashPageMatch[1]) {
    const photoId = unsplashPageMatch[1];
    const cleanId = photoId.startsWith('photo-') ? photoId : `photo-${photoId}`;
    return `https://images.unsplash.com/${cleanId}?auto=format&fit=crop&w=1200&q=80`;
  }

  // 3. If it's already an Unsplash CDN image, ensure optimal dimensions & formatting
  if (trimmed.includes('images.unsplash.com')) {
    if (!trimmed.includes('auto=format')) {
      trimmed += (trimmed.includes('?') ? '&' : '?') + 'auto=format&fit=crop&w=1200&q=80';
    }
    return trimmed;
  }

  // 4. If it's a data URL (base64 image), return as-is
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }

  // 5. If it's an absolute HTTP/HTTPS URL
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      const isLocalHost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
      if (isLocalHost && parsed.pathname.startsWith('/')) {
        return `${getApiOrigin()}${parsed.pathname}${parsed.search || ''}`;
      }
      return trimmed;
    } catch {
      return trimmed;
    }
  }

  // 6. Protocol-relative URL (//domain.com/...)
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }

  // 7. Relative backend path (e.g. /uploads/camps/...)
  return `${getApiOrigin()}${trimmed.startsWith('/') ? '' : '/'}${trimmed}`;
};

