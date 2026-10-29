import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { entrarEntradaSchema } from "@adnh-fc/shared";
import { caminhoInicial, useAuth } from "../../app/AuthContexto";
import { PaginaAcesso } from "../../components/ui/PaginaAcesso";
import { entrar, ErroApi } from "../../lib/api";

const MENSAGEM_GENERICA = "Verifique os dados e tente de novo.";

export default function Entrar() {
  const { estado, iniciarSessao } = useAuth();
  const navegar = useNavigate();
  const [email, definirEmail] = useState("");
  const [senha, definirSenha] = useState("");
  const [erro, definirErro] = useState<{ titulo: string; texto: string } | null>(null);
  const [aEnviar, definirAEnviar] = useState(false);

  if (estado.fase === "autenticado") return <Navigate to={caminhoInicial(estado.utilizador)} replace />;

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault();
    const dados = entrarEntradaSchema.safeParse({ email, senha });
    if (!dados.success) {
      definirErro({ titulo: "Email ou senha incorrectos", texto: MENSAGEM_GENERICA });
      return;
    }

    definirAEnviar(true);
    definirErro(null);
    try {
      const utilizador = await entrar(dados.data);
      iniciarSessao(utilizador);
      navegar(caminhoInicial(utilizador), { replace: true });
    } catch (falha) {
      if (falha instanceof ErroApi && falha.estado === 429) {
        definirErro({ titulo: "Demasiadas tentativas", texto: "Aguarde alguns minutos antes de tentar de novo." });
      } else if (falha instanceof ErroApi && falha.estado === 401) {
        definirErro({ titulo: "Email ou senha incorrectos", texto: MENSAGEM_GENERICA });
      } else {
        definirErro({ titulo: "Não foi possível entrar", texto: "Verifique a ligação e tente de novo." });
      }
      definirSenha("");
    } finally {
      definirAEnviar(false);
    }
  }

  return (
    <PaginaAcesso antetitulo="Acesso" titulo="Entrar" apoio="Use o email e a senha que a direcção lhe indicou.">
      {erro && (
        <div className="aviso-erro" role="alert">
          <p className="aviso-erro__titulo">{erro.titulo}</p>
          <p className="aviso-erro__texto">{erro.texto}</p>
        </div>
      )}
      <form className="formulario" onSubmit={(evento) => void aoSubmeter(evento)} noValidate>
        <div className="controlo">
          <label htmlFor="entrar-email">Email</label>
          <input
            id="entrar-email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(evento) => definirEmail(evento.target.value)}
            required
          />
        </div>
        <div className="controlo">
          <label htmlFor="entrar-senha">Senha</label>
          <input
            id="entrar-senha"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(evento) => definirSenha(evento.target.value)}
            required
          />
        </div>
        <button type="submit" className="botao" disabled={aEnviar}>
          {aEnviar ? "A entrar…" : "Entrar"}
        </button>
      </form>
      <Link to="/" className="ligacao">
        ← Voltar ao site
      </Link>
    </PaginaAcesso>
  );
}
