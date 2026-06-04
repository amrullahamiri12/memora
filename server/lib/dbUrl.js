/** Append serverless-safe params to Postgres URLs when missing. */
function withServerlessParams(url) {
  if (!url || url.startsWith('file:')) return url;

  const sep = url.includes('?') ? '&' : '?';
  const params = [];

  if (!url.includes('connect_timeout=')) {
    params.push('connect_timeout=10');
  }
  if (url.includes(':6543') && !url.includes('pgbouncer=true')) {
    params.push('pgbouncer=true');
  }
  if (url.includes('pgbouncer=true') && !url.includes('connection_limit=')) {
    params.push('connection_limit=1');
  }

  return params.length ? `${url}${sep}${params.join('&')}` : url;
}

module.exports = { withServerlessParams };
