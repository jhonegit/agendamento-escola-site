var usuarioLogado = null;


function mostrarMensagem(texto, tipo) {
  var caixa = document.getElementById("mensagem");
  if (caixa === null) {
    return; // esta página não tem caixa de mensagem
  }

  caixa.textContent = texto;
  caixa.classList.remove("escondido");
  caixa.classList.remove("mensagem-erro");
  caixa.classList.remove("mensagem-sucesso");

  if (tipo === "sucesso") {
    caixa.classList.add("mensagem-sucesso");
  } else {
    caixa.classList.add("mensagem-erro");
  }
}

function esconderMensagem() {
  var caixa = document.getElementById("mensagem");
  if (caixa !== null) {
    caixa.classList.add("escondido");
  }
}

function traduzirErroDoFirebase(erro) {
  var codigo = erro.code;

  if (codigo === "auth/invalid-email") {
    return "Esse e-mail não está escrito de forma válida. Confira se falta o @ ou se sobrou espaço.";
  }
  if (codigo === "auth/missing-password") {
    return "Digite a senha.";
  }

  // O Firebase devolve o mesmo código para senha errada e para conta que não
  // existe, de propósito: dizer qual dos dois foi entregaria a estranhos quais
  // e-mails têm conta aqui.
  if (codigo === "auth/invalid-credential" ||
      codigo === "auth/user-not-found" ||
      codigo === "auth/wrong-password") {
    return "E-mail ou senha incorretos.";
  }

  if (codigo === "auth/user-disabled") {
    return "Esta conta foi desativada. Procure a secretaria.";
  }
  if (codigo === "auth/too-many-requests") {
    return "Muitas tentativas seguidas. Espere alguns minutos e tente de novo.";
  }
  if (codigo === "auth/network-request-failed") {
    return "Sem conexão com a internet. Confira a rede e tente de novo.";
  }
  if (codigo === "auth/operation-not-allowed") {
    return "O login por e-mail e senha está desligado no Firebase. " +
           "É preciso ligá-lo no Console, em Authentication.";
  }
  if (codigo === "auth/api-key-not-valid" ||
      codigo === "auth/invalid-api-key" ||
      codigo === "auth/configuration-not-found") {
    return "Algo de errado não está certo. Falar com alguém da turma de DS";
  }

  return "Erro inesperado: " + erro.message;
}



function entrarNoSistema(email, senha) {
  esconderMensagem();
  mostrarMensagem("Entrando...", "sucesso");

  autenticacao.signInWithEmailAndPassword(email, senha)
    .then(function () {
    })
    .catch(function (erro) {
      mostrarMensagem(traduzirErroDoFirebase(erro), "erro");
    });
}


autenticacao.onAuthStateChanged(function (usuarioDoFirebase) {

  var estamosNaPaginaDeLogin = document.getElementById("formulario-login") !== null;
  var estamosNaPaginaDaGrade = document.getElementById("corpo-da-grade") !== null;

  if (usuarioDoFirebase === null) {
    usuarioLogado = null;

    if (typeof pararDeVigiar === "function") {
      pararDeVigiar();
    }

    if (estamosNaPaginaDaGrade) {
      window.location.href = "index.html";
    }
    return;
  }

  bancoDeDados.collection("usuarios").doc(usuarioDoFirebase.uid).get()
    .then(function (documento) {

      if (documento.exists === false) {
        mostrarMensagem(
          "Sua conta existe, mas não tem nome e função cadastrados. " +
          "Peça para a secretaria criar de novo.",
          "erro"
        );
        autenticacao.signOut();
        return;
      }

      var dados = documento.data();

      usuarioLogado = {
        uid: usuarioDoFirebase.uid,
        nome: dados.nome,
        email: dados.email,
        papel: dados.papel
      };

      if (estamosNaPaginaDeLogin) {
        window.location.href = "grade.html";
        return;
      }

      if (estamosNaPaginaDaGrade) {
        escreverIdentificacaoNoTopo();

        iniciarGrade();
      }
    })
    .catch(function (erro) {
      mostrarMensagem("Não foi possível ler seus dados: " + erro.message, "erro");
    });
});


function escreverIdentificacaoNoTopo() {
  var campo = document.getElementById("identificacao-usuario");
  if (campo === null) {
    return;
  }

  var papelPorExtenso = "Professor(a)";
  if (usuarioLogado.papel === "funcionario") {
    papelPorExtenso = "Secretaria";
  }

  campo.textContent = usuarioLogado.nome + " · " + papelPorExtenso;
}


var formularioLogin = document.getElementById("formulario-login");

if (formularioLogin !== null) {
  formularioLogin.addEventListener("submit", function (evento) {

    evento.preventDefault();

    var email = document.getElementById("email-login").value.trim();
    var senha = document.getElementById("senha-login").value;

    entrarNoSistema(email, senha);
  });
}

var botaoSair = document.getElementById("botao-sair");

if (botaoSair !== null) {
  botaoSair.addEventListener("click", function () {

    // Desligar o vigia do banco ANTES de sair. Se sairmos primeiro, o servidor
    // corta a ligacao e o vigia reclama de falta de permissao na cara da pessoa.
    if (typeof pararDeVigiar === "function") {
      pararDeVigiar();
    }

    autenticacao.signOut().then(function () {
      window.location.href = "index.html";
    });
  });
}
