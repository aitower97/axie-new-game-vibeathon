export default function GameHeader({ icon = '⌂', title, blurb, children, className = '' }) {
  return (
    <header className={`game-header meta-head ${className}`}>
      <img className="game-header-logo" src="/brand/axie-infinity-tactics-dices.png" alt="Axie Infinity Tactics Dice" />
      <span className="meta-icon" aria-hidden="true">{icon}</span>
      <div className="game-header-copy">
        <h1 className="meta-title">{title}</h1>
        <p className="meta-blurb">{blurb}</p>
      </div>
      {children}
    </header>
  )
}
