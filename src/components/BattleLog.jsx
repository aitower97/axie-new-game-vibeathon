// BattleLog.jsx — registro de las ultimas lineas de la partida (App.jsx recorta
// el array a 7 entradas en pushLog). Cada linea lleva un emoji que resume la
// accion principal (logIco), a juego con el feedback visual de combate. El
// panel es una ventana fija con scroll propio para no crecer sin limite.
const RULES = [
  [/Empieza el asedio/i, '\u2694\uFE0F'],
  [/se acaba el reloj/i, '\u23F0'],
  [/^Lord \w+: /, '\u{1F451}'],
  [/estaba bendecido/i, '\u2728'],
  [/Templanza/i, '\u2728'],
  [/estaba marcado/i, '\u{1F3F7}\uFE0F'],
  [/cae\.?/, '\u{1F480}'],
  [/remata/, '\u{1F3AF}'],
  [/reposiciona/i, '\u{1F504}'],
  [/se mueve/i, '\u{1F6B6}'],
  [/avanza/i, '\u{1F463}'],
  [/empuja/i, '\u{1F4A8}'],
  [/Ignora el escudo/i, '\u26A1'],
  [/absorbe/i, '\u{1F6E1}\uFE0F'],
  [/de escudo/, '\u{1F6E1}\uFE0F'],
  [/se hace \d+ de dano/, '\u{1F915}'],
  [/usa (la marca|marca|Marca)/, '\u{1F3F7}\uFE0F'],
  [/usa /, '\u{1F4A5}'],
  [/dispara/, '\u{1F4A5}'],
  [/duplica/, '\u{1F465}'],
  [/invoca/, '\u2728'],
  [/protege/, '\u{1F6E1}\uFE0F'],
  [/marca a/, '\u{1F3F7}\uFE0F'],
  [/cura/, '\u{1F49A}'],
  [/no tiene/, '\u{1F6AB}'],
  [/^[^ ]+ \w+: /, '\u{1F3B2}'],
  [/Tira los dados/, '\u{1F3B2}'],
]

function logIco(line) {
  for (const [re, emoji] of RULES) {
    if (re.test(line)) return emoji
  }
  return '\u273D'
}

export default function BattleLog({ log }) {
  return (
    <section className="log">
      {log.map((l, i) => (
        <div key={i} className="log-line">
          <span className="log-ico" aria-hidden="true">{logIco(l)}</span>
          <span>{l}</span>
        </div>
      ))}
    </section>
  )
}