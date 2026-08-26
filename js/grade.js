var HORARIOS = [
  "07:30-08:30",
  "08:30-09:30",
  "09:50-10:50",
  "10:50-11:50",
  "13:00-14:00",
  "14:00-14:50",
  "15:10-16:00",
  "16:00-16:50"
];

var QUANTIDADE_DE_HORARIOS_DA_MANHA = 4;


function descobrirNumeroDoHorario(horario) {

  var posicao = 0;
  while (posicao < HORARIOS.length) {

    if (HORARIOS[posicao] === horario) {
      return posicao + 1;
    }

    posicao = posicao + 1;
  }

  return 0;
}

function descreverHorario(horario) {
  return descobrirNumeroDoHorario(horario) + "º horário (" + horario + ")";
}

var NOMES_DOS_DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

var LOCAIS = [
  { chave: "biblioteca",  nome: "Biblioteca",              sigla: "BIB" },
  { chave: "laboratorio", nome: "Laboratório de Informática", sigla: "LAB" }
];


var segundaDaSemanaMostrada = null;

var reservasDaSemana = [];

var celulaAberta = null;

var gradeJaFoiIniciada = false;

/* Funcao que desliga o vigia do banco. Trocamos de vigia a cada semana. */
var desligarVigiaDaSemana = null;

/* Os professores da escola, para a secretaria escolher em nome de quem reserva.
   Fica vazia para quem nao e da secretaria: o servidor nem deixa ler. */
var professoresDaEscola = [];

/* Em nome de quem a proxima reserva vai ficar, enquanto a janelinha esta aberta. */
var donoDaReserva = null;

/* Qual reserva esta esperando o "Confirmar" do cancelamento. */
var cancelamentoEmConfirmacao = null;

/* Fica true enquanto a pessoa esta saindo do sistema. Ao sair, o servidor corta
   o vigia e devolve "sem permissao": isso e esperado, e nao pode virar aviso. */
var estamosSaindo = false;


function iniciarGrade() {

  if (gradeJaFoiIniciada) {
    carregarReservasEDesenharTudo();
    return;
  }

  gradeJaFoiIniciada = true;

  segundaDaSemanaMostrada = encontrarSegundaFeira(obterDataDeHoje());

  ligarOsBotoesDaTela();
  carregarProfessoresSeForSecretaria();
  carregarReservasEDesenharTudo();
}


/* So a secretaria enxerga a lista. Para os demais nem chamamos, porque o
   servidor recusaria e o erro nao ajudaria em nada. */
function carregarProfessoresSeForSecretaria() {

  if (usuarioLogado.papel !== "funcionario") {
    return;
  }

  buscarProfessores()
    .then(function (lista) {
      professoresDaEscola = lista;
    })
    .catch(function (erro) {
      console.warn("Nao foi possivel ler a lista de professores:", erro.message);
    });
}


function carregarReservasEDesenharTudo() {

  var segunda = segundaDaSemanaMostrada;
  var sexta = somarDias(segunda, 4);

  var dataInicial = formatarDataParaOBanco(segunda);
  var dataFinal = formatarDataParaOBanco(sexta);

  document.getElementById("texto-semana").textContent =
    formatarDataCurta(segunda) + " a " + formatarDataCurta(sexta) + " de " + sexta.getFullYear();

  mostrarAvisoDaSemana();
  mostrarBotaoDeVoltarParaHoje();

  if (desligarVigiaDaSemana !== null) {
    desligarVigiaDaSemana();
    desligarVigiaDaSemana = null;
  }

  desligarVigiaDaSemana = vigiarReservasDaSemana(
    dataInicial,
    dataFinal,

    function (lista) {
      esconderAvisoDoBanco();

      reservasDaSemana = lista;

      desenharCabecalhoDaGrade();
      desenharCorpoDaGrade();

      // Com a janelinha aberta, ela tambem se atualiza sozinha.
      if (celulaAberta !== null) {
        desenharConteudoDoModal();
      }
    },

    function (erro) {

      // Ao sair do sistema, o vigia perde a permissao e reclama. E esperado.
      if (estamosSaindo || usuarioLogado === null) {
        return;
      }

      mostrarAvisoDoBanco(traduzirErroDoBanco(erro));
    }
  );
}


