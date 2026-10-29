export const POSICOES = ["guarda-redes", "defesa", "médio", "avançado"] as const;
export const FORMACOES = ["4-4-2", "4-3-3", "3-5-2", "4-2-3-1"] as const;
export const ESTADOS_JOGADOR = ["activo", "lesionado", "suspenso"] as const;
export const PAPEIS = ["admin", "gestor"] as const;
export const TIPOS_EVENTO = ["golo", "assist", "amarelo", "vermelho", "golo_sofrido"] as const;
export const ACCOES_AUDITORIA = [
  "login",
  "login_falhou",
  "logout",
  "senha_trocada",
  "gestor_criado",
  "gestor_activado",
  "gestor_desactivado",
  "gestor_senha_redefinida",
  "clube_actualizado",
  "jogador_criado",
  "jogador_actualizado",
  "jogador_apagado",
  "jogador_foto_actualizada",
  "jogador_foto_removida",
  "jogo_criado",
  "jogo_actualizado",
  "jogo_apagado",
  "jogo_convocatoria",
  "jogo_escalacao",
  "jogo_resultado",
  "jogo_evento_registado",
  "jogo_evento_apagado",
] as const;

export const LIMITE_ESCUDO_BYTES = 100 * 1024;
export const SENHA_TAMANHO_MINIMO = 10;
export const LIMITE_FOTO_BYTES = 100 * 1024;
export const CONVOCADOS_MINIMO = 11;
export const CONVOCADOS_MAXIMO = 22;
export const TITULARES = 11;
