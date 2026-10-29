import type { Context } from "hono";

export function obterIp(c: Context): string {
  return c.req.header("CF-Connecting-IP") ?? "desconhecido";
}

// Para mostrar no registo de actividade: esconde o fim do endereço (41.220.x.x).
export function mascararIp(ip: string | null): string | null {
  if (!ip) return null;
  if (ip.includes(":")) return `${ip.split(":").slice(0, 3).join(":")}:x`;
  const octetos = ip.split(".");
  return octetos.length === 4 ? `${octetos[0]}.${octetos[1]}.x.x` : ip;
}
