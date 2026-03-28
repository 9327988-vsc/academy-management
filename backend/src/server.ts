import app from './app';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`[ASMS] Server running on http://localhost:${PORT}`);
  console.log(`[ASMS] Environment: ${process.env.NODE_ENV || 'development'}`);
});
