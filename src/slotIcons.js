// slotIcons.js — emblemas OFICIALES de ranura del marketplace de Axie Infinity
// (app.axieinfinity.com/marketplace/axies, filtro "Parts"): el mismo icono para
// TODOS los Axies de esa ranura, sea cual sea la parte concreta o la clase.
// Descargados directamente del
// CDN publico de Axie (cdn.axieinfinity.com/marketplace-website/asset-icon/
// part-icons/dark-<slot>.png) a public/assets/axie/slot-icons/. Sustituyen al
// render 3D por (clase, ranura) de partIcon3D.js, que se queda en el repo sin
// usar (mismo criterio que axieMixer.js/AxieSprite.jsx: puente descartado que
// se deja como referencia).
export const SLOT_ICON_URL = {
  eyes: '/assets/axie/slot-icons/eyes.png',
  ears: '/assets/axie/slot-icons/ears.png',
  horn: '/assets/axie/slot-icons/horn.png',
  mouth: '/assets/axie/slot-icons/mouth.png',
  back: '/assets/axie/slot-icons/back.png',
  tail: '/assets/axie/slot-icons/tail.png',
}
