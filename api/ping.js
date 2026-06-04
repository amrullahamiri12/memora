/** Lightweight health probe — no Express/Prisma (fast cold start). */
module.exports = (_req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: true }));
};
