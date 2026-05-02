// OSS Fantasy — Service Worker mínimo (PWA installability)
// NÃO faz cache de HTML/JS para evitar versões obsoletas após deploy.
// Apenas existe para que o navegador reconheça o site como PWA instalável.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Limpa caches antigos (se algum dia adicionarmos)
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
      await self.clients.claim();
    })()
  );
});

// Estratégia network-only — não interfere em nada.
self.addEventListener("fetch", (event) => {
  // Deixa o navegador lidar normalmente. Não chamamos respondWith.
});
