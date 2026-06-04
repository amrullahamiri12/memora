# Memora — SEO & Google Search

Technical SEO is built into the client build (`index.html`, `robots.txt`, `sitemap.xml`, per-route meta via `SeoManager`).

**Production site:** https://memora.cards

## What is included

| Item | Location |
|------|----------|
| Title, description, canonical | `client/index.html` + `client/src/utils/seo.js` |
| Open Graph & Twitter cards | `index.html` + runtime updates |
| `robots.txt` | `client/public/robots.txt` |
| `sitemap.xml` | `client/public/sitemap.xml` (home, login, register) |
| JSON-LD (WebApplication) | Home page only |
| Noindex on app screens | Dashboard, study, admin, etc. |

Set `VITE_SITE_URL` in `client/.env` (and Vercel env) if your canonical domain differs.

## Google Search Console (required for visibility)

1. Go to [Google Search Console](https://search.google.com/search-console).
2. **Add property** → URL prefix → `https://memora.cards`
3. **Verify ownership** (pick one):
   - **HTML tag** — add the meta tag Google gives you to `client/index.html` `<head>`, deploy, verify.
   - **DNS** — add TXT record at your domain registrar (best long-term).
4. After verification, open **Sitemaps** → submit: `https://memora.cards/sitemap.xml`
5. Use **URL inspection** → enter `https://memora.cards/` → **Request indexing** for the homepage.

Indexing is not instant; it can take days to weeks for new sites.

## Bing (optional)

[ Bing Webmaster Tools ](https://www.bing.com/webmasters) — import from Google Search Console or verify the same domain.

## Ongoing tips

- Keep the homepage (`Landing`) copy clear and keyword-relevant (flashcards, study, quizzes).
- Ensure `memora.cards` loads over HTTPS and returns 200 for `/`.
- Do not block Googlebot in `robots.txt` (current file allows `/`).
- Add more public content (blog, help pages) over time for richer search presence.

## Preview URLs

Vercel preview deployments should set `VITE_SITE_URL` to the preview URL only if you want correct OG tags on previews; production should use `https://memora.cards`.