function mostrarAvisoDoBanco(texto) {
  var caixa = document.getElementById("aviso-do-banco");
  caixa.textContent = texto;
  caixa.classList.remove("escondido");
}


function esconderAvisoDoBanco() {
  document.getElementById("aviso-do-banco").classList.add("escondido");
}


/* Chamada pelo js/autenticacao.js quando a pessoa sai ou a sessao acaba.
   Sem isto, o vigia continua ligado sem permissao e reclama na tela. */
function pararDeVigiar() {

  estamosSaindo = true;

  if (desligarVigiaDaSemana !== null) {
    desligarVigiaDaSemana();
    desligarVigiaDaSemana = null;
  }
}


/* O atalho para a semana de hoje so faz sentido quando a pessoa saiu dela. */
function mostrarBotaoDeVoltarParaHoje() {

  var botao = document.getElementById("botao-semana-atual");

  var estamosNaSemanaDeHoje =
    formatarDataParaOBanco(segundaDaSemanaMostrada) ===
    formatarDataParaOBanco(encontrarSegundaFeira(obterDataDeHoje()));

  if (estamosNaSemanaDeHoje) {
    botao.classList.add("escondido");
  } else {
    botao.classList.remove("escondido");
  }
}


/* Explica, acima da grade, por que a semana mostrada nao aceita marcacao. */
function mostrarAvisoDaSemana() {

  var aviso = document.getElementById("aviso-da-semana");

  if (semanaEstaAberta(segundaDaSemanaMostrada)) {
    aviso.classList.add("escondido");
    return;
  }

  if (dataEstaNoPassado(somarDias(segundaDaSemanaMostrada, 4))) {
    aviso.textContent = "Esta semana já passou. Você está apenas consultando.";
  } else {
    aviso.textContent = "Esta semana ainda não abriu para marcação. Ela abre " +
                        descreverAbertura(segundaDaSemanaMostrada) + ".";
  }

  aviso.classList.remove("escondido");
}


function desenharCabecalhoDaGrade() {

  var linhaDoCabecalho = document.getElementById("cabecalho-da-grade");

  linhaDoCabecalho.innerHTML = "";

  var celulaDeCanto = document.createElement("th");
  celulaDeCanto.className = "coluna-horario";
  celulaDeCanto.textContent = "Horário";
  linhaDoCabecalho.appendChild(celulaDeCanto);

  var posicao = 0;
  while (posicao < NOMES_DOS_DIAS.length) {

    var dataDoDia = somarDias(segundaDaSemanaMostrada, posicao);

    var celula = document.createElement("th");
    celula.className = "coluna-dia";

    var nome = document.createElement("span");
    nome.className = "nome-do-dia";
    nome.textContent = NOMES_DOS_DIAS[posicao];
    celula.appendChild(nome);

    var data = document.createElement("span");
    data.className = "data-do-dia";
    data.textContent = formatarDataCurta(dataDoDia);
    celula.appendChild(data);

    if (formatarDataParaOBanco(dataDoDia) === formatarDataParaOBanco(obterDataDeHoje())) {
      celula.classList.add("dia-de-hoje");
    }

    linhaDoCabecalho.appendChild(celula);

    posicao = posicao + 1;
  }
}


function desenharCorpoDaGrade() {

  var corpo = document.getElementById("corpo-da-grade");
  corpo.innerHTML = "";

  var posicaoDoHorario = 0;
  while (posicaoDoHorario < HORARIOS.length) {

    var horario = HORARIOS[posicaoDoHorario];

    if (posicaoDoHorario === QUANTIDADE_DE_HORARIOS_DA_MANHA) {
      corpo.appendChild(criarLinhaDoIntervalo());
    }

    var linha = document.createElement("tr");

    linha.appendChild(criarCelulaDoHorario(posicaoDoHorario + 1, horario));

    var numeroDoDia = 0;
    while (numeroDoDia < NOMES_DOS_DIAS.length) {

      var dataDoDia = somarDias(segundaDaSemanaMostrada, numeroDoDia);
      linha.appendChild(criarCelulaDaGrade(dataDoDia, horario));

      numeroDoDia = numeroDoDia + 1;
    }

    corpo.appendChild(linha);

    posicaoDoHorario = posicaoDoHorario + 1;
  }
}


