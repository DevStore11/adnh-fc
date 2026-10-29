import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { SENHA_TAMANHO_MINIMO, trocarSenhaEntradaSchema } from "@adnh-fc/shared";
import { caminhoInicial, useAuth } from "../../app/AuthContexto";
import { Carregando } from "../../components/ui/Estados";
import { PaginaAcesso } from "../../components/ui/PaginaAcesso";
import { ErroApi, trocarSenha } from "../../lib/api";

export default function TrocarSenha() {
  const { estado, iniciarSessao, terminarSessao } = useAuth();
  const navegar = useNavigate();
  const [senhaActual, definirSenhaActual] = useState("");
  const [novaSenha, definirNovaSenha] = useState("");
  const [repetida, definirRepetida] = useState("");
  const [erro, definirErro] = useState<string | null>(null);
  const [aEnviar, definirAEnviar] = useState(false);

  if (estado.fase === "carregando") return <Carregando />;
  if (estado.fase === "anonimo") return <Navigate to="/entrar" replace />;

  const obrigatoria = estado.utilizador.deveTrocarSenha;

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault();
    if (novaSenha !== repetida) {
      definirErro("As duas senhas novas não coincidem.");
      return;
    }
    const dados = trocarSenhaEntradaSchema.safeParse({ senhaActual, novaSenha });
    if (!dados.success) {
      definirErro(`A nova senha deve ter pelo menos ${SENHA_TAMANHO_MINIMO} caracteres.`);
      return;
    }

    definirAEnviar(true);
    definirErro(null);
    try {
      const utilizador = await trocarSenha(dados.data);
      iniciarSessao(utilizador);
      navegar(caminhoInicial(utilizador), { replace: true });
    } catch (falha) {
      if (falha instanceof ErroApi && (falha.estado === 400 || falha.estado === 429)) {
        definirErro(falha.message);
      } else {
        definirErro("Não foi possível trocar a senha. Verifique a ligação e tente de novo.");
      }
    } finally {
      definirAEnviar(false);
    }
  }

  return (
    <PaginaAcesso
      antetitulo={obrigatoria ? "Primeiro acesso" : "Conta"}
      titulo="Trocar senha"
      apoio={
        obrigatoria
          ? "A senha que recebeu é temporária. Escolha uma senha só sua para continuar."
          : "Ao trocar a senha, as outras sessões abertas são terminadas."
      }
    >
      {erro && (
        <div className="aviso-erro" role="alert">
          <p className="aviso-erro__titulo">{erro}</p>
        </div>
      )}
      <form className="formulario" onSubmit={(evento) => void aoSubmeter(evento)} noValidate>
        <div className="controlo">
          <label htmlFor="troca-actual">Senha actual</label>
          <input
            id="troca-actual"
            type="password"
            autoComplete="current-password"
            value={senhaActual}
            onChange={(evento) => definirSenhaActual(evento.target.value)}
            required
          />
        </div>
        <div className="controlo">
          <label htmlFor="troca-nova">Nova senha</label>
          <input
            id="troca-nova"
            type="password"
            autoComplete="new-password"
            value={novaSenha}
            onChange={(evento) => definirNovaSenha(evento.target.value)}
            aria-describedby="troca-ajuda"
            required
          />
          <p className="controlo__ajuda" id="troca-ajuda">
            Mínimo de {SENHA_TAMANHO_MINIMO} caracteres.
          </p>
        </div>
        <div className="controlo">
          <label htmlFor="troca-repetida">Repetir nova senha</label>
          <input
            id="troca-repetida"
            type="password"
            autoComplete="new-password"
            value={repetida}
            onChange={(evento) => definirRepetida(evento.target.value)}
            required
          />
        </div>
        <button type="submit" className="botao" disabled={aEnviar}>
          {aEnviar ? "A guardar…" : "Guardar senha"}
        </button>
      </form>
      <button type="button" className="ligacao ligacao--botao" onClick={() => void terminarSessao()}>
        Sair
      </button>
    </PaginaAcesso>
  );
}
