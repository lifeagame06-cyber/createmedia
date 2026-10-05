const CACHE_NAME = "createMedia-v2";

self.addEventListener("install", function () {
    self.skipWaiting();
});

self.addEventListener("activate", function (event) {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then(function (keys) {
                return Promise.all(
                    keys
                        .filter(function (key) {
                            return key !== CACHE_NAME;
                        })
                        .map(function (key) {
                            return caches.delete(key);
                        })
                );
            })
        ])
    );
});

self.addEventListener("fetch", function (event) {

    if (event.request.method !== "GET") {
        return;
    }

    event.respondWith(
        fetch(event.request).catch(async function () {

            const cachedResponse =
                await caches.match(event.request);

            if (cachedResponse) {
                return cachedResponse;
            }

            return new Response(
                "Network unavailable",
                {
                    status: 503,
                    statusText: "Service Unavailable",
                    headers: {
                        "Content-Type": "text/plain"
                    }
                }
            );
        })
    );
});