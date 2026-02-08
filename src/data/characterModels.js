import maleAUrl from '../models/characters/male/character-male-a.glb'
import maleBUrl from '../models/characters/male/character-male-b.glb'
import maleCUrl from '../models/characters/male/character-male-c.glb'
import maleDUrl from '../models/characters/male/character-male-d.glb'
import maleEUrl from '../models/characters/male/character-male-e.glb'
import maleFUrl from '../models/characters/male/character-male-f.glb'
import femaleBUrl from '../models/characters/female/character-female-b.glb'
import femaleCUrl from '../models/characters/female/character-female-c.glb'
import femaleDUrl from '../models/characters/female/character-female-d.glb'
import femaleEUrl from '../models/characters/female/character-female-e.glb'
import femaleFUrl from '../models/characters/female/character-female-f.glb'

export const DEFAULT_CHARACTER_MODEL = maleAUrl

export const CHARACTER_MODEL_PATHS = [
  maleAUrl,
  maleBUrl,
  maleCUrl,
  maleDUrl,
  maleEUrl,
  maleFUrl,
  femaleBUrl,
  femaleCUrl,
  femaleDUrl,
  femaleEUrl,
  femaleFUrl,
]

const LEGACY_MODEL_URL_MAP = {
  '/src/models/characters/male/character-male-a.glb': maleAUrl,
  '/src/models/characters/male/character-male-b.glb': maleBUrl,
  '/src/models/characters/male/character-male-c.glb': maleCUrl,
  '/src/models/characters/male/character-male-d.glb': maleDUrl,
  '/src/models/characters/male/character-male-e.glb': maleEUrl,
  '/src/models/characters/male/character-male-f.glb': maleFUrl,
  '/src/models/characters/female/character-female-a.glb': femaleBUrl,
  '/src/models/characters/female/character-female-b.glb': femaleBUrl,
  '/src/models/characters/female/character-female-c.glb': femaleCUrl,
  '/src/models/characters/female/character-female-d.glb': femaleDUrl,
  '/src/models/characters/female/character-female-e.glb': femaleEUrl,
  '/src/models/characters/female/character-female-f.glb': femaleFUrl,
}

const MODEL_BY_FILENAME = {
  'character-male-a.glb': maleAUrl,
  'character-male-b.glb': maleBUrl,
  'character-male-c.glb': maleCUrl,
  'character-male-d.glb': maleDUrl,
  'character-male-e.glb': maleEUrl,
  'character-male-f.glb': maleFUrl,
  'character-female-a.glb': femaleBUrl,
  'character-female-b.glb': femaleBUrl,
  'character-female-c.glb': femaleCUrl,
  'character-female-d.glb': femaleDUrl,
  'character-female-e.glb': femaleEUrl,
  'character-female-f.glb': femaleFUrl,
}

export function normalizeCharacterModelUrl(modelUrl) {
  if (!modelUrl) return DEFAULT_CHARACTER_MODEL
  if (LEGACY_MODEL_URL_MAP[modelUrl]) return LEGACY_MODEL_URL_MAP[modelUrl]
  if (CHARACTER_MODEL_PATHS.includes(modelUrl)) return modelUrl

  const cleaned = String(modelUrl).split('?')[0].split('#')[0]
  const fileName = cleaned.substring(cleaned.lastIndexOf('/') + 1)
  if (MODEL_BY_FILENAME[fileName]) return MODEL_BY_FILENAME[fileName]

  return DEFAULT_CHARACTER_MODEL
}

export function pickCharacterModel() {
  return CHARACTER_MODEL_PATHS[Math.floor(Math.random() * CHARACTER_MODEL_PATHS.length)]
}
