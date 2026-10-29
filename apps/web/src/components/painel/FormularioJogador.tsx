import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  ESTADOS_JOGADOR,
  jogadorEntradaSchema,
  LADO_MAXIMO_IMAGEM,
  LIMITE_FOTO_BYTES,
  POSICOES,
  type JogadorPainel,
} from "@adnh-fc/shared";
import {
  actualizarJogador,
  criarJogador,
  ErroApi,
  guardarFotoJogador,
  removerFotoJogador,
} from "../../lib/api";
import { comprimirParaWebp, ErroImagem } from "../../lib/comprimir-imagem";
import { abreviarPosicao, iniciais } from "../../lib/formatadores";

const LADO_FOTO = LADO_MAXIMO_IMAGEM;
const BYTES_FOTO = LIMITE_FOTO_BYTES;

// undefined = manter a foto; null = remover; texto = nova foto em base64
type AlteracaoFoto = string | null | undefined;

type Props = {
  jogador: JogadorPainel | null;
  aoGuardar: (jogador: JogadorPainel) => void;
  aoApagar: () => void;
  aoCancelar: () => void;
};

export function FormularioJogador({ jogador, aoGuardar, aoApagar, aoCancelar }: Props) {
  const [nome, definirNome] = useState(jogador?.nome ?? "");
  const [numero, definirNumero] = useState(jogador ? String(jogador.numero) : "");
  const [posicao, definirPosicao] = useState<string>(jogador?.posicao ?? POSICOES[0]);
  const [estado, definirEstado] = useState<string>(jogador?.estado ?? "activo");
  const [activo, definirActivo] = useState(jogador?.activo ?? true);
  const [foto, definirFoto] = useState<AlteracaoFoto>(undefined);
  const [erro, definirErro] = useState<string | null>(null);
  const [erroFoto, definirErroFoto] = useState<string | null>(null);
  const [aProcessar, definirAProcessar] = useState(false);
  const [aEnviar, definirAEnviar] = useState(false);

  const urlFoto =
    foto === undefined ? (jogador?.fotoUrl ?? null) : foto === null ? null : `data:image/webp;base64,${foto}`;

  async function aoEscolherFoto(evento: ChangeEvent<HTMLInputElement>) {
    const ficheiro = evento.target.files?.[0];
    evento.target.value = "";
    if (!ficheiro) return;
    definirAProcessar(true);
    definirErro(null);
    definirErroFoto(null);
    try {
      definirFoto(await comprimirParaWebp(ficheiro, LADO_FOTO, BYTES_FOTO));
    } catch (falha) {
      definirErroFoto(falha instanceof ErroImagem ? falha.message : "Não foi possível processar a imagem.");
    } finally {
      definirAProcessar(false);
    }
  }

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault();
    const dados = jogadorEntradaSchema.safeParse({
      nome,
      numero: Number(numero),
      posicao,
      estado,
      activo,
    });
    if (!dados.success) {
      definirErro("Indique o nome (mínimo 2 letras) e um número de camisola entre 1 e 99.");
      return;
    }

    definirAEnviar(true);
    definirErro(null);
    try {
      let resultado = jogador ? await actualizarJogador(jogador.id, dados.data) : await criarJogador(dados.data);
      if (typeof foto === "string") resultado = await guardarFotoJogador(resultado.id, foto);
      else if (foto === null && resultado.fotoUrl) resultado = await removerFotoJogador(resultado.id);
      aoGuardar(resultado);
    } catch (falha) {
      definirErro(
        falha instanceof ErroApi && (falha.estado === 400 || falha.estado === 409)
          ? falha.message
          : "Não foi possível guardar. Verifique a ligação e tente de novo.",
      );
    } finally {
      definirAEnviar(false);
    }
  }

  return (
    <form className="formulario" onSubmit={(evento) => void aoSubmeter(evento)} noValidate>
      {erro && (
        <div className="aviso-erro" role="alert">
          <p className="aviso-erro__titulo">{erro}</p>
        </div>
      )}

      <div className="controlo">
        <label htmlFor="jogador-nome">Nome</label>
        <input id="jogador-nome" value={nome} onChange={(e) => definirNome(e.target.value)} maxLength={80} required />
      </div>

      <div className="controlo">
        <label htmlFor="jogador-numero">Número da camisola</label>
        <input
          id="jogador-numero"
          type="number"
          inputMode="numeric"
          min={1}
          max={99}
          value={numero}
          onChange={(e) => definirNumero(e.target.value)}
          required
        />
        <p className="controlo__ajuda">De 1 a 99, único entre os jogadores activos.</p>
      </div>

      <fieldset className="controlo controlo--grupo">
        <legend className="controlo__rotulo">Posição</legend>
        <div className="segmentado">
          {POSICOES.map((valor) => (
            <label key={valor}>
              <input
                type="radio"
                name="jogador-posicao"
                value={valor}
                checked={posicao === valor}
                onChange={() => definirPosicao(valor)}
              />
              {abreviarPosicao(valor)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="controlo">
        <label htmlFor="jogador-estado">Estado</label>
        <select id="jogador-estado" value={estado} onChange={(e) => definirEstado(e.target.value)}>
          {ESTADOS_JOGADOR.map((valor) => (
            <option key={valor} value={valor}>
              {valor.charAt(0).toUpperCase()}
              {valor.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="controlo">
        <span className="controlo__rotulo" id="jogador-foto-rotulo">
          Foto
        </span>
        <div className="foto-edicao">
          <div className="foto-edicao__moldura">
            {urlFoto ? <img src={urlFoto} alt="Pré-visualização da foto" /> : <span aria-hidden="true">{iniciais(nome) || "—"}</span>}
          </div>
          <div className="escudo-edicao__accoes">
            <label className="botao botao--secundario botao--ficheiro">
              {aProcessar ? "A processar…" : "Escolher foto"}
              <input
                type="file"
                accept="image/*"
                onChange={(evento) => void aoEscolherFoto(evento)}
                disabled={aProcessar}
                aria-labelledby="jogador-foto-rotulo"
              />
            </label>
            {urlFoto && (
              <button type="button" className="ligacao ligacao--botao ligacao--perigo" onClick={() => definirFoto(null)}>
                Remover foto
              </button>
            )}
            {erroFoto && (
              <p className="aviso-erro__titulo" role="alert">
                {erroFoto}
              </p>
            )}
            <p className="controlo__ajuda">Reduzida para {LADO_FOTO} px e convertida para WebP (até {BYTES_FOTO / 1024} KB).</p>
          </div>
        </div>
      </div>

      <div className="controlo">
        <label className="interruptor">
          <input type="checkbox" checked={activo} onChange={(e) => definirActivo(e.target.checked)} />
          <span>Jogador activo</span>
        </label>
        <p className="controlo__ajuda">Desactivar tira o jogador das convocatórias novas e do plantel público, sem apagar o histórico.</p>
      </div>

      <div className="formulario__accoes">
        <button type="submit" className="botao" disabled={aEnviar || aProcessar}>
          {aEnviar ? "A guardar…" : jogador ? "Guardar" : "Criar jogador"}
        </button>
        {jogador && (
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
