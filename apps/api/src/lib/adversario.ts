// Chave estável do adversário: minúsculas, sem acentos e com os espaços normalizados.
// "FNB", " fnb " e "Fnb" dão a mesma chave, por isso partilham o escudo.
export function chaveAdversario(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
