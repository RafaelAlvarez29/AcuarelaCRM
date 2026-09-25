/**
 * Sustituto de la foto del producto. Esta herramienta no almacena imágenes.
 *
 * El color se deriva del id, no al azar: getPaletteColor() del proyecto
 * original es aleatorio y cambiaría en cada recarga, lo que haría imposible
 * reconocer un producto de un vistazo.
 */

/** Misma paleta que PALETTE_COLORS de src/lib/constants.ts. */
const PALETA = ["#EBABC3", "#9BD9D8", "#D2ABEE", "#F7C5A2", "#FE9FC1"] as const

function indiceDe(id: string): number {
  let suma = 0
  for (let i = 0; i < id.length; i += 1) suma += id.charCodeAt(i)
  return suma % PALETA.length
}

export function colorDe(id: string): string {
  return PALETA[indiceDe(id)]!
}

export function PastillaColor({
  id,
  nombre,
  tamano = 46,
}: {
  id: string
  nombre: string
  tamano?: number
}) {
  const inicial = nombre.trim().charAt(0).toUpperCase() || "?"
  return (
    <span
      className="pastilla"
      aria-hidden="true"
      style={{
        background: colorDe(id),
        width: tamano,
        height: tamano,
        fontSize: Math.round(tamano * 0.42),
      }}
    >
      {inicial}
    </span>
  )
}
