const url = process.env.HEALTHCHECK_URL || `http://127.0.0.1:${process.env.PORT || 3000}/api/health`;
try {
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
  const health = await response.json();
  if (!response.ok || health.status !== 'ok' || health.database !== 'connected') throw new Error('Application is unhealthy');
  console.log(`Healthy: ${url} · version ${health.version}`);
} catch (error) {
  console.error(`Health check failed: ${error.message}`);
  process.exitCode = 1;
}