function criarCelulaDoHorario(numero, horario) {

  var celula = document.createElement("th");
  celula.className = "coluna-horario";

  var caixa = document.createElement("span");
  caixa.className = "caixa-do-horario";

  var bolinha = document.createElement("span");
  bolinha.className = "numero-do-horario";
  bolinha.textContent = numero + "º";

  var faixaDeHoras = document.createElement("span");
  faixaDeHoras.className = "faixa-de-horas";
  faixaDeHoras.textContent = horario;

  caixa.appendChild(bolinha);
  caixa.appendChild(faixaDeHoras);
  celula.appendChild(caixa);

  return celula;
}


function criarLinhaDoIntervalo() {

  var linha = document.createElement("tr");
  linha.className = "linha-intervalo";

  var celula = document.createElement("td");

  celula.colSpan = 6;
  celula.textContent = "Intervalo do almoço · 11:50 às 13:00";

  linha.appendChild(celula);
  return linha;
}


function criarCelulaDaGrade(dataDoDia, horario) {

  var dataTexto = formatarDataParaOBanco(dataDoDia);
  var ehPassado = dataEstaNoPassado(dataDoDia);

  var celula = document.createElement("td");
  celula.className = "celula";

  var botao = document.createElement("button");
  botao.type = "button";
  botao.className = "botao-da-celula";

  if (ehPassado) {
    botao.classList.add("celula-passada");
    botao.disabled = true;
    botao.title = "Esta data já passou";

  } else if (semanaEstaAberta(segundaDaSemanaMostrada) === false) {
    botao.classList.add("celula-fechada");
    botao.disabled = true;
    botao.title = "Esta semana abre " + descreverAbertura(segundaDaSemanaMostrada);
  }

  var numeroDoLocal = 0;
  while (numeroDoLocal < LOCAIS.length) {

    var local = LOCAIS[numeroDoLocal];
    var reserva = procurarReserva(dataTexto, horario, local.chave);

    botao.appendChild(criarFaixaDoLocal(local, reserva));

    numeroDoLocal = numeroDoLocal + 1;
  }

  botao.addEventListener("click", function () {
    abrirModal(dataDoDia, horario);
  });

  celula.appendChild(botao);
  return celula;
}


function criarFaixaDoLocal(local, reserva) {

  var faixa = document.createElement("span");
  faixa.className = "faixa";

  var sigla = document.createElement("span");
  sigla.className = "sigla";
  sigla.textContent = local.sigla;

  var texto = document.createElement("span");
  texto.className = "texto-da-faixa";

  if (reserva === null) {
    faixa.classList.add("faixa-livre");
    texto.textContent = "livre";
  } else {
    faixa.classList.add("faixa-ocupada");
    faixa.classList.add("faixa-" + local.chave);

    if (usuarioLogado !== null && reserva.professorUid === usuarioLogado.uid) {
      faixa.classList.add("faixa-minha");
    }

    texto.textContent = pegarPrimeiroNome(reserva.professorNome);
  }

  faixa.appendChild(sigla);
  faixa.appendChild(texto);
  return faixa;
}


function pegarPrimeiroNome(nomeCompleto) {

  if (!nomeCompleto) {
    return "reservado";
  }

  var pedacos = nomeCompleto.split(" ");
  return pedacos[0];
}


function procurarReserva(dataTexto, horario, localChave) {

  var posicao = 0;
  while (posicao < reservasDaSemana.length) {

    var reserva = reservasDaSemana[posicao];

    if (reserva.data === dataTexto &&
        reserva.horario === horario &&
        reserva.local === localChave) {
      return reserva;
    }

    posicao = posicao + 1;
  }

  return null;
}


function abrirModal(dataDoDia, horario) {

  celulaAberta = {
    dataObjeto: dataDoDia,
    dataTexto: formatarDataParaOBanco(dataDoDia),
    horario: horario
  };

  var numeroDoDia = dataDoDia.getDay() - 1;
  var nomeDoDia = NOMES_DOS_DIAS[numeroDoDia];

  document.getElementById("titulo-do-modal").textContent =
    nomeDoDia + ", " + formatarDataLonga(dataDoDia) + " · " + descreverHorario(horario);

  donoDaReserva = { uid: usuarioLogado.uid, nome: usuarioLogado.nome };
  cancelamentoEmConfirmacao = null;

  esconderMensagemDoModal();
  desenharConteudoDoModal();

  document.getElementById("fundo-do-modal").classList.remove("escondido");
}


