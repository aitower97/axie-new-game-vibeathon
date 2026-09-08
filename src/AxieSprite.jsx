// AxieSprite.jsx — dibuja un Axie real con @axieinfinity/mixer + pixi-spine, a partir
// del genoma del juego. Sustituye los cuadros de color por el Axie de verdad.
//
// El patron de carga de texturas (TextureAtlas + AtlasAttachmentLoader + SkeletonJson)
// es el que trae el propio paquete en su README (seccion "Complete Working Example").
import { useEffect, useRef } from 'react'
import { Application, Assets } from 'pixi.js'
import { Spine, TextureAtlas } from 'pixi-spine'
import { AtlasAttachmentLoader, SkeletonJson } from '@pixi-spine/runtime-3.8'
import { getAxieColorPartShift, getVariantAttachmentPath } from '@axieinfinity/mixer'
import { getAxieSprite, IDLE_ANIM } from './axieMixer'

const AXIE_IMAGES_URL = 'https://axiecdn.axieinfinity.com/mixer-stuffs/v6/'

async function loadSpine(genome, dominantClass) {
  const { skeletonDataAsset, variant, error } = getAxieSprite(genome, dominantClass)
  if (error || !skeletonDataAsset) throw new Error(error || 'Sin skeletonDataAsset')

  const partColorShift = getAxieColorPartShift(variant)
  const attachments = skeletonDataAsset.skins[0].attachments
  const toLoad = []
  for (const slotName in attachments) {
    for (const attachmentName in attachments[slotName]) {
      const path = attachments[slotName][attachmentName].path
      toLoad.push({
        key: path,
        imagePath: AXIE_IMAGES_URL + getVariantAttachmentPath(slotName, path, variant, partColorShift),
      })
    }
  }

  const loaded = await Promise.all(
    toLoad.map(async (r) => {
      try {
        return { key: r.key, texture: await Assets.load(r.imagePath) }
      } catch {
        return null
      }
    })
  )

  const allTextures = {}
  loaded.forEach((r) => {
    if (r) allTextures[r.key] = r.texture
  })

  const atlas = new TextureAtlas()
  atlas.addTextureHash(allTextures, false)
  const loader = new AtlasAttachmentLoader(atlas)
  const parser = new SkeletonJson(loader)
  const spineData = parser.readSkeletonData(skeletonDataAsset)
  return new Spine(spineData)
}

// attackSignal: { tick, anim } — cada vez que `tick` cambia se reproduce `anim` una vez
// y se vuelve a la animacion de reposo, sin desmontar el sprite ni recargar texturas.
export default function AxieSprite({ genome, dominantClass, size = 96, animation = IDLE_ANIM, attackSignal }) {
  const hostRef = useRef(null)
  const spineRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    let app = null
    let spine = null

    async function mount() {
      try {
        const s = await loadSpine(genome, dominantClass)
        if (cancelled || !hostRef.current) return
        spine = s

        app = new Application({
          width: size,
          height: size,
          backgroundAlpha: 0,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        })
        // Puramente decorativo: todos los clics los gestiona el DOM por debajo.
        // Sin esto, PixiJS hace hit-testing global en cada movimiento de raton
        // sobre la pagina (uno por cada Application viva) y el Spine de pixi-spine
        // lanza "currentTarget.isInteractive is not a function" al recorrerlo.
        app.stage.eventMode = 'none'
        hostRef.current.appendChild(app.view)

        if (spine.state.data.skeletonData.animations.some((a) => a.name === animation)) {
          spine.state.setAnimation(0, animation, true)
        }
        spine.update(0)

        const bounds = spine.getLocalBounds()
        const pad = 0.86
        const scale = (size * pad) / Math.max(bounds.width, bounds.height, 1)
        spine.scale.set(scale, scale)
        spine.x = size / 2 - (bounds.x + bounds.width / 2) * scale
        spine.y = size / 2 - (bounds.y + bounds.height / 2) * scale

        app.stage.addChild(spine)
        spineRef.current = spine
      } catch (err) {
        // Se queda sin dibujar: App.jsx cae al marcador de color si esto falla
        // (sin red al CDN, por ejemplo). No rompe la partida.
        console.warn('AxieSprite: no se pudo renderizar el Axie real', err)
      }
    }

    mount()

    return () => {
      cancelled = true
      spineRef.current = null
      if (spine) spine.destroy()
      if (app) app.destroy(true, { children: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genome, dominantClass, size, animation])

  useEffect(() => {
    const spine = spineRef.current
    if (!spine || !attackSignal || !attackSignal.tick) return
    const names = spine.state.data.skeletonData.animations.map((a) => a.name)
    const clip = names.includes(attackSignal.anim) ? attackSignal.anim : null
    if (!clip) return
    spine.state.setAnimation(0, clip, false)
    if (names.includes(animation)) spine.state.addAnimation(0, animation, true, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attackSignal])

  return <div className="axie-sprite" ref={hostRef} style={{ width: size, height: size }} />
}
