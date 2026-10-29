import { useState, type ChangeEvent, type FormEvent } from "react";
import { clubeAdminEntradaSchema, LADO_MAXIMO_IMAGEM, LIMITE_ESCUDO_BYTES, type ClubeAdmin } from "@adnh-fc/shared";
import { Carregando, ErroCarregar } from "../../components/ui/Estados";
import { ErroApi, guardarClubeAdmin, obterClubeAdmin } from "../../lib/api";
import { comprimirParaWebp, ErroImagem } from "../../lib/comprimir-imagem";
import { usarPedido } from "../../lib/usar-pedido";

const LADO_ESCUDO = LADO_MAXIMO_IMAGEM;
const BYTES_ESCUDO = LIMITE_ESCUDO_BYTES;

// undefined = não mexer; null = remover; texto = novo escudo em base64
type AlteracaoEscudo = string | null | undefined;

function FormularioClube({ inicial, aoGuardar }: { inicial: ClubeAdmin; aoGuardar: (clube: ClubeAdmin) => void }) {
  const [nome, definirNome] = useState(inicial.nome);
  const [corPrimaria, definirCorPrimaria] = useState(inicial.corPrimaria);
  const [corSecundaria, definirCorSecundaria] = useState(inicial.corSecundaria);
  const [epoca, definirEpoca] = useState(inicial.epoca);
  const [escudo, definirEscudo] = useState<AlteracaoEscudo>(undefined);
  const [erro, definirErro] = useState<string | null>(null);
  const [aviso, definirAviso] = useState<string | null>(null);
  const [aProcessar, definirAProcessar] = useState(false);
  const [aEnviar, definirAEnviar] = useState(false);

  const escudoVisivel = escudo === undefined ? inicial.escudo : escudo;

  async function aoEscolherImagem(evento: ChangeEvent<HTMLInputElement>) {
    const ficheiro = evento.target.files?.[0];
    evento.target.value = "";
    if (!ficheiro) return;
    definirAProcessar(true);
    definirErro(null);
    definirAviso(null);
    try {
      definirEscudo(await comprimirParaWebp(ficheiro, LADO_ESCUDO, BYTES_ESCUDO));
    } catch (falha) {
      definirErro(falha instanceof ErroImagem ? falha.message : "Não foi possível processar a imagem.");
    } finally {
      definirAProcessar(false);
    }
  }

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault();
    const dados = clubeAdminEntradaSchema.safeParse({ nome, corPrimaria, corSecundaria, epoca, escudo });
    if (!dados.success) {
      definirErro("Verifique o nome do clube (mínimo 2 letras), as cores e a época (por exemplo 2026 ou 2026/27).");
      return;
    }
    definirAEnviar(true);
    definirErro(null);
    definirAviso(null);
    try {
      const clube = await guardarClubeAdmin(dados.data);
      definirEscudo(undefined);
      aoGuardar(clube);
      definirAviso("Alterações guardadas.");
    } catch (falha) {
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
    <form className="formulario formulario--largo" onSubmit={(evento) => void aoSubmeter(evento)} noValidate>
      {erro && (
        <div className="aviso-erro" role="alert">
          <p className="aviso-erro__titulo">{erro}</p>
        </div>
      )}
      {aviso && (
        <p className="aviso-ok" role="status">
          {aviso}
        </p>
      )}

      <div className="controlo">
        <label htmlFor="clube-nome">Nome do clube</label>
        <input id="clube-nome" value={nome} onChange={(e) => definirNome(e.target.value)} maxLength={80} required />
      </div>

      <div className="controlo">
        <label htmlFor="clube-epoca">Época actual</label>
        <input id="clube-epoca" value={epoca} onChange={(e) => definirEpoca(e.target.value)} maxLength={9} required />
        <p className="controlo__ajuda">
          Por exemplo 2026 ou 2026/27. É a época que a página inicial mostra e a que os jogos novos usam; os jogos já
          marcados não mudam.
        </p>
      </div>

      <div className="formulario__linha">
        <div className="controlo controlo--cor">
          <label htmlFor="clube-cor-1">Cor principal</label>
          <input id="clube-cor-1" type="color" value={corPrimaria} onChange={(e) => definirCorPrimaria(e.target.value)} />
          <span className="controlo__valor">{corPrimaria.toUpperCase()}</span>
        </div>
        <div className="controlo controlo--cor">
          <label htmlFor="clube-cor-2">Cor de destaque</label>
          <input
            id="clube-cor-2"
            type="color"
            value={corSecundaria}
            onChange={(e) => definirCorSecundaria(e.target.value)}
          />
          <span className="controlo__valor">{corSecundaria.toUpperCase()}</span>
        </div>
      </div>

      <div className="controlo">
        <span className="controlo__rotulo" id="clube-escudo-rotulo">
          Escudo
        </span>
        <div className="escudo-edicao">
          <div className="escudo-edicao__moldura">
            {escudoVisivel ? (
              <img src={`data:image/webp;base64,${escudoVisivel}`} alt="Escudo do clube" />
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
                onChange={(evento) => void aoEscolherImagem(evento)}
                disabled={aProcessar}
                aria-labelledby="clube-escudo-rotulo"
              />
            </label>
            {escudoVisivel && (
              <button type="button" className="ligacao ligacao--botao ligacao--perigo" onClick={() => definirEscudo(null)}>
                Remover escudo
              </button>
            )}
            <p className="controlo__ajuda">
              A imagem é reduzida para {LADO_ESCUDO} px e convertida para WebP (até {BYTES_ESCUDO / 1024} KB).
            </p>
          </div>
        </div>
      </div>

      <div className="formulario__accoes">
        <button type="submit" className="botao" disabled={aEnviar || aProcessar}>
          {aEnviar ? "A guardar…" : "Guardar alterações"}
        </button>
      </div>
    </form>
  );
}

export default function Clube() {
  const { estado, recarregar, substituir } = usarPedido((sinal) => obterClubeAdmin(sinal));

  return (
    <div className="pagina-privada">
      <header className="pagina-privada__cabeca">
        <div>
          <p className="antetitulo">Configuração</p>
          <h1 className="pagina-privada__titulo">Clube</h1>
        </div>
      </header>
      {estado.fase === "carregando" && <Carregando />}
      {estado.fase === "erro" && <ErroCarregar aoTentar={recarregar} />}
      {estado.fase === "pronto" && <FormularioClube inicial={estado.dados} aoGuardar={substituir} />}
    </div>
  );
}
