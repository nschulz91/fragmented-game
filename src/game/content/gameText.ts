import type { BuffId, ChallengeModifierId, FactionVariantId, PerkId, RelicId } from '../state'

export const namedFactions = ['House Veyra', 'Order of Glass', 'Pixor Scouts']

export const menuLore = [
  'Lake Pixor is no longer the whole mission. It is the first chapter in Charlie Smith’s hunt for the Prince of Shadows.',
  'House Veyra, the Order of Glass, and the Pixor Scouts each left a different way to push deeper into Parxillia.',
  'The Warden is only the first lock. The next trail burns east through the Cinder Causeway.',
]

export const instructionLines = [
  'Break three Lake Pixor waves, stabilize the checkpoint, and survive the Warden to unlock the route east.',
  'This is now a side-scrolling run: use upper and lower paths, jump between ledges, and do not stand in hazard channels.',
  'Space slashes, Up/W jumps, Q releases the time pulse, Shift dashes, E parries, and C charges a local detonation burst.',
  'Water and fire are both lethal. Use branches, telegraphs, and movement windows instead of forcing straight lines.',
]

export const briefingLines = [
  'Mission one is Lake Pixor. Break the Warden, claim the reward room, and force open the road into the Cinder Causeway.',
  'This run can also activate a faction variant, one equipped relic from the permanent pool, and one unlocked challenge modifier.',
  'The route is no longer a single fight. Each chapter carries a story beat, a pressure shift, and a more dangerous road east.',
]

export const pixorChapterCard = {
  title: 'Chapter 1',
  subtitle: 'Lake Pixor',
  body: 'A corrupted lakefront breach where the Shadow Court tests range pressure, toxic ground, and fear.',
}

export const routeChapterCard = {
  title: 'Transition',
  subtitle: 'Breach Road',
  body: 'The safe line between the shattered lake and the volcanic causeway is narrow, watched, and not actually safe.',
}

export const causewayChapterCard = {
  title: 'Chapter 2',
  subtitle: 'Cinder Causeway',
  body: 'A ruined volcanic transit route with tighter lanes, fracture vents, and coordinated Shadow Court pressure.',
}

export const pixorDialogue = [
  {
    speaker: 'Marshal Veyra',
    portrait: 'portrait-veyra',
    line: 'Lake Pixor is stable enough for one breach. Make it count. The road east will not stay open without proof.',
  },
  {
    speaker: 'Charlie',
    portrait: 'portrait-charlie',
    line: 'Then I break the Warden, take the road, and keep moving until my brother hears me coming.',
  },
]

export const pixorMidOneDialogue = [
  {
    speaker: 'Marshal Veyra',
    portrait: 'portrait-veyra',
    line: 'The first breach shelf is clear. Do not slow down now. The Warden is learning your pace from every kill.',
  },
  {
    speaker: 'Charlie',
    portrait: 'portrait-charlie',
    line: 'Then I stop giving him time to learn.',
  },
]

export const pixorMidTwoDialogue = [
  {
    speaker: 'Scout Runner',
    portrait: 'portrait-scout',
    line: 'The lower spillway is opening. Another push and the checkpoint ledge is yours.',
  },
  {
    speaker: 'Charlie',
    portrait: 'portrait-charlie',
    line: 'Good. Keep the road breathing. I only need one open line.',
  },
]

export const bossIntroLines = [
  {
    speaker: 'Warden of Pixor',
    portrait: 'portrait-warden',
    line: 'The lake already chose its dead. Leave your brother to the Prince and walk away while you still can.',
  },
  {
    speaker: 'Charlie',
    portrait: 'portrait-charlie',
    line: 'You were only the first wall. I did not come here to stop at the first wall.',
  },
]

export const bossOutroLines = [
  {
    speaker: 'Scout Runner',
    portrait: 'portrait-scout',
    line: 'The breach is holding. East route confirmed. Cinder Causeway is still burning, but it is open.',
  },
  {
    speaker: 'Charlie',
    portrait: 'portrait-charlie',
    line: 'Good. If the Prince wanted distance, he should have chosen a world with longer roads.',
  },
]

