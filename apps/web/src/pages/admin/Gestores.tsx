import { useState, type FormEvent } from "react";
import { criarGestorEntradaSchema, type Gestor } from "@adnh-fc/shared";
import { Carregando, ErroCarregar, SemDados } from "../../components/ui/Estados";
import { ConfirmarDestrutivo } from "../../components/ui/ConfirmarDestrutivo";
import { actualizarGestor, criarGestor, ErroApi, listarGestores } from "../../lib/api";
import { formatarDataHora } from "../../lib/formatadores";
import { usarPedido } from "../../lib/usar-pedido";

type Credencial = { nome: string; email: string; senha: string };
type Confirmacao = { tipo: "suspender" | "redefinir"; gestor: Gestor };

function Carimbo({ gestor }: { gestor: Gestor }) {
  if (!gestor.activo) return <span className="carimbo carimbo--suspenso">Suspenso</span>;
  if (gestor.deveTrocarSenha) return <span className="carimbo carimbo--pendente">Senha temporária</span>;
  return <span className="carimbo carimbo--activo">Activo</span>;
}

function mensagemDe(falha: unknown): string {
  return falha instanceof ErroApi && falha.estado >= 400 && falha.estado < 500 && falha.estado !== 401
    ? falha.message
    : "Não foi possível concluir. Verifique a ligação e tente de novo.";
}

function PainelCredencial({ credencial, aoFechar }: { credencial: Credencial; aoFechar: () => void }) {
  const [copiada, definirCopiada] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(credencial.senha);
      definirCopiada(true);
    } catch {
      definirCopiada(false);
    }
  }

  return (
    <section className="credencial" aria-live="polite">
      <p className="antetitulo">Senha temporária · só aparece agora</p>
      <p className="credencial__texto">
        {credencial.nome} ({credencial.email}) entra com esta senha e terá de a trocar no primeiro acesso.
      </p>
      <p className="credencial__senha">{credencial.senha}</p>
      <div className="credencial__accoes">
        <button type="button" className="botao" onClick={() => void copiar()}>
          {copiada ? "Copiada" : "Copiar senha"}
        </button>
        <button type="button" className="botao botao--secundario" onClick={aoFechar}>
          Já guardei a senha
        </button>
      </div>
    </section>
  );
}

