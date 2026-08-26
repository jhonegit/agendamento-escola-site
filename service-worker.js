var NOME_DO_CACHE = "agendamento-escolar-v10";


var ARQUIVOS_DO_SITE = [
  "./",
  "./index.html",
  "./grade.html",
  "./css/estilo.css",
  "./js/firebase-config.js",
  "./js/autenticacao.js",
  "./js/datas.js",
  "./js/reservas.js",
  "./js/grade.js",
  "./js/instalar-pwa.js",
  "./manifest.json",
  "./icones/icone-192.png",
  "./icones/icone-512.png"
];


self.addEventListener("install", function (evento) {

  evento.waitUntil(
    caches.open(NOME_DO_CACHE).then(function (caixa) {
      return caixa.addAll(ARQUIVOS_DO_SITE);
    })
  );

  self.skipWaiting();
});


self.addEventListener("activate", function (evento) {

  evento.waitUntil(
    caches.keys().then(function (nomesDasCaixas) {

      var promessas = nomesDasCaixas.map(function (nome) {

        if (nome !== NOME_DO_CACHE) {
          return caches.delete(nome);
        }
      });

      return Promise.all(promessas);
    })
  );

  self.clients.claim();
});


self.addEventListener("fetch", function (evento) {

  var pedido = evento.request;

  if (pedido.method !== "GET") {
    return;
  }

  if (pedido.url.indexOf(self.location.origin) !== 0) {
    return;
  }

  evento.respondWith(
    fetch(pedido)
      .then(function (respostaDaInternet) {

        if (respostaDaInternet.ok) {

          var copia = respostaDaInternet.clone();

          caches.open(NOME_DO_CACHE).then(function (caixa) {
            caixa.put(pedido, copia);
          });
        }

        return respostaDaInternet;
      })
      .catch(function () {

        return caches.match(pedido).then(function (copiaGuardada) {

          if (copiaGuardada) {
            return copiaGuardada;
          }

          if (pedido.mode === "navigate") {
            return caches.match("./index.html");
          }

          return new Response(
            "VocÃª estÃ¡ sem conexÃ£o e este conteÃºdo nÃ£o foi guardado.",
            { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }
          );
        });
      })
  );
});
