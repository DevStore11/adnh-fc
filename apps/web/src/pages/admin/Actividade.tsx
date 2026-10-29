import { useState } from "react";
import { Carregando, ErroCarregar, SemDados } from "../../components/ui/Estados";
import { obterActividade } from "../../lib/api";
import { formatarDataHora } from "../../lib/formatadores";
import { usarPedido } from "../../lib/usar-pedido";

const ROTULOS_ACCAO: Record<string, string> = {
  login: "Entrou na conta",
  login_falhou: "Falha de login",
  logout: "Saiu da conta",
  senha_trocada: "Trocou a senha",
  gestor_criado: "Criou gestor",
  gestor_activado: "Reactivou gestor",
  gestor_desactivado: "Suspendeu gestor",
  gestor_senha_redefinida: "Redefiniu a senha do gestor",
  clube_actualizado: "Alterou o clube",
  jogador_criado: "Criou jogador",
  jogador_actualizado: "Alterou jogador",
  jogador_apagado: "Apagou jogador",
  jogador_foto_actualizada: "Mudou a foto do jogador",
  jogador_foto_removida: "Removeu a foto do jogador",
  jogo_criado: "Criou jogo",
  jogo_actualizado: "Alterou jogo",
  jogo_apagado: "Apagou jogo",
  jogo_convocatoria: "Alterou a convocatória",
  jogo_escalacao: "Alterou a escalação",
  jogo_resultado: "Registou o resultado",
  jogo_evento_registado: "Registou um evento",
  jogo_evento_apagado: "Apagou um evento",
};

export default function Actividade() {
  const [pagina, definirPagina] = useState(1);
  const { estado, recarregar } = usarPedido((sinal) => obterActividade(pagina, sinal), [pagina]);

  const dados = estado.fase === "pronto" ? estado.dados : null;

  return (
    <div className="pagina-privada">
      <header className="pagina-privada__cabeca">
        <div>
          <p className="antetitulo">Registo de auditoria{dados ? ` · ${dados.total} registos` : ""}</p>
          <h1 className="pagina-privada__titulo">Actividade</h1>
        </div>
      </header>

      {estado.fase === "carregando" && <Carregando />}
      {estado.fase === "erro" && <ErroCarregar aoTentar={recarregar} />}
      {dados && dados.registos.length === 0 && (
        <SemDados titulo="Sem actividade" texto="Os acessos e as alterações ficam registados aqui." />
      )}
      {dados && dados.registos.length > 0 && (
        <>
          <table className="tabela">
            <caption className="so-leitores">Registo de actividade</caption>
            <thead>
              <tr>
                <th scope="col">Data e hora</th>
                <th scope="col">Quem</th>
                <th scope="col">Acção</th>
                <th scope="col">Alvo</th>
                <th scope="col">IP</th>
              </tr>
            </thead>
            <tbody>
              {dados.registos.map((registo) => (
                <tr key={registo.id}>
                  <td data-rotulo="Data e hora" className="tabela__suave">
                    {formatarDataHora(registo.data)}
                  </td>
                  <td data-rotulo="Quem" className="tabela__forte">
                    {registo.quem ?? "(desconhecido)"}
                  </td>
                  <td data-rotulo="Acção" className={registo.accao === "login_falhou" ? "tabela__erro" : undefined}>
                    {ROTULOS_ACCAO[registo.accao] ?? registo.accao}
                  </td>
                  <td data-rotulo="Alvo">{registo.alvo ?? "—"}</td>
                  <td data-rotulo="IP" className="tabela__suave">
                    {registo.ip ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <nav className="paginacao" aria-label="Páginas do registo">
            <button
              type="button"
              className="ligacao ligacao--botao"
              disabled={dados.pagina <= 1}
              onClick={() => definirPagina(dados.pagina - 1)}
            >
              ← Anterior
            </button>
            <span>
              Página {dados.pagina} de {dados.totalPaginas}
            </span>
            <button
              type="button"
              className="ligacao ligacao--botao"
              disabled={dados.pagina >= dados.totalPaginas}
              onClick={() => definirPagina(dados.pagina + 1)}
            >
              Seguinte →
            </button>
          </nav>
        </>
      )}
    </div>
  );
}
