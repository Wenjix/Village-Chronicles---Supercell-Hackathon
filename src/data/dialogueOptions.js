/**
 * Premade dialogue options the player can pick instead of typing.
 * Each mood has 3 options with different tones.
 * These are sent as the player's message through the LLM.
 *
 * action types:
 *   'talk'  — normal conversation (default, no extra cost)
 *   'bribe' — costs gears, big mood improvement
 *   'rest'  — sends villager to rest (unavailable for a period, restores mood fully)
 */

export const DIALOGUE_OPTIONS = {
  happy: [
    { label: 'Praise their work', message: "You've been doing incredible work lately. The village is lucky to have you!", action: 'talk' },
    { label: 'Ask about plans', message: "What projects are you excited about next?", action: 'talk' },
    { label: 'Share good news', message: "The village is thriving! What do you think we should build next?", action: 'talk' },
  ],
  tired: [
    { label: 'Send to rest', message: "You look exhausted. Take some time off — you've earned it.", action: 'rest', description: 'Unavailable for 15 ticks, returns happy' },
    { label: 'Encourage them', message: "I know it's been tough, but your hard work is really paying off.", action: 'talk' },
    { label: 'Bring them tea', message: "I brought you some hot aether-brew. Figured you could use the energy.", action: 'talk' },
  ],
  grumpy: [
    { label: 'Apologize', message: "I'm sorry things haven't been going well. What can I do to help?", action: 'talk' },
    { label: 'Hear them out', message: "I can tell something's bothering you. Want to talk about it?", action: 'talk' },
    { label: 'Appeal to pride', message: "Nobody does your job better than you. The village needs your expertise.", action: 'talk' },
  ],
  lazy: [
    { label: 'Gentle nudge', message: "I know rest is important, but the village could really use your skills right now.", action: 'talk' },
    { label: 'Make it fun', message: "I've got an interesting challenge for you — something only you could pull off.", action: 'talk' },
    { label: 'Bribe (25 gears)', message: "Tell you what — here's 25 gears for your trouble. Help me out?", action: 'bribe', cost: 25 },
  ],
  feuding: [
    { label: 'Mediate the feud', message: "I understand you're upset. Can we find a way to resolve this peacefully?", action: 'talk' },
    { label: 'Take their side', message: "I hear your frustration. You make some valid points about this situation.", action: 'talk' },
    { label: 'Bribe (25 gears)', message: "Forget the feud — here's 25 gears to sweeten the deal. Can we move on?", action: 'bribe', cost: 25 },
  ],
}

/**
 * Get dialogue options for a given mood.
 * Falls back to happy options if mood not found.
 */
export function getDialogueOptions(mood) {
  return DIALOGUE_OPTIONS[mood] || DIALOGUE_OPTIONS.happy
}
