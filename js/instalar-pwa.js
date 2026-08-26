if ("serviceWorker" in navigator) {

  window.addEventListener("load", function () {

    navigator.serviceWorker.register("service-worker.js")
      .then(function (registro) {
        console.log("Service Worker registrado com sucesso.", registro.scope);
      })
      .catch(function (erro) {
        console.log("Service Worker não pôde ser registrado:", erro.message);
      });
  });
}
