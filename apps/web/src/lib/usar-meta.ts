import { useEffect } from "react";

const TITULO_PREDEFINIDO = "ADNH-FC";

function definirDescricao(texto: string): void {
  let etiqueta = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!etiqueta) {
    etiqueta = document.createElement("meta");
    etiqueta.name = "description";
    document.head.append(etiqueta);
  }
  etiqueta.content = texto;
}

// Título do separador (e descrição) de cada página. Em "null" mantém o título predefinido enquanto os dados carregam.
// As meta-tags de partilha para o WhatsApp vêm do servidor (routes/paginas.ts), porque os robôs não correm a SPA.
export function usarMeta(titulo: string | null, descricao?: string): void {
  useEffect(() => {
    document.title = titulo ?? TITULO_PREDEFINIDO;
    if (descricao) definirDescricao(descricao);
  }, [titulo, descricao]);
}
