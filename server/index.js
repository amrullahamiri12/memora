const createApp = require('./app');
const app = createApp();

const PORT = process.env.PORT || 5001;

app.get('/', (_req, res) => {
  res.type('html').send(`
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Memora API</title></head>
    <body style="font-family: system-ui, sans-serif; max-width: 480px; margin: 80px auto; padding: 0 24px; color: #333;">
      <h1>Memora API</h1>
      <p>This is the backend server. There is no web app here.</p>
      <p>Open the app at <a href="http://localhost:5173">http://localhost:5173</a></p>
      <p>API health: <a href="/api/health">/api/health</a></p>
    </body>
    </html>
  `);
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
