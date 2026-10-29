import { canvasParaPng, nomeFicheiro } from "./base";
import { gerarConvocados } from "./convocados";
import { gerarHomemDoJogo } from "./homem-do-jogo";
import { gerarOnzeInicial } from "./onze-inicial";
import { gerarPlacarFinal } from "./placar-final";
import type {
  DadosConvocados,
  DadosHomemDoJogo,
  DadosOnzeInicial,
  DadosPlacarFinal,
  FormatoPlacar,
  JogoImagem,
} from "./tipos";

export type TipoImagem = "convocados" | "onze-inicial" | "homem-do-jogo" | "placar-final";

export const TITULOS_IMAGEM: Record<TipoImagem, string> = {
  convocados: "Convocados",
  "onze-inicial": "Onze inicial",
  "homem-do-jogo": "Homem do jogo",
  "placar-final": "Placar final",
};

// Para cada imagem: os dados prontos a desenhar, ou o motivo por que ainda não está disponível.
export type Disponibilidade<T> = { dados: T; motivo?: undefined } | { dados?: undefined; motivo: string };

export type ConjuntoImagens = {
  convocados: Disponibilidade<DadosConvocados>;
  "onze-inicial": Disponibilidade<DadosOnzeInicial>;
  "homem-do-jogo": Disponibilidade<DadosHomemDoJogo>;
  "placar-final": Disponibilidade<DadosPlacarFinal>;
};

export type Gerada = { blob: Blob; nome: string };

export const disponivel = <T>(dados: T): Disponibilidade<T> => ({ dados });
export const indisponivel = <T>(motivo: string): Disponibilidade<T> => ({ motivo });

export async function gerarImagem(
  tipo: TipoImagem,
  conjunto: ConjuntoImagens,
  formatoPlacar: FormatoPlacar = "retrato",
): Promise<Gerada> {
  switch (tipo) {
    case "convocados": {
      const dados = conjunto.convocados.dados;
      if (!dados) throw new Error(conjunto.convocados.motivo);
      return empacotar(await gerarConvocados(dados), dados, "convocados");
    }
    case "onze-inicial": {
      const dados = conjunto["onze-inicial"].dados;
      if (!dados) throw new Error(conjunto["onze-inicial"].motivo);
      return empacotar(await gerarOnzeInicial(dados), dados, "onze-inicial");
    }
    case "homem-do-jogo": {
      const dados = conjunto["homem-do-jogo"].dados;
      if (!dados) throw new Error(conjunto["homem-do-jogo"].motivo);
      return empacotar(await gerarHomemDoJogo(dados), dados, "homem-do-jogo");
    }
    case "placar-final": {
      const dados = conjunto["placar-final"].dados;
      if (!dados) throw new Error(conjunto["placar-final"].motivo);
      const completo = { ...dados, formato: formatoPlacar };
      const sufixo = formatoPlacar === "quadrado" ? "placar-final-quadrado" : "placar-final";
      return empacotar(await gerarPlacarFinal(completo), dados, sufixo);
    }
  }
}

async function empacotar(canvas: HTMLCanvasElement, jogo: JogoImagem, tipo: string): Promise<Gerada> {
  return { blob: await canvasParaPng(canvas), nome: nomeFicheiro(jogo, tipo) };
}
