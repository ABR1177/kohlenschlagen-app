const CACHE_NAME = 'kohlenschlagen-v4'; // Erhöhe die Version, um das Handy zum Update zu zwingen!

const ASSETS_TO_CACHE = [
    './',
    'index.html',
    'app.js',
    'manifest.json',
    'icon-192.png',
    'icon-512.png',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/lucide@latest',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap'
];

// Install Event: Cache Files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[ServiceWorker] Caching app shell');
            // Wir nutzen ein "Map", damit ein einzelner Fehler bei den CDNs 
            // nicht die ganze Installation abbricht
            return Promise.all(
                ASSETS_TO_CACHE.map(url => {
                    return cache.add(url).catch(err => console.warn('Cache Fehler für:', url));
                })
            );
        })
    );
});

// Activate Event: Cleanup Old Caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});


