import { CombatLogIcon } from './LineIcons'

const RULES = [
  [/Empieza el asedio/i, 'attack'], [/se acaba el reloj/i, 'event'], [/^Lord \w+: /, 'target'],
  [/estaba bendecido/i, 'heal'], [/Templanza/i, 'heal'], [/estaba marcado/i, 'target'],
  [/cae\.?/, 'event'], [/remata/, 'attack'], [/reposiciona/i, 'move'], [/se mueve/i, 'move'],
  [/avanza/i, 'move'], [/empuja/i, 'attack'], [/Ignora el escudo/i, 'attack'],
  [/absorbe/i, 'shield'], [/de escudo/, 'shield'], [/se hace \d+ de dano/, 'attack'],
  [/usa (la marca|marca|Marca)/, 'target'], [/usa /, 'attack'], [/dispara/, 'attack'],
  [/duplica/, 'event'], [/invoca/, 'event'], [/protege/, 'shield'], [/marca a/, 'target'],
  [/cura/, 'heal'], [/no tiene/, 'event'], [/^[^ ]+ \w+: /, 'event'], [/Tira los dados/, 'event'],
]

function logIco(line) {
  for (const [re, kind] of RULES) {
    if (re.test(line)) return kind
  }
  return 'event'
}

export default function BattleLog({ log, slim }) {
  if (slim) {
    const last = log[log.length - 1]
    if (!last) return null
    return (
      <section className="log slim" title={log.join('\n')}>
        <span className="log-ico" aria-hidden="true"><CombatLogIcon kind={logIco(last)} /></span>
        <span className="log-slim-text">{last}</span>
      </section>
    )
  }
  return (
    <section className="log">
      {log.map((line, index) => (
        <div key={index} className="log-line">
          <span className="log-ico" aria-hidden="true"><CombatLogIcon kind={logIco(line)} /></span>
          <span>{line}</span>
        </div>
      ))}
    </section>
  )
}
