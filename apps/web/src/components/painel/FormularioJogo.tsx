import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  conflitoJogoSchema,
  jogoEntradaSchema,
  LADO_MAXIMO_IMAGEM,
  LIMITE_ESCUDO_BYTES,
  type JogoPainel,
} from "@adnh-fc/shared";
import { actualizarJogo, criarJogo, ErroApi, guardarEscudoAdversario, urlEscudoAdversario } from "../../lib/api";
import { comprimirParaWebp, ErroImagem } from "../../lib/comprimir-imagem";
import { isoParaMaputoLocal, maputoParaIso } from "../../lib/formatadores";

type Props = {
  jogo: JogoPainel | null;
  epocaPorOmissao: string;
  aoGuardar: (jogo: JogoPainel) => void;
  // Outro gestor alterou o jogo: recebe o estado actual para substituir o da lista.
  aoConflito: (actual: JogoPainel) => void;
  aoApagar: () => void;
  aoCancelar: () => void;
};

export function FormularioJogo({ jogo, epocaPorOmissao, aoGuardar, aoConflito, aoApagar, aoCancelar }: Props) {
  const [adversario, definirAdversario] = useState(jogo?.adversario ?? "");
  const [dataLocal, definirDataLocal] = useState(jogo ? isoParaMaputoLocal(jogo.data) : "");
  const [local, definirLocal] = useState(jogo?.local ?? "");
  const [competicao, definirCompeticao] = useState(jogo?.competicao ?? "");
  const [epoca, definirEpoca] = useState(jogo?.epoca ?? epocaPorOmissao);
  const [erro, definirErro] = useState<string | null>(null);
  const [conflito, definirConflito] = useState<JogoPainel | null>(null);
  const [aEnviar, definirAEnviar] = useState(false);
  // undefined = não mexer; null = remover; texto = novo escudo do adversário em base64
  const [escudo, definirEscudo] = useState<string | null | undefined>(undefined);
  const [escudoAusente, definirEscudoAusente] = useState(false);
  const [aProcessar, definirAProcessar] = useState(false);

  async function aoEscolherEscudo(evento: ChangeEvent<HTMLInputElement>) {
    const ficheiro = evento.target.files?.[0];
    evento.target.value = "";
    if (!ficheiro) return;
    definirAProcessar(true);
    definirErro(null);
    try {
      definirEscudo(await comprimirParaWebp(ficheiro, LADO_MAXIMO_IMAGEM, LIMITE_ESCUDO_BYTES));
    } catch (falha) {
      definirErro(falha instanceof ErroImagem ? falha.message : "Não foi possível processar a imagem.");
    } finally {
      definirAProcessar(false);
    }
  }

  // Pré-visualização: o escudo novo; ou, num jogo já guardado com o mesmo nome, o que está no site.
  const mesmoAdversario = jogo !== null && adversario.trim() === jogo.adversario.trim();
  const previa =
    escudo === null ? null : escudo ? `data:image/webp;base64,${escudo}` : mesmoAdversario && !escudoAusente ? urlEscudoAdversario(adversario) : null;

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault();
    if (!dataLocal) {
      definirErro("Indique a data e a hora do jogo.");
      return;
    }
    const dados = jogoEntradaSchema.safeParse({
      adversario,
      data: maputoParaIso(dataLocal),
      local,
      competicao,
      epoca,
    });
    if (!dados.success) {
      definirErro("Preencha o adversário, o local e a competição, e use uma época como 2026 ou 2026/27.");
      return;
    }

    definirAEnviar(true);
    definirErro(null);
    definirConflito(null);
    try {
      if (escudo !== undefined) await guardarEscudoAdversario({ nome: dados.data.adversario, escudo });
      const resultado = jogo
        ? await actualizarJogo(jogo.id, { ...dados.data, versao: jogo.versao })
        : await criarJogo(dados.data);
      aoGuardar(resultado);
    } catch (falha) {
      if (falha instanceof ErroApi && falha.estado === 409) {
        const analise = conflitoJogoSchema.safeParse(falha.corpo);
        if (analise.success) {
          definirConflito(analise.data.jogo);
          return;
        }
      }
      definirErro(
        falha instanceof ErroApi && falha.estado === 400
          ? falha.message
          : "Não foi possível guardar. Verifique a ligação e tente de novo.",
      );
    } finally {
      definirAEnviar(false);
    }
  }

  return (
    <form className="formulario" onSubmit={(evento) => void aoSubmeter(evento)} noValidate>
      {conflito && (
        <div className="aviso-conflito" role="alert">
          <p className="aviso-conflito__titulo">Outro gestor alterou este jogo</p>
          <p className="aviso-conflito__texto">
            As suas alterações não foram guardadas. Carregue a versão actual e volte a fazer a alteração.
          </p>
          <button type="button" className="botao" onClick={() => aoConflito(conflito)}>
            Carregar versão actual
          </button>
        </div>
      )}
      {erro && (
        <div className="aviso-erro" role="alert">
          <p className="aviso-erro__titulo">{erro}</p>
        </div>
      )}

      <div className="controlo">
        <label htmlFor="jogo-adversario">Adversário</label>
        <input id="jogo-adversario" value={adversario} onChange={(e) => definirAdversario(e.target.value)} maxLength={80} required />
      </div>
      <div className="controlo">
        <span className="controlo__rotulo" id="jogo-escudo-rotulo">
          Escudo do adversário (opcional)
        </span>
        <div className="escudo-edicao">
          <div className="escudo-edicao__moldura">
            {previa ? (
              <img src={previa} alt="Escudo do adversário" onError={() => definirEscudoAusente(true)} />
            ) : (
              <span>Sem escudo</span>
            )}
          </div>
          <div className="escudo-edicao__accoes">
            <label className="botao botao--secundario botao--ficheiro">
              {aProcessar ? "A processar…" : "Escolher imagem"}
              <input
                type="file"
                accept="image/*"
                onChange={(evento) => void aoEscolherEscudo(evento)}
                disabled={aProcessar}
                aria-labelledby="jogo-escudo-rotulo"
              />
            </label>
            {previa && (
              <button type="button" className="ligacao ligacao--botao ligacao--perigo" onClick={() => definirEscudo(null)}>
                Remover escudo
              </button>
            )}
            <p className="controlo__ajuda">
              Fica guardado para todos os jogos contra este adversário (pelo nome).
            </p>
          </div>
        </div>
      </div>
      <div className="controlo">
        <label htmlFor="jogo-data">Data e hora (hora de Maputo)</label>
        <input id="jogo-data" type="datetime-local" value={dataLocal} onChange={(e) => definirDataLocal(e.target.value)} required />
      </div>
      <div className="controlo">
        <label htmlFor="jogo-local">Local</label>
        <input id="jogo-local" value={local} onChange={(e) => definirLocal(e.target.value)} maxLength={80} required />
      </div>
      <div className="controlo">
        <label htmlFor="jogo-competicao">Competição</label>
        <input id="jogo-competicao" value={competicao} onChange={(e) => definirCompeticao(e.target.value)} maxLength={80} required />
      </div>
      <div className="controlo">
        <label htmlFor="jogo-epoca">Época</label>
        <input id="jogo-epoca" value={epoca} onChange={(e) => definirEpoca(e.target.value)} maxLength={9} required />
      </div>

      <div className="formulario__accoes">
        <button type="submit" className="botao" disabled={aEnviar || aProcessar}>
          {aEnviar ? "A guardar…" : jogo ? "Guardar" : "Criar jogo"}
        </button>
        {jogo?.estado === "agendado" && (
          <button type="button" className="botao botao--secundario" onClick={aoApagar} disabled={aEnviar}>
            Apagar
          </button>
        )}
        <button type="button" className="ligacao ligacao--botao" onClick={aoCancelar} disabled={aEnviar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
