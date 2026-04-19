import type { BuffId, PerkId } from '../state'

export const namedFactions = ['House Veyra', 'Order of Glass', 'Pixor Scouts']

export const menuLore = [
  'Lake Pixor sits on the first open route to the Shadow Castle.',
  'House Veyra, the Order of Glass, and the Pixor Scouts all left aid behind for anyone still willing to hunt the Prince of Shadows.',
  'Charlie only needs one breach to prove his brother is still within reach.',
]

export const instructionLines = [
  'Break three scripted waves to reach the checkpoint before the boss breach.',
  'Space slashes, Q releases the time pulse, Shift dashes, and E parries.',
  'Water is toxic. Use landmarks, dodge windows, and telegraphs instead of forcing straight lines.',
]

export const bossIntroLines = [
  'Warden of Pixor: The lake already chose its dead. Leave your brother to the Prince.',
  'Charlie: Then the lake can learn a new name for fear.',
]

export const bossOutroLines = [
  'The warden is down. House Veyra marks the breach as stable, and the Scouts confirm the next trail points east toward the Cinder Causeway.',
  'The Prince of Shadows now knows Charlie is no longer guessing.',
]

export const loseSummary = 'Charlie fell before the breach was secured. The last stable checkpoint is still holding.'

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

