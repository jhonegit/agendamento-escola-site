function doisDigitos(numero) {
  if (numero < 10) {
    return "0" + numero;
  }
  return "" + numero;
}


function formatarDataParaOBanco(data) {
  var ano = data.getFullYear();
  var mes = data.getMonth() + 1;   // em JavaScript janeiro é 0, por isso o + 1
  var dia = data.getDate();

  return ano + "-" + doisDigitos(mes) + "-" + doisDigitos(dia);
}


function formatarDataCurta(data) {
  return doisDigitos(data.getDate()) + "/" + doisDigitos(data.getMonth() + 1);
}


function formatarDataLonga(data) {
  return doisDigitos(data.getDate()) + "/" + doisDigitos(data.getMonth() + 1) + "/" + data.getFullYear();
}


function somarDias(data, quantidadeDeDias) {
  var copia = new Date(data.getTime());
  copia.setDate(copia.getDate() + quantidadeDeDias);
  return copia;
}


function obterDataDeHoje() {
  var agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
}


function encontrarSegundaFeira(data) {
  var diaDaSemana = data.getDay();

  if (diaDaSemana === 0) {
    return somarDias(data, 1);
  }

  return somarDias(data, -(diaDaSemana - 1));
}


function dataEstaNoPassado(data) {
  var hoje = obterDataDeHoje();
  var somenteODia = new Date(data.getFullYear(), data.getMonth(), data.getDate());

  return somenteODia.getTime() < hoje.getTime();
}


/* A marcacao de uma semana abre na sexta anterior, as 18h.
   Ate la, a semana seguinte fica fechada. */
var DIA_QUE_ABRE = 5;
var HORA_QUE_ABRE = 18;


/* O instante em que a semana desta segunda-feira foi (ou sera) liberada:
   a sexta anterior a ela, as 18h. */
function aberturaDaSemana(segundaDaSemana) {
  var sextaAnterior = somarDias(segundaDaSemana, -3);

  return new Date(
    sextaAnterior.getFullYear(),
    sextaAnterior.getMonth(),
    sextaAnterior.getDate(),
    HORA_QUE_ABRE, 0, 0
  );
}


/* A segunda-feira da unica semana que aceita marcacao agora.
   Antes da sexta 18h e a semana em andamento; a partir dela, a seguinte. */
function segundaDaSemanaAberta() {
  var agora = new Date();
  var segundaDeHoje = encontrarSegundaFeira(obterDataDeHoje());
  var proximaAbertura = aberturaDaSemana(somarDias(segundaDeHoje, 7));

  if (agora.getTime() >= proximaAbertura.getTime()) {
    return somarDias(segundaDeHoje, 7);
  }

  return segundaDeHoje;
}


function semanaEstaAberta(segundaDaSemana) {
  return formatarDataParaOBanco(segundaDaSemana) ===
         formatarDataParaOBanco(segundaDaSemanaAberta());
}


/* Texto do tipo "sexta, 28/08, as 18h", para avisar quando a semana abre. */
function descreverAbertura(segundaDaSemana) {
  var abertura = aberturaDaSemana(segundaDaSemana);
  return "sexta, " + formatarDataCurta(abertura) + ", às " + HORA_QUE_ABRE + "h";
}