export const rewardRoomLines = [
  {
    speaker: 'Archivist of Glass',
    portrait: 'portrait-glass',
    line: 'Take what the Warden could not protect. Relics survive where certainty does not.',
  },
]

export const routeDialogue = [
  {
    speaker: 'Scout Runner',
    portrait: 'portrait-scout',
    line: 'The next line is rough. Shrine on the ridge, hunter packs on the road, and ember priests near the gates.',
  },
  {
    speaker: 'Charlie',
    portrait: 'portrait-charlie',
    line: 'Then the Causeway gets the same answer the lake got.',
  },
]

export const routeMidDialogue = [
  {
    speaker: 'Scout Runner',
    portrait: 'portrait-scout',
    line: 'The shrine line held longer than expected. The Causeway scouts died buying that time. Do not waste it.',
  },
  {
    speaker: 'Charlie',
    portrait: 'portrait-charlie',
    line: 'I am not here to waste anything. Not time. Not roads. Not the people the Prince leaves behind.',
  },
]

export const causewayIntroDialogue = [
  {
    speaker: 'Archivist of Glass',
    portrait: 'portrait-glass',
    line: 'The Causeway collapses in sections. Move fast, read the vents, and do not stand where the stone is already glowing.',
  },
  {
    speaker: 'Charlie',
    portrait: 'portrait-charlie',
    line: 'Then I take each section before it falls. The Prince is not getting another quiet mile.',
  },
]

export const causewayMidOneDialogue = [
  {
    speaker: 'Archivist of Glass',
    portrait: 'portrait-glass',
    line: 'The mid span is breaking the old way on purpose. Someone ahead is trying to slow only you, not the whole road.',
  },
  {
    speaker: 'Charlie',
    portrait: 'portrait-charlie',
    line: 'Good. That means I am finally close enough to bother them.',
  },
]

export const causewayMidTwoDialogue = [
  {
    speaker: 'Scout Runner',
    portrait: 'portrait-scout',
    line: 'Crown span ahead. After that, the Prince loses another shield and another place to hide his trail.',
  },
  {
    speaker: 'Charlie',
    portrait: 'portrait-charlie',
    line: 'Then the crown falls next.',
  },
]

export const causewayOutroDialogue = [
  {
    speaker: 'Charlie',
    portrait: 'portrait-charlie',
    line: 'The road is open. The Prince is finally running out of places to hide behind.',
  },
]

export const loseSummary =
  'Charlie fell before the chapter route was secured. Meta progress remains, but the run itself is gone.'

export const resultsSummary =
  'Run complete. The route is wider, the relic pool is stronger, and the next hunt can start with more than hope.'

export const buffLabels: Record<BuffId, string> = {
  'time-thread': 'Time Thread',
  'iron-blood': 'Iron Blood',
  'rift-step': 'Rift Step',
}

export const perkLabels: Record<PerkId, string> = {
  'house-veyra': 'House Veyra',
  'order-of-glass': 'Order of Glass',
  'pixor-scouts': 'Pixor Scouts',
}

export const relicLabels: Record<RelicId, string> = {
  'wardens-heart': 'Warden Heart',
  'glass-lens': 'Glass Lens',
  'scout-feather': 'Scout Feather',
  'ember-idol': 'Ember Idol',
}

export const modifierLabels: Record<ChallengeModifierId, string> = {
  'ember-tax': 'Ember Tax',
  'glass-fragility': 'Glass Fragility',
  'hunters-mark': 'Hunter’s Mark',
}

export const factionVariantLabels: Record<FactionVariantId, string> = {
  'house-veyra': 'House Veyra Variant',
  'order-of-glass': 'Order of Glass Variant',
  'pixor-scouts': 'Pixor Scouts Variant',
}
