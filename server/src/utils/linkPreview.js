const { query } = require('../config/database');

// Extract URLs from text using regex
const extractUrls = (text) => {
  if (!text) return [];
  // Simple URL regex - matches http(s)://
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex) || [];
  // Remove duplicates
  return [...new Set(matches)];
};

// Parse domain from URL
const parseDomain = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
};

// Fetch link preview metadata (basic implementation)
// In production, use 'open-graph-scraper' package for better results
const fetchLinkPreview = async (url) => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WhatsappBot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      timeout: 5000,
    });

    if (!response.ok) return null;

    const html = await response.text();

    // Extract metadata from og tags and other meta tags
    const titleMatch = html.match(/<meta\s+property=['"]og:title['"][^>]*content=['"]([^'"]*)['"]/i)
      || html.match(/<title[^>]*>([^<]*)<\/title>/i)
      || html.match(/<meta\s+name=['"]description['"][^>]*content=['"]([^'"]*)['"]/i);

    const descriptionMatch = html.match(/<meta\s+property=['"]og:description['"][^>]*content=['"]([^'"]*)['"]/i)
      || html.match(/<meta\s+name=['"]description['"][^>]*content=['"]([^'"]*)['"]/i);

    const imageMatch = html.match(/<meta\s+property=['"]og:image['"][^>]*content=['"]([^'"]*)['"]/i);

    return {
      url,
      title: titleMatch?.[1] || 'Link',
      description: descriptionMatch?.[1] || '',
      imageUrl: imageMatch?.[1] || '',
      domain: parseDomain(url),
    };
  } catch (err) {
    console.error('Failed to fetch link preview:', err);
    // Return basic preview with domain
    return {
      url,
      title: parseDomain(url),
      description: 'Link',
      imageUrl: '',
      domain: parseDomain(url),
    };
  }
};

// Process message for link previews
const processLinkPreviews = async (text, messageId) => {
  try {
    const urls = extractUrls(text);
    if (urls.length === 0) return [];

    const previews = [];
    for (const url of urls) {
      const preview = await fetchLinkPreview(url);
      if (preview) {
        // Save to database using PostgreSQL
        try {
          await query(`
            INSERT INTO link_previews (message_id, url, title, description, image_url, domain, created_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (message_id, url)
            DO UPDATE SET
              title = EXCLUDED.title,
              description = EXCLUDED.description,
              image_url = EXCLUDED.image_url,
              domain = EXCLUDED.domain
          `, [messageId, preview.url, preview.title, preview.description, preview.imageUrl, preview.domain]);

          previews.push(preview);
        } catch (dbError) {
          console.error('Failed to save link preview:', dbError);
          // Still add to previews for display, even if DB save fails
          previews.push(preview);
        }
      }
    }

    return previews;
  } catch (err) {
    console.error('Error processing link previews:', err);
    return [];
  }
};

module.exports = {
  extractUrls,
  fetchLinkPreview,
  processLinkPreviews,
};
