export const CHRONICLE_TEMPLATES = {
  clockwork_forge: [
    "In the age of iron and ingenuity, the Clockwork Forge sprang to life, its great hammers beating a rhythm that echoed across the settlement.",
    "The chronicler notes: a new Forge has been erected, its bronze chimneys belching sparks into the twilight sky. The age of gears has begun.",
    "With a thunderous clang, the Clockwork Forge began its eternal labor — turning raw ore into the gears that shall drive our destiny.",
  ],
  steam_mill: [
    "Billowing clouds rose from the new Steam Mill, a testament to progress. The settlement's thirst for power grows ever greater.",
    "The great pistons of the Steam Mill have begun their tireless march. Steam — the very breath of industry — now flows through our veins.",
    "A monument to ambition: the Steam Mill stands tall, its whistles singing the song of a new era.",
  ],
  crystal_refinery: [
    "In hushed reverence, the Crystal Refinery was unveiled. Within its violet chambers, raw aether is distilled into shimmering crystals of impossible beauty.",
    "The Refinery glows with an otherworldly light. The chronicler warns: such power demands respect, lest it consume the unwary.",
    "Crystals — the tears of the old world — now flow from our Refinery. What wonders shall we craft with this arcane bounty?",
  ],
  airship_dock: [
    "The Airship Dock stretches toward the heavens, its mooring masts awaiting the great trade zeppelins from distant lands.",
    "Commerce takes flight! The Dock opens our settlement to the sky-trade routes. Prosperity descends from above.",
    "The chronicler records a momentous occasion: the first airship has been sighted on the horizon, drawn by our new Dock.",
  ],
  inventors_workshop: [
    "Behind locked doors and frosted glass, the Inventor toils. Blueprints scatter like autumn leaves — each one a seed of revolution.",
    "The Workshop hums with dangerous creativity. The chronicler suspects great things... or terrible ones... shall emerge.",
    "An Inventor's Workshop! The settlement's brightest mind has claimed this space. What marvels shall be born within?",
  ],
  milestone_5: [
    "Five structures now stand where once there was nothing. The chronicler marvels at the settlement's relentless growth.",
  ],
  milestone_10: [
    "Ten buildings! The settlement has become a proper town. The chronicler dips quill in ink to record this historic moment.",
  ],
  trade_boost: [
    "A great airship descends! For a blessed interval, all production doubles as exotic goods flood the market.",
  ],
}

export const MOOD_CHRONICLE_TEMPLATES = {
  proposed: [
    "Plans for a new {building} have been drawn up. The council seeks a willing worker to begin construction.",
    "A {building} has been proposed! Now, who shall take up the task of building it?",
  ],
  assigned: [
    "{villager} has accepted the task of constructing the {building}. Tools in hand, they march toward the site.",
    "The chronicler notes: {villager} sets forth to build the {building}, determination in their stride.",
  ],
  refusal: [
    "{villager} has refused to work on the {building}! Their {mood} mood makes them uncooperative.",
    "A setback — {villager} will not lift a finger for the {building}. Perhaps persuasion is in order.",
  ],
  negotiation: [
    "Through careful words and patience, {villager}'s spirits have been lifted. Their mood improves from {oldMood} to {newMood}.",
    "The village leader's diplomacy prevails! {villager} feels better after a thoughtful conversation.",
  ],
  feud: [
    "Tensions boil over! {villager} and {target} have begun a bitter feud. The settlement's harmony is shaken.",
    "The chronicler records with dismay: {villager} and {target} exchange harsh words. A feud erupts!",
  ],
  completion_happy: [
    "{villager}, whistling a merry tune, puts the finishing touches on the {building}. A job well done!",
    "With a satisfied grin, {villager} completes the {building}. Happy workers build the finest structures.",
  ],
  completion_tired: [
    "{villager} collapses against the finished {building}, exhausted but proud. It took everything they had.",
    "Bleary-eyed but determined, {villager} hammers the last nail into the {building}. Rest is well-earned.",
  ],
  completion_grumpy: [
    "{villager} finishes the {building} with a scowl. 'It's done. Don't ask me for anything else today.'",
    "Despite their foul mood, {villager} completes the {building}. Quality work, if begrudging.",
  ],
  completion_lazy: [
    "At long last, {villager} finishes the {building}. It took twice as long, but it's done... barely.",
    "{villager} yawns and stretches beside the completed {building}. 'See? I told you I'd get to it eventually.'",
  ],
  completion_feuding: [
    "{villager} finishes the {building} despite the ongoing feud. 'I did this for the village, not for THEM.'",
    "The {building} is complete — {villager} built it fueled by spite alone. Impressive, if concerning.",
  ],
  random_event: [
    "A strange wind blows through the settlement... {event}!",
    "The chronicler hastily scribbles: an unexpected turn — {event}!",
  ],
  mood_worsen: [
    "{villager}'s mood darkens from {oldMood} to {newMood}. Harsh words have consequences.",
    "The chronicler winces — {villager} grows {newMood} after a regrettable exchange. Diplomacy has failed.",
  ],
  bribe: [
    "{villager} pockets a generous bribe of {cost} gears. Their mood brightens considerably to {newMood}.",
    "Coin speaks louder than words — {villager} is swayed by {cost} gears. Now {newMood} and cooperative.",
  ],
  rest_start: [
    "{villager} has been sent to rest. They'll be unavailable for a while, but will return refreshed.",
    "The chronicler notes: {villager} retires to their quarters for much-needed rest. The village must manage without them.",
  ],
  rest_complete: [
    "{villager} returns from rest, looking refreshed and happy! Ready for duty once more.",
    "Well-rested and bright-eyed, {villager} emerges ready to work. Sometimes rest is the best medicine.",
  ],
}

export function getRandomChronicle(key) {
  const templates = CHRONICLE_TEMPLATES[key]
  if (!templates || templates.length === 0) return null
  return templates[Math.floor(Math.random() * templates.length)]
}

export function getMoodChronicle(key, replacements = {}) {
  const templates = MOOD_CHRONICLE_TEMPLATES[key]
  if (!templates || templates.length === 0) return null
  let text = templates[Math.floor(Math.random() * templates.length)]
  for (const [token, value] of Object.entries(replacements)) {
    text = text.replace(new RegExp(`\\{${token}\\}`, 'g'), value)
  }
  return text
}
