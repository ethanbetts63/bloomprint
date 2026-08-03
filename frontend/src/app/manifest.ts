import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bloom Print',
    short_name: 'Bloom Print',
    description:
      'The most romantic gestures are those that plan for a future together. Choose the date, set the budget, and we organise flower deliveries, time after time.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#000000',
    icons: [
      { src: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { src: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { src: '/favicon-144x144.png', sizes: '144x144', type: 'image/png' },
      { src: '/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/favicon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
