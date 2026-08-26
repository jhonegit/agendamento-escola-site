/* A conferencia abaixo existe porque o proprio Firebase vem pela internet.
   Sem rede nenhuma, este arquivo nem chega a rodar, e a tela ficaria muda. */
if (typeof firebase === "undefined") {
  document.addEventListener("DOMContentLoaded", function () {
    var caixa = document.getElementById("mensagem") ||
                document.getElementById("aviso-do-banco");
    if (caixa !== null) {
      caixa.textContent = "Sem conexão com a internet. O sistema precisa de rede para funcionar.";
      caixa.classList.remove("escondido");
      caixa.classList.add("mensagem-erro");
    }
  });
}


var configuracaoDoFirebase = {
  apiKey: "AIzaSyDT4SMGIIDmso1ETG30VcoT6dnv0N71EO0",
  authDomain: "projetodereserva.firebaseapp.com",
  projectId: "projetodereserva",
  storageBucket: "projetodereserva.firebasestorage.app",
  messagingSenderId: "925169652949",
  appId: "1:925169652949:web:5885b5c631f24c334dfe5c"
};


firebase.initializeApp(configuracaoDoFirebase);


var autenticacao = firebase.auth();
var bancoDeDados = firebase.firestore();
