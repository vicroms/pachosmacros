import {huntersMark} from './spells/ua-hunters-mark.js'
import {sneakAttack} from './class-features/rogue/ua-sneak-attack.js'
import {compelledDuel} from './effects/compelled-duel.js'
import {exhaustion} from './effects/exhaustion.js'
import {grapple} from './effects/grapple.js'

export let spells = {
  'huntersMark': huntersMark
}

export let classFeats = {
  'sneakAttack': sneakAttack,
}

export let effects = {
  'compelledDuel': compelledDuel,
  'exhaustion': exhaustion,
  'grapple': grapple
}
