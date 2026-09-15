// HelpOverlay.jsx — ayuda real al hacer clic en el signo de interrogación del tablero: la
// burbuja de hover no bastaba, el clic abre un panel con lo minimo
// para jugar: objetivo, rondas, turno, energia y controles. UI local de
// BoardRegion (estado propio), no toca el estado de partida.
export default function HelpOverlay({ onClose }) {
  return (
    <div className="help-backdrop" onClick={onClose}>
      <div className="help-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Como jugar">
        <button type="button" className="help-close" onClick={onClose} aria-label="Cerrar">✕</button>
        <h2 className="help-title">Como jugar</h2>

        <section className="help-block">
          <h3>Objetivo</h3>
          <p>
            Lleva a tus Axies hasta la casilla del <b>Lord rival</b> y reduce su vida a 0 antes de
            que el Lord enemigo acabe con el tuyo.
          </p>
        </section>

        <section className="help-block">
          <h3>Rondas</h3>
          <p>
            La partida dura <b>8 rondas</b>. Una ronda = tu turno + el turno del rival. Si al llegar
            a la ronda 8 ningun Lord ha caido, gana quien tenga mas vida de Lord.
          </p>
        </section>

        <section className="help-block">
          <h3>Tu turno</h3>
          <p>
            Tira tus dados: cada Axie asienta la cara de una <b>parte de su cuerpo</b>. Usa esa cara
            (o el <b>Basico</b> libre) para atacar, moverte, hacer guardia... El rival juega su turno
            justo despues del tuyo.
          </p>
        </section>

        <section className="help-block">
          <h3>Energia</h3>
          <p>
            Cada <b>cara sin golpe</b> que asientas al tirar (guardia o reposicion) te da <b>+1 de
            Energia</b>. La banca <b>persiste toda la partida</b> (tope 5): guardala o gastala, dentro
            de las 8 rondas es una decision real. Usos: <b>+10 al proximo golpe</b> (2 E) o <b>+1
            casilla de movimiento</b> (2 E), justo antes de usar la habilidad en el panel del Axie
            seleccionado.
          </p>
        </section>

        <section className="help-block">
          <h3>Controles</h3>
          <p>
            Arrastra el tablero para mover la vista · rueda para hacer zoom · pulsa <b>R</b> para
            centrar la camara.
          </p>
        </section>

        <section className="help-block help-credits">
          <h3>Musica</h3>
          <p className="help-credits-line">
            Pistas de <b>Kevin MacLeod</b> (incompetech.com) con licencia <b>CC-BY 4.0</b> · Efectos
            del kit de <b>Kenney</b> (CC0). El silencio y la musica se alternan con el boton 🔊 del
            topbar. Lista completa y creditos en <code>public/music/README.md</code>.
          </p>
        </section>
      </div>
    </div>
  )
}
