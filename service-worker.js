// service-worker.js

// A versão do cache foi incrementada para v3 para garantir que o service worker seja atualizado e as novas dependências sejam cacheadas.
const CACHE_NAME = 'gerador-cbmpa-cache-v3';
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.tsx', // O módulo principal da aplicação
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Adicionando dependências externas da CDN para garantir o funcionamento offline.
  // Sem isso, o app não carrega quando aberto pelo atalho sem conexão com a internet.
  'https://cdn.tailwindcss.com',
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-dom@^19.2.0/client',
  'https://aistudiocdn.com/@google/genai',
  'https://aistudiocdn.com/jspdf@^3.0.3',
  'https://aistudiocdn.com/jspdf-autotable@^5.0.2'
];

// No evento de instalação, pré-carrega os arquivos essenciais do "app shell".
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('ServiceWorker: Armazenando o app shell em cache');
      return cache.addAll(APP_SHELL_URLS);
    }).catch(err => {
        console.error('ServiceWorker: Falha ao armazenar o app shell em cache', err);
    })
  );
});

// No evento de ativação, limpa caches antigos para economizar espaço.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(cacheName => cacheName !== CACHE_NAME)
          .map(cacheName => {
            console.log('ServiceWorker: Deletando cache antigo:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  return self.clients.claim(); // Assume o controle de páginas abertas imediatamente.
});

// No evento fetch, implementa uma estratégia "stale-while-revalidate".
self.addEventListener('fetch', (event) => {
  // Apenas processa requisições GET.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Tenta obter a resposta do cache primeiro.
      const cachedResponse = await cache.match(event.request);

      // Em paralelo, busca uma resposta nova da rede.
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Se a busca for bem-sucedida, atualiza o cache com a nova resposta.
        if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(err => {
        // Se a busca falhar (ex: offline), o erro é capturado.
        // A aplicação dependerá da `cachedResponse` se ela existir.
        console.warn('ServiceWorker: A busca na rede falhou. Usando o cache se disponível.', event.request.url);
      });

      // Retorna a resposta do cache imediatamente se existir (rápido, offline-first).
      // Caso contrário, aguarda a resposta da rede.
      return cachedResponse || fetchPromise;
    })
  );
});