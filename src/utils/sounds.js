import trackAdventureA from '../assets/music/789288__matio888__epic-adventure-soundtrack-for-video-games.mp3'
import trackAdventureB from '../assets/music/789290__matio888__epic-soundtrack-with-choir-and-strings-for-video-games.mp3'
import trackAdventureC from '../assets/music/789294__matio888__epic-soundtrack-for-video-game-adventures.mp3'

let audioCtx = null
const MUSIC_TRACKS = [trackAdventureA, trackAdventureB, trackAdventureC]
const MUSIC_VOLUME = 0.35
const CROSSFADE_SECONDS = 6
const MUSIC_MUTE_STORAGE_KEY = 'vc_music_muted'

let musicStarted = false
let currentTrackIndex = -1
let currentAudio = null
let transitionTimeout = null
let fadeInterval = null
let unlockBound = false
let musicMuted = false

try {
  musicMuted = localStorage.getItem(MUSIC_MUTE_STORAGE_KEY) === '1'
} catch {
  musicMuted = false
}

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

function playTone(frequency, duration = 0.15, type = 'sine', volume = 0.3) {
  try {
    const ctx = getCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(frequency, ctx.currentTime)
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch {
    // Audio not available
  }
}

export function playBuildStart() {
  playTone(220, 0.1, 'square', 0.15)
  setTimeout(() => playTone(330, 0.1, 'square', 0.15), 80)
}

export function playBuildComplete() {
  playTone(440, 0.15, 'sine', 0.2)
  setTimeout(() => playTone(660, 0.15, 'sine', 0.2), 100)
  setTimeout(() => playTone(880, 0.2, 'sine', 0.25), 200)
}

export function playCollect() {
  playTone(600, 0.08, 'sine', 0.1)
}

export function playUpgrade() {
  playTone(440, 0.1, 'triangle', 0.2)
  setTimeout(() => playTone(550, 0.1, 'triangle', 0.2), 80)
  setTimeout(() => playTone(880, 0.15, 'triangle', 0.25), 160)
}

export function playClick() {
  playTone(800, 0.05, 'sine', 0.1)
}

export function playRefusal() {
  playTone(300, 0.1, 'sawtooth', 0.15)
  setTimeout(() => playTone(200, 0.2, 'sawtooth', 0.12), 100)
}

export function playNegotiateSuccess() {
  playTone(523, 0.1, 'sine', 0.15)
  setTimeout(() => playTone(659, 0.1, 'sine', 0.15), 80)
  setTimeout(() => playTone(784, 0.15, 'sine', 0.2), 160)
}

export function playRandomEvent() {
  playTone(400, 0.08, 'triangle', 0.15)
  setTimeout(() => playTone(600, 0.08, 'triangle', 0.15), 60)
  setTimeout(() => playTone(500, 0.08, 'triangle', 0.15), 120)
  setTimeout(() => playTone(800, 0.15, 'triangle', 0.2), 180)
}

function pickNextTrackIndex() {
  if (MUSIC_TRACKS.length <= 1) return 0
  let next = Math.floor(Math.random() * MUSIC_TRACKS.length)
  while (next === currentTrackIndex) {
    next = Math.floor(Math.random() * MUSIC_TRACKS.length)
  }
  return next
}

function getTargetMusicVolume() {
  return musicMuted ? 0 : MUSIC_VOLUME
}

function persistMusicMuted() {
  try {
    localStorage.setItem(MUSIC_MUTE_STORAGE_KEY, musicMuted ? '1' : '0')
  } catch {
    // Storage unavailable
  }
}

function clearMusicTimers() {
  if (transitionTimeout) {
    clearTimeout(transitionTimeout)
    transitionTimeout = null
  }
  if (fadeInterval) {
    clearInterval(fadeInterval)
    fadeInterval = null
  }
}

function scheduleCrossfade(audio) {
  clearMusicTimers()
  const duration = Number.isFinite(audio.duration) ? audio.duration : 0
  if (!duration || duration <= CROSSFADE_SECONDS + 0.5) {
    audio.onloadedmetadata = () => scheduleCrossfade(audio)
    return
  }
  const delayMs = Math.max(0, (duration - CROSSFADE_SECONDS) * 1000)
  transitionTimeout = setTimeout(() => {
    void crossfadeToNextTrack()
  }, delayMs)
}

function bindUnlockListeners() {
  if (unlockBound) return
  unlockBound = true
  const unlock = () => {
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
    window.removeEventListener('touchstart', unlock)
    unlockBound = false
    if (!musicStarted) {
      void startBackgroundMusic()
    }
  }
  window.addEventListener('pointerdown', unlock, { once: true })
  window.addEventListener('keydown', unlock, { once: true })
  window.addEventListener('touchstart', unlock, { once: true })
}

async function crossfadeToNextTrack() {
  if (!currentAudio) return

  const nextIndex = pickNextTrackIndex()
  const nextAudio = new Audio(MUSIC_TRACKS[nextIndex])
  nextAudio.preload = 'auto'
  nextAudio.loop = false
  nextAudio.volume = 0
  nextAudio.currentTime = 0

  try {
    await nextAudio.play()
  } catch {
    musicStarted = false
    bindUnlockListeners()
    return
  }

  const oldAudio = currentAudio
  const steps = Math.max(1, Math.floor((CROSSFADE_SECONDS * 1000) / 100))
  let step = 0
  clearMusicTimers()
  fadeInterval = setInterval(() => {
    step += 1
    const t = Math.min(1, step / steps)
    const target = getTargetMusicVolume()
    oldAudio.volume = target * (1 - t)
    nextAudio.volume = target * t
    if (t >= 1) {
      clearMusicTimers()
      oldAudio.pause()
      oldAudio.currentTime = 0
      currentAudio = nextAudio
      currentTrackIndex = nextIndex
      scheduleCrossfade(currentAudio)
    }
  }, 100)
}

export async function startBackgroundMusic() {
  if (musicStarted || MUSIC_TRACKS.length === 0) return

  const startIndex = Math.floor(Math.random() * MUSIC_TRACKS.length)
  const audio = new Audio(MUSIC_TRACKS[startIndex])
  audio.preload = 'auto'
  audio.loop = false
  audio.volume = getTargetMusicVolume()
  audio.currentTime = 0

  try {
    await audio.play()
  } catch {
    musicStarted = false
    bindUnlockListeners()
    return
  }

  musicStarted = true
  currentTrackIndex = startIndex
  currentAudio = audio
  scheduleCrossfade(audio)
}

export function isMusicMuted() {
  return musicMuted
}

export function setMusicMuted(muted) {
  musicMuted = !!muted
  persistMusicMuted()

  if (currentAudio) {
    currentAudio.volume = getTargetMusicVolume()
  } else if (!musicMuted && !musicStarted) {
    void startBackgroundMusic()
  }
}

export function toggleMusicMuted() {
  setMusicMuted(!musicMuted)
  return musicMuted
}
