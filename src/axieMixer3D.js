// axieMixer3D.js — mixer 3D de Axies COMPARTIDO entre el tablero y los retratos
// de las cartas (Portrait3D.jsx). El paquete @jaatster/threejs-axie-mixer3d-public
// descarga un pack de varios miles de ficheros por instancia de mixer, asi que se
// crea UNA sola vez para toda la app (singleton de modulo) y todos los que quieran
// crear un Axie pasan por aqui. El renderer "semilla" no se usa para dibujar nada:
// el mixer lo necesita para su assetStore (cargar texturas), pero los axies que
// crea son escenas Three.js normales que cualquier WebGLRenderer de la pagina
// puede pintar (THREE re-sube cada textura al contexto que la usa).
//
// No se hace dispose del mixer nunca: es compartido y vive lo que la pagina.
import * as THREE from 'three'
import { createAxieMixer3D } from '@jaatster/threejs-axie-mixer3d-public'

let sharedPromise = null

export function getSharedAxieMixer3D() {
  if (!sharedPromise) {
    const seedRenderer = new THREE.WebGLRenderer({ antialias: false })
    sharedPromise = createAxieMixer3D({ renderer: seedRenderer, assetBaseUrl: '/assets/axie/' })
  }
  return sharedPromise
}