function fecharModal() {
  celulaAberta = null;
  cancelamentoEmConfirmacao = null;
  document.getElementById("fundo-do-modal").classList.add("escondido");
}


function desenharConteudoDoModal() {

  var corpo = document.getElementById("corpo-do-modal");
  corpo.innerHTML = "";

  if (usuarioLogado.papel === "funcionario" && professoresDaEscola.length > 0) {
    corpo.appendChild(criarSeletorDeProfessor());
  }

  var numeroDoLocal = 0;
  while (numeroDoLocal < LOCAIS.length) {

    var local = LOCAIS[numeroDoLocal];
    var reserva = procurarReserva(celulaAberta.dataTexto, celulaAberta.horario, local.chave);

    corpo.appendChild(criarLinhaDoModal(local, reserva));

    numeroDoLocal = numeroDoLocal + 1;
  }
}


/* A lista de quem pode receber a reserva: a propria secretaria e todos os
   professores. So aparece para quem e da secretaria. */
function criarSeletorDeProfessor() {

  var caixa = document.createElement("div");
  caixa.className = "escolha-do-professor";

  var rotulo = document.createElement("label");
  rotulo.setAttribute("for", "professor-da-reserva");
  rotulo.textContent = "Reservar em nome de";
  caixa.appendChild(rotulo);

  var lista = document.createElement("select");
  lista.id = "professor-da-reserva";

  var opcaoEu = document.createElement("option");
  opcaoEu.value = usuarioLogado.uid;
  opcaoEu.textContent = usuarioLogado.nome + " (você)";
  lista.appendChild(opcaoEu);

  var posicao = 0;
  while (posicao < professoresDaEscola.length) {

    var professor = professoresDaEscola[posicao];

    var opcao = document.createElement("option");
    opcao.value = professor.uid;
    opcao.textContent = professor.nome;
    lista.appendChild(opcao);

    posicao = posicao + 1;
  }

  lista.value = donoDaReserva.uid;

  lista.addEventListener("change", function () {
    donoDaReserva = procurarDono(lista.value);
  });

  caixa.appendChild(lista);
  return caixa;
}


function procurarDono(uid) {

  var posicao = 0;
  while (posicao < professoresDaEscola.length) {

    if (professoresDaEscola[posicao].uid === uid) {
      return {
        uid: professoresDaEscola[posicao].uid,
        nome: professoresDaEscola[posicao].nome
      };
    }

    posicao = posicao + 1;
  }

  return { uid: usuarioLogado.uid, nome: usuarioLogado.nome };
}


