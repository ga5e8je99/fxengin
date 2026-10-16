export async function GET() {
  return new Response('google-site-verification: google35e5d5063f5afb96.html\n', {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