function FormularioGestor({ aoCriar, aoCancelar }: { aoCriar: (gestor: Gestor, senha: string) => void; aoCancelar: () => void }) {
  const [nome, definirNome] = useState("");
  const [email, definirEmail] = useState("");
  const [erro, definirErro] = useState<string | null>(null);
  const [aEnviar, definirAEnviar] = useState(false);

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault();
    const dados = criarGestorEntradaSchema.safeParse({ nome, email });
    if (!dados.success) {
      definirErro("Indique o nome (mínimo 2 letras) e um email válido.");
      return;
    }
    definirAEnviar(true);
    definirErro(null);
    try {
      const resposta = await criarGestor(dados.data);
      aoCriar(resposta.gestor, resposta.senhaTemporaria);
    } catch (falha) {
      definirErro(mensagemDe(falha));
    } finally {
      definirAEnviar(false);
    }
  }

  return (
    <form className="formulario formulario--painel" onSubmit={(evento) => void aoSubmeter(evento)} noValidate>
      <p className="antetitulo">Registar gestor</p>
      {erro && (
        <div className="aviso-erro" role="alert">
          <p className="aviso-erro__titulo">{erro}</p>
        </div>
      )}
      <div className="controlo">
        <label htmlFor="gestor-nome">Nome completo</label>
        <input id="gestor-nome" value={nome} onChange={(e) => definirNome(e.target.value)} maxLength={100} required />
      </div>
      <div className="controlo">
        <label htmlFor="gestor-email">Email</label>
        <input id="gestor-email" type="email" value={email} onChange={(e) => definirEmail(e.target.value)} required />
      </div>
      <div className="formulario__accoes">
        <button type="submit" className="botao" disabled={aEnviar}>
          {aEnviar ? "A criar…" : "Criar gestor"}
        </button>
        <button type="button" className="botao botao--secundario" onClick={aoCancelar} disabled={aEnviar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function Gestores() {
  const { estado, recarregar, substituir } = usarPedido((sinal) => listarGestores(sinal));
  const [aCriar, definirACriar] = useState(false);
  const [credencial, definirCredencial] = useState<Credencial | null>(null);
  const [confirmacao, definirConfirmacao] = useState<Confirmacao | null>(null);
  const [erroAccao, definirErroAccao] = useState<string | null>(null);
  const [aOcupar, definirAOcupar] = useState(false);

  function guardarNaLista(gestor: Gestor) {
    if (estado.fase !== "pronto") return;
    const outros = estado.dados.gestores.filter((g) => g.id !== gestor.id);
    const gestores = [...outros, gestor].sort((a, b) => a.nome.localeCompare(b.nome, "pt"));
    substituir({ gestores });
  }

  async function aplicar(gestor: Gestor, pedido: { activo: boolean } | { redefinirSenha: true }) {
    definirAOcupar(true);
    definirErroAccao(null);
    try {
      const resposta = await actualizarGestor(gestor.id, pedido);
      guardarNaLista(resposta.gestor);
      if (resposta.senhaTemporaria) {
        definirCredencial({ nome: gestor.nome, email: gestor.email, senha: resposta.senhaTemporaria });
      }
      definirConfirmacao(null);
    } catch (falha) {
      definirErroAccao(mensagemDe(falha));
    } finally {
      definirAOcupar(false);
    }
  }

  const gestores = estado.fase === "pronto" ? estado.dados.gestores : [];
  const activos = gestores.filter((g) => g.activo).length;

  return (
    <div className="pagina-privada">
      <header className="pagina-privada__cabeca">
        <div>
          <p className="antetitulo">{estado.fase === "pronto" ? `${gestores.length} registados · ${activos} activos` : "Gestores"}</p>
          <h1 className="pagina-privada__titulo">Gestores</h1>
        </div>
        {!aCriar && (
          <button type="button" className="botao" onClick={() => definirACriar(true)}>
            Registar gestor
          </button>
        )}
      </header>

      {credencial && <PainelCredencial credencial={credencial} aoFechar={() => definirCredencial(null)} />}

      {aCriar && (
        <FormularioGestor
          aoCancelar={() => definirACriar(false)}
          aoCriar={(gestor, senha) => {
            guardarNaLista(gestor);
            definirCredencial({ nome: gestor.nome, email: gestor.email, senha });
            definirACriar(false);
          }}
        />
      )}

      {erroAccao && !confirmacao && (
        <div className="aviso-erro" role="alert">
          <p className="aviso-erro__titulo">{erroAccao}</p>
        </div>
      )}

      {estado.fase === "carregando" && <Carregando />}
      {estado.fase === "erro" && <ErroCarregar aoTentar={recarregar} />}
      {estado.fase === "pronto" && gestores.length === 0 && (
        <SemDados
          titulo="Ainda sem gestores"
          texto="Registe o primeiro gestor: recebe uma senha temporária para entrar."
        />
      )}
      {estado.fase === "pronto" && gestores.length > 0 && (
        <table className="tabela">
          <caption className="so-leitores">Gestores registados</caption>
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">Email</th>
              <th scope="col">Estado</th>
              <th scope="col">Último acesso</th>
              <th scope="col">Acções</th>
            </tr>
          </thead>
          <tbody>
            {gestores.map((gestor) => (
              <tr key={gestor.id}>
                <td data-rotulo="Nome" className="tabela__forte">
                  {gestor.nome}
                </td>
                <td data-rotulo="Email">{gestor.email}</td>
                <td data-rotulo="Estado">
                  <Carimbo gestor={gestor} />
                </td>
                <td data-rotulo="Último acesso">{gestor.ultimoAcesso ? formatarDataHora(gestor.ultimoAcesso) : "Nunca"}</td>
                <td data-rotulo="Acções">
                  <div className="tabela__accoes">
                    <button
                      type="button"
                      className="ligacao ligacao--botao"
                      onClick={() => {
                        definirErroAccao(null);
                        definirConfirmacao({ tipo: "redefinir", gestor });
                      }}
                    >
                      Redefinir senha
                    </button>
                    {gestor.activo ? (
                      <button
                        type="button"
                        className="ligacao ligacao--botao ligacao--perigo"
                        onClick={() => {
                          definirErroAccao(null);
                          definirConfirmacao({ tipo: "suspender", gestor });
                        }}
                      >
                        Suspender
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="ligacao ligacao--botao"
                        disabled={aOcupar}
                        onClick={() => void aplicar(gestor, { activo: true })}
                      >
                        Reactivar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {confirmacao && (
        <ConfirmarDestrutivo
          titulo={
            confirmacao.tipo === "suspender"
              ? `Suspender ${confirmacao.gestor.nome}?`
              : `Redefinir a senha de ${confirmacao.gestor.nome}?`
          }
          texto={
            confirmacao.tipo === "suspender"
              ? `A conta de ${confirmacao.gestor.nome} (${confirmacao.gestor.email}) deixa de poder entrar e as sessões abertas terminam. Podes reactivar depois.`
              : `A senha actual de ${confirmacao.gestor.nome} (${confirmacao.gestor.email}) deixa de funcionar e as sessões abertas terminam. Será gerada uma senha temporária, mostrada uma única vez.`
          }
          rotuloConfirmar={confirmacao.tipo === "suspender" ? `Suspender ${confirmacao.gestor.nome}` : "Redefinir senha"}
          aOcupar={aOcupar}
          erro={erroAccao}
          aoCancelar={() => definirConfirmacao(null)}
          aoConfirmar={() =>
            void aplicar(confirmacao.gestor, confirmacao.tipo === "suspender" ? { activo: false } : { redefinirSenha: true })
          }
        />
      )}
    </div>
  );
}
