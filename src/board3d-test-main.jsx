import { createRoot } from 'react-dom/client'
import Board3D from './Board3D'

createRoot(document.getElementById('root')).render(
  <Board3D rows={7} cols={8} blockUrl="/models/block-grass.glb" />
)