function criarLinhaDoModal(local, reserva) {

  var linha = document.createElement("div");
  linha.className = "linha-do-modal";

  var informacoes = document.createElement("div");
  informacoes.className = "informacoes-do-local";

  var nome = document.createElement("strong");
  nome.textContent = local.nome;
  informacoes.appendChild(nome);

  var situacao = document.createElement("span");
  situacao.className = "situacao";

  if (reserva === null) {
    situacao.textContent = "Livre";
    situacao.classList.add("situacao-livre");
  } else {
    situacao.textContent = "Reservado por " + reserva.professorNome;
    situacao.classList.add("situacao-ocupada");
  }

  informacoes.appendChild(situacao);
  linha.appendChild(informacoes);

  if (reserva === null) {

    var botaoReservar = document.createElement("button");
    botaoReservar.type = "button";
    botaoReservar.className = "botao botao-principal botao-pequeno";
    botaoReservar.textContent = "Reservar";

    botaoReservar.addEventListener("click", function () {
      confirmarEReservar(local, botaoReservar);
    });

    linha.appendChild(botaoReservar);

  } else if (cancelamentoEmConfirmacao === reserva.id) {

    // A secretaria pediu para cancelar a reserva de outra pessoa. Antes de
    // apagar, ela confirma aqui mesmo, sem caixa do navegador.
    situacao.textContent = "Cancelar a reserva de " + reserva.professorNome + "?";
    situacao.classList.remove("situacao-ocupada");
    situacao.classList.add("situacao-perguntando");

    var confirmacao = document.createElement("div");
    confirmacao.className = "confirmacao-embutida";

    var botaoVoltar = document.createElement("button");
    botaoVoltar.type = "button";
    botaoVoltar.className = "botao botao-secundario botao-pequeno";
    botaoVoltar.textContent = "Voltar";
    botaoVoltar.addEventListener("click", function () {
      cancelamentoEmConfirmacao = null;
      desenharConteudoDoModal();
    });

    var botaoConfirmar = document.createElement("button");
    botaoConfirmar.type = "button";
    botaoConfirmar.className = "botao botao-perigo botao-pequeno";
    botaoConfirmar.textContent = "Confirmar";
    botaoConfirmar.addEventListener("click", function () {
      cancelarDeVerdade(reserva, botaoConfirmar);
    });

    confirmacao.appendChild(botaoVoltar);
    confirmacao.appendChild(botaoConfirmar);
    linha.appendChild(confirmacao);

  } else if (podeCancelarEstaReserva(reserva)) {

    var botaoCancelar = document.createElement("button");
    botaoCancelar.type = "button";
    botaoCancelar.className = "botao botao-perigo botao-pequeno";
    botaoCancelar.textContent = "Cancelar";

    botaoCancelar.addEventListener("click", function () {

      // Cancelar a propria reserva vai direto. So a secretaria confirma,
      // porque ela apaga a reserva de outra pessoa e isso nao tem volta.
      if (reserva.professorUid === usuarioLogado.uid) {
        cancelarDeVerdade(reserva, botaoCancelar);
        return;
      }

      cancelamentoEmConfirmacao = reserva.id;
      desenharConteudoDoModal();
    });

    linha.appendChild(botaoCancelar);

  } else {

    var aviso = document.createElement("span");
    aviso.className = "aviso-sem-permissao";
    aviso.textContent = "só quem reservou pode cancelar";
    linha.appendChild(aviso);
  }

  return linha;
}


function confirmarEReservar(local, botaoClicado) {

  botaoClicado.disabled = true;
  botaoClicado.textContent = "Salvando...";
  esconderMensagemDoModal();

  criarReserva(celulaAberta.dataTexto, celulaAberta.horario, local.chave, donoDaReserva)
    .then(function () {
      desenharConteudoDoModal();
    })
    .catch(function (erro) {
      mostrarMensagemDoModal(traduzirErroDoBanco(erro));
      botaoClicado.disabled = false;
      botaoClicado.textContent = "Reservar";
    });
}


function cancelarDeVerdade(reserva, botaoClicado) {

  botaoClicado.disabled = true;
  botaoClicado.textContent = "Cancelando...";
  esconderMensagemDoModal();

  cancelarReserva(reserva.id)
    .then(function () {
      cancelamentoEmConfirmacao = null;
      desenharConteudoDoModal();
    })
    .catch(function (erro) {
      cancelamentoEmConfirmacao = null;
      mostrarMensagemDoModal(traduzirErroDoBanco(erro));
      desenharConteudoDoModal();
    });
}


function mostrarMensagemDoModal(texto) {
  var caixa = document.getElementById("mensagem-do-modal");
  caixa.textContent = texto;
  caixa.classList.remove("escondido");
  caixa.classList.add("mensagem-erro");
}

function esconderMensagemDoModal() {
  document.getElementById("mensagem-do-modal").classList.add("escondido");
}


function ligarOsBotoesDaTela() {

  document.getElementById("botao-semana-anterior").addEventListener("click", function () {
    segundaDaSemanaMostrada = somarDias(segundaDaSemanaMostrada, -7);
    carregarReservasEDesenharTudo();
  });

  document.getElementById("botao-semana-seguinte").addEventListener("click", function () {
    segundaDaSemanaMostrada = somarDias(segundaDaSemanaMostrada, 7);
    carregarReservasEDesenharTudo();
  });

  document.getElementById("botao-semana-atual").addEventListener("click", function () {
    segundaDaSemanaMostrada = encontrarSegundaFeira(obterDataDeHoje());
    carregarReservasEDesenharTudo();
  });

  document.getElementById("botao-fechar-modal").addEventListener("click", function () {
    fecharModal();
  });

  var fundo = document.getElementById("fundo-do-modal");
  fundo.addEventListener("click", function (evento) {
    if (evento.target === fundo) {
      fecharModal();
    }
  });

  document.addEventListener("keydown", function (evento) {
    if (evento.key === "Escape") {
      fecharModal();
    }
  });
}
