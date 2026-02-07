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

export function getRandomChronicle(key) {
  const templates = CHRONICLE_TEMPLATES[key]
  if (!templates || templates.length === 0) return null
  return templates[Math.floor(Math.random() * templates.length)]
}
