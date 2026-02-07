/**
 * Premade dialogue options the player can pick instead of typing.
 * Each mood has 3 options with different tones.
 * These are sent as the player's message through the LLM.
 */

export const DIALOGUE_OPTIONS = {
  happy: [
    { label: 'Praise their work', message: "You've been doing incredible work lately. The village is lucky to have you!" },
    { label: 'Ask about plans', message: "What projects are you excited about next?" },
    { label: 'Share good news', message: "The village is thriving! What do you think we should build next?" },
  ],
  tired: [
    { label: 'Offer a break', message: "You look exhausted. Why don't you take a rest? You've earned it." },
    { label: 'Encourage them', message: "I know it's been tough, but your hard work is really paying off." },
    { label: 'Bring them tea', message: "I brought you some hot aether-brew. Figured you could use the energy." },
  ],
  grumpy: [
    { label: 'Apologize', message: "I'm sorry things haven't been going well. What can I do to help?" },
    { label: 'Hear them out', message: "I can tell something's bothering you. Want to talk about it?" },
    { label: 'Appeal to pride', message: "Nobody does your job better than you. The village needs your expertise." },
  ],
  lazy: [
    { label: 'Gentle nudge', message: "I know rest is important, but the village could really use your skills right now." },
    { label: 'Make it fun', message: "I've got an interesting challenge for you — something only you could pull off." },
    { label: 'Bribe with reward', message: "Tell you what — help me out and I'll make sure you get the afternoon off tomorrow." },
  ],
  feuding: [
    { label: 'Mediate the feud', message: "I understand you're upset. Can we find a way to resolve this peacefully?" },
    { label: 'Take their side', message: "I hear your frustration. You make some valid points about this situation." },
    { label: 'Appeal to duty', message: "The village needs unity right now. Can you set this aside for the good of everyone?" },
  ],
}

/**
 * Get dialogue options for a given mood.
 * Falls back to happy options if mood not found.
 */
export function getDialogueOptions(mood) {
  return DIALOGUE_OPTIONS[mood] || DIALOGUE_OPTIONS.happy
}
