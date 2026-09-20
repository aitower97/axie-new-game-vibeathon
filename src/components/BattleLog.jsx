// BattleLog.jsx — registro de las ultimas lineas de la partida (App.jsx recorta
// el array a 7 entradas en pushLog). Cada linea lleva un emoji que resume la
// accion principal (logIco), a juego con el feedback visual de combate. El
// panel es una ventana fija con scroll propio para no crecer sin limite.
const RULES = [
  [/siege begins/i, '\u2694\uFE0F'],
  [/clock runs out/i, '\u23F0'],
  [/^\w+ Lord: /, '\u{1F451}'],
  [/was blessed/i, '\u2728'],
  [/Temperance/i, '\u2728'],
  [/was marked/i, '\u{1F3F7}\uFE0F'],
  [/falls\.?/, '\u{1F480}'],
  [/finishes off/, '\u{1F3AF}'],
  [/repositions/i, '\u{1F504}'],
  [/moves\b/i, '\u{1F6B6}'],
  [/advances/i, '\u{1F463}'],
  [/pushes/i, '\u{1F4A8}'],
  [/Ignores the target/i, '\u26A1'],
  [/absorbs/i, '\u{1F6E1}\uFE0F'],
  [/shield/, '\u{1F6E1}\uFE0F'],
  [/takes \d+ self-damage/, '\u{1F915}'],
  [/uses (the )?mark/i, '\u{1F3F7}\uFE0F'],
  [/uses /, '\u{1F4A5}'],
  [/fires/, '\u{1F4A5}'],
  [/duplicates/, '\u{1F465}'],
  [/summons/, '\u2728'],
  [/shields /, '\u{1F6E1}\uFE0F'],
  [/marks /, '\u{1F3F7}\uFE0F'],
  [/heals/, '\u{1F49A}'],
  [/has no/, '\u{1F6AB}'],
  [/^[^ ]+ \w+: /, '\u{1F3B2}'],
  [/Roll the dice/, '\u{1F3B2}'],
]

function logIco(line) {
  for (const [re, emoji] of RULES) {
    if (re.test(line)) return emoji
  }
  return '\u273D'
}

export default function BattleLog({ log, slim }) {
  if (slim) {
    const last = log[log.length - 1]
    if (!last) return null
    return (
      <section className="log slim" title={log.join('\n')}>
        <span className="log-ico" aria-hidden="true">{logIco(last)}</span>
        <span className="log-slim-text">{last}</span>
      </section>
    )
  }
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