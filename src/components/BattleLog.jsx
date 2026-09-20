import { CombatLogIcon } from './LineIcons'

const RULES = [
  [/siege begins/i, 'attack'], [/clock runs out/i, 'event'], [/^\w+ Lord: /, 'target'],
  [/was blessed/i, 'heal'], [/Temperance/i, 'heal'], [/was marked/i, 'target'],
  [/falls\.?/, 'event'], [/finishes off/, 'attack'], [/repositions/i, 'move'], [/moves/i, 'move'],
  [/advances/i, 'move'], [/pushes/i, 'attack'], [/Ignores the target/i, 'attack'],
  [/absorbs/i, 'shield'], [/shield/, 'shield'], [/takes \d+ self-damage/, 'attack'],
  [/uses (the )?mark/i, 'target'], [/uses /, 'attack'], [/fires/, 'attack'],
  [/duplicates/, 'event'], [/summons/, 'event'], [/shields /, 'shield'], [/marks /, 'target'],
  [/heals/, 'heal'], [/has no/, 'event'], [/^[^ ]+ \w+: /, 'event'], [/Roll the dice/, 'event'],
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
