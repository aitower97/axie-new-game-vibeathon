// originsVfx.js — overlay additive de combate del Axie Origins Battle Kit.
//
// Puente JS (sin TypeScript) de `web-vfx` del kit (clip.ts + aquaticSlash.ts):
// reproduce en un canvas DOM los VFX de habilidades/buffs de Origins grabados como
// atlases additive (public/vfx/<id>/atlas.png + clip.json). El canvas va dentro del
// tablero (mismo espacio 3D CSS) con mix-blend-mode plus-lighter, sin clics.
//
// El clip.json trae los eventos OnAttack/OnHit con los nombres reales de animacion del
// mixer, asi que el ataque y la reaccion de golpe salen del propio clip, no de tablas
// duplicadas en el juego.

export async function loadCatalog() {
  const res = await fetch(`${import.meta.env.BASE_URL || '/'}vfx/index.json`)
  if (!res.ok) throw new Error('Fall VFX catalog')
  return res.json()
}

export async function loadClip(id) {
  const res = await fetch(`${import.meta.env.BASE_URL || '/'}vfx/${encodeURIComponent(id)}/clip.json`)
  if (!res.ok) throw new Error(`Fall VFX clip ${id}`)
  return res.json()
}

export function atlasUrl(clip) {
  return `${import.meta.env.BASE_URL || '/'}vfx/${encodeURIComponent(clip.id)}/${clip.atlas.file}`
}

function frameAt(clip, time) {
  return Math.min(clip.frames - 1, Math.max(0, Math.floor(time * clip.fps)))
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`No cargo la imagen ${url}`))
    img.src = url
  })
}

// Traduce el clip (grabado a 960x540 con atacante/defensor fijos) a las posiciones en
// pixel del tablero (espacio de layout del canvas, antes del transform 3D del padre).
export function mapCaptureToField(clip, anchors) {
  const { attacker, defender, fieldWidth } = anchors
  const cdx = clip.captureDefender.x - clip.captureAttacker.x
  const jdx = defender.x - attacker.x
  const captureSpan = Math.abs(cdx) > 8 ? Math.abs(cdx) : 390
  const spanScale = Math.abs(jdx) > 8 ? Math.abs(jdx) / captureSpan : 0.6
  const fitScale = fieldWidth > 0 ? (fieldWidth * 0.55) / clip.atlas.frameW : spanScale
  const scale = Math.min(Math.max(0.22, spanScale), Math.max(0.22, fitScale))
  const flip = Math.sign(jdx || 1) !== Math.sign(cdx || -1)
  return { scale, flip, defender }
}

function cropPointToField(clip, map, px, py) {
  const dx = px - clip.anchor.x
  const dy = py - clip.anchor.y
  const sx = map.flip ? -map.scale : map.scale
  return {
    x: map.defender.x + dx * sx,
    y: map.defender.y + dy * map.scale,
  }
}

export class AdditiveAtlas {
  constructor(clip, image) {
    this.clip = clip
    this.image = image
  }

  static async load(clip) {
    const image = await loadImage(atlasUrl(clip))
    return new AdditiveAtlas(clip, image)
  }

  drawIndex(ctx, index, x, y, scaleX, scaleY, originX, originY) {
    const { cols, frameW, frameH } = this.clip.atlas
    const col = index % cols
    const row = Math.floor(index / cols)
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scaleX, scaleY)
    ctx.drawImage(this.image, col * frameW, row * frameH, frameW, frameH, -originX, -originY, frameW, frameH)
    ctx.restore()
  }
}

// Reproduce un clip una vez sobre el canvas. Devuelve un handle con stop(). Los anchors
// se piden en cada frame (el tablero puede haberse redimensionado entre jugadas).
export function playOnCanvas(atlas, ctx, getAnchors, opts = {}) {
  const clip = atlas.clip
  const origin = clip.anchor
  let raf = 0
  let stopped = false
  const started = performance.now()
  const fired = new Set()

  const tick = () => {
    if (stopped) return
    const elapsed = (performance.now() - started) / 1000
    const t = Math.min(clip.duration, elapsed)
    const index = frameAt(clip, t)
    const transform = ctx.getTransform()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.setTransform(transform)
    const map = mapCaptureToField(clip, getAnchors())
    const pos = cropPointToField(clip, map, origin.x, origin.y)
    atlas.drawIndex(
      ctx,
      index,
      pos.x,
      pos.y,
      map.flip ? -map.scale : map.scale,
      map.scale,
      origin.x,
      origin.y,
    )
    for (const evt of clip.events || []) {
      const key = `${evt.function}:${evt.time}`
      if (t + 1 / clip.fps >= evt.time && !fired.has(key)) {
        fired.add(key)
        opts.onEvent?.(evt)
      }
    }
    if (elapsed >= clip.duration) {
      opts.onDone?.()
      stopTicker()
      return
    }
    raf = requestAnimationFrame(tick)
  }

  const stopTicker = () => cancelAnimationFrame(raf)

  raf = requestAnimationFrame(tick)
  return {
    stop() {
      stopped = true
      stopTicker()
      const transform = ctx.getTransform()
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      ctx.setTransform(transform)
    },
  }
}