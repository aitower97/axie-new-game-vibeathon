// BaseScreen.jsx — pantalla meta "Base" (first-approach): Estado del Puesto de
// mando. Muestra el Lord real del perfil (Portrait3D compartido con el tablero)
// y la escuadra viva, con una accion real: curar al Lord gastando esencia del
// meta-estado. El resto (construcciones, escuadrones guardados, equipamiento)
// es intencion de producto comentada, sin implementar.
import MetaScreen, { MetaUnitRow, StatChip } from './MetaScreen'
import Portrait3D from '../../Portrait3D'
import { AXIE_SAMPLE_GENES } from '../../Board3D'
import { LORD_DESCRIPTORS } from '../../axieGeneCatalog'
import { LORD_STATS } from '../../axie'
import { HpBar } from '../Emblems'

const HEAL_COST = 1
const HEAL_AMOUNT = 30

export default function BaseScreen({ units, playerLordHp, essence, onHealLord }) {
  const squad = units.filter((u) => u.side === 'player' && u.alive)
  const dead = units.filter((u) => u.side === 'player' && !u.alive)
  return (
    <MetaScreen
      icon="🏰"
      title="Puesto de mando"
      blurb="El Lord es el unico axie que sobrevive entre partidas: la tropa se destruye de forma permanente (sumidero asimetrico). Aqui se curan sus heridas y se planifica la defensa."
    >
      <div className="meta-grid">
        <div className="meta-panel meta-lord-panel">
          <div className="meta-lord-portrait">
            <Portrait3D
              className="axie-sprite"
              size={96}
              descriptor={LORD_DESCRIPTORS.player}
              genes={AXIE_SAMPLE_GENES}
            />
          </div>
          <div className="meta-lord-info">
            <div className="meta-lord-title">
              <b>LORD</b> · Puesto de mando
            </div>
            <HpBar hp={Math.max(playerLordHp, 0)} maxHp={LORD_STATS.hp} showValue />
            <div className="meta-lord-stats">
              <StatChip label="RNG" value={LORD_STATS.range} title="Alcance del ataque" />
              <StatChip label="ATK" value={LORD_STATS.atk} title="Dano del Ataque del Lord" />
              <StatChip label="HP" value={`${Math.max(playerLordHp, 0)}/${LORD_STATS.hp}`} />
            </div>
            <button
              type="button"
              className="ghost meta-action"
              disabled={essence < HEAL_COST || playerLordHp >= LORD_STATS.hp}
              onClick={onHealLord}
              title={essence < HEAL_COST ? `Necesitas ${HEAL_COST} de esencia` : `Cura ${HEAL_AMOUNT} de vida`}
            >
              Curar Lord +{HEAL_AMOUNT} ({HEAL_COST} esencia)
            </button>
            <p className="meta-note">
              First-approach: la curacion gasta esencia del meta-estado de sesion. El ritmo real
              de curacion/mantenimiento se decide en la vision de producto.
            </p>
          </div>
        </div>

        <div className="meta-panel">
          <div className="meta-panel-title">Escuadra en guardia</div>
          {squad.length === 0 && <p className="meta-note">No quedan axies en pie.</p>}
          {squad.map((u) => (
            <MetaUnitRow key={u.id} u={u} />
          ))}
          {dead.length > 0 && (
            <p className="meta-note">
              {dead.length} caido{dead.length > 1 ? 's' : ''} perdido{dead.length > 1 ? 's' : ''} de forma
              permanente. Reclutar reemplazos es una pantalla futura.
            </p>
          )}
        </div>
      </div>
    </MetaScreen>
  )
}