function montarIdDaReserva(dataTexto, horario, local) {
  return dataTexto + "_" + horario + "_" + local;
}


function transformarEmLista(resultado) {
  var listaDeReservas = [];

  resultado.forEach(function (documento) {
    var reserva = documento.data();
    reserva.id = documento.id;
    listaDeReservas.push(reserva);
  });

  return listaDeReservas;
}


/* Fica ligado no banco e chama "aoMudar" no instante em que qualquer pessoa
   marca ou cancela algo nesta semana. Devolve a funcao que desliga o vigia,
   que precisa ser chamada antes de vigiar outra semana. */
function vigiarReservasDaSemana(dataInicial, dataFinal, aoMudar, aoFalhar) {

  return bancoDeDados.collection("reservas")
    .where("data", ">=", dataInicial)
    .where("data", "<=", dataFinal)
    .onSnapshot(
      function (resultado) {
        aoMudar(transformarEmLista(resultado));
      },
      function (erro) {
        aoFalhar(erro);
      }
    );
}


/* "dono" e a pessoa em nome de quem a reserva vai ficar. O professor so
   consegue passar a si mesmo; a secretaria passa qualquer professor. Quem
   decide isso de verdade e a regra do servidor, nao esta linha. */
function criarReserva(dataTexto, horario, local, dono) {

  var idDaReserva = montarIdDaReserva(dataTexto, horario, local);

  var novaReserva = {
    data: dataTexto,
    horario: horario,
    local: local,
    professorUid: dono.uid,
    professorNome: dono.nome,

    criadoEm: firebase.firestore.FieldValue.serverTimestamp()
  };

  return bancoDeDados.collection("reservas").doc(idDaReserva).set(novaReserva);
}


function cancelarReserva(idDaReserva) {
  return bancoDeDados.collection("reservas").doc(idDaReserva).delete();
}


function podeCancelarEstaReserva(reserva) {

  if (usuarioLogado === null) {
    return false;
  }

  if (usuarioLogado.papel === "funcionario") {
    return true;
  }

  if (reserva.professorUid === usuarioLogado.uid) {
    return true;
  }

  return false;
}


function traduzirErroDoBanco(erro) {

  if (erro.code === "permission-denied") {
    return "O servidor não permitiu esta ação. " +
           "Provavelmente alguém acabou de reservar este horário, " +
           "ou você tentou cancelar uma reserva de outra pessoa. " +
           "Atualize a página para ver como está agora.";
  }

  if (erro.code === "unavailable") {
    return "Sem conexão com a internet. Tente de novo em instantes.";
  }

  return "Erro inesperado: " + erro.message;
}


/* A lista de professores, em ordem de nome. So a secretaria consegue ler isto:
   para os demais, o servidor recusa, e por isso a chamada so acontece quando
   quem esta logado e funcionario. */
function buscarProfessores() {

  return bancoDeDados.collection("usuarios")
    .where("papel", "==", "professor")
    .get()
    .then(function (resultado) {

      var lista = transformarEmLista(resultado);

      lista.sort(function (a, b) {
        return a.nome.localeCompare(b.nome, "pt-BR");
      });

      return lista;
    });
}
