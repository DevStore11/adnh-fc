type Props = {
  url: string | null;
  className?: string;
};

// Escudo do clube; se o clube ainda não carregou um, usa o escudo de reserva.
export function Escudo({ url, className }: Props) {
  return <img src={url ?? "/escudo.png"} alt="" width={240} height={276} className={className} />;
}
