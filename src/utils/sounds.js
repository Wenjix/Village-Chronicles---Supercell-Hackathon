let audioCtx = null

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
