/* 
Using rules from One DnD
Should have an effect applied to user called 'Marking'. OnUseMacroName ItemMacro,damageBonus
*/

const MARKED_ID_KEY = "markedId"
const LAST_HIT_ROUND_KEY = "lastHitRound"
const SPELL_NAME = "Hunter's Mark"

async function item({actor, args, workflow}) {
  const effect = actor.appliedEffects.find(e => e.name === "Marking")
  if (args[0].macroPass === "DamageBonus") {
    return await damageBonus(actor, effect, workflow)
  } else if (args[0].macroPass === "postActiveEffects" && workflow.item.name === SPELL_NAME) {
    const targetToken = Array.from(workflow.hitTargets)[0]
    await trackQuarryId(actor, effect, targetToken.actor)
    return true
  }
}

async function damageBonus(actor, effect, workflow) {
  if (workflow.hitTargets.size > 0 && effect && game.combat) {
    const target = Array.from(workflow.hitTargets)[0]
    const markId = effect.changes.find(c => c.key === MARKED_ID_KEY)?.value
    const lastRoundHit = effect.changes.find(c => c.key === LAST_HIT_ROUND_KEY)?.value
    if (markId && markId === target.actor.uuid && String(lastRoundHit) !== String(game.combat.round)) {
      let damageType = 'force'
      const diceMult = workflow.diceRoll === 20 ? 2 : 1
      await targetHitTracking(actor, effect, game.combat.round)
      return { damageRoll: `${diceMult}d6[${damageType}]`, flavor: "Hunters Mark Damage" }
    }
  }
  return {}
}

async function targetHitTracking(actor, effect, roundNumber) {
  if (effect.changes.find(c => c.key === LAST_HIT_ROUND_KEY)) { 
    const i = effect.changes.findIndex(c => c.key === LAST_HIT_ROUND_KEY)
    effect.changes[i].value = roundNumber
    let newEffect = { _id: effect._id, changes: effect.changes }
    await actor.updateEmbeddedDocuments("ActiveEffect", [newEffect])
  } else {
    let newEffect = { _id: effect._id, changes: effect.changes }
    newEffect.changes.push({ key: LAST_HIT_ROUND_KEY, value: roundNumber, mode: 0, priority: 20 })
    await actor.updateEmbeddedDocuments("ActiveEffect", [newEffect])
  }  
}

async function trackQuarryId(actor, effect, targetActor) {
  let newEffect = { _id: effect._id, changes: effect.changes }
  newEffect.changes.push({ key: MARKED_ID_KEY, value: targetActor.uuid, mode: 0, priority: 20 })
  await actor.updateEmbeddedDocuments("ActiveEffect", [newEffect])
}

// Move 
async function move() {
  const effect = actor.appliedEffects.find(e => e.name === "Marking")
  if (effect) {
    const targetToken = Array.from(workflow.hitTargets)[0]
    const markId = effect.changes.find(c => c.key === MARKED_ID_KEY)?.value
    const markActor = fromUuidSync(markId)
    if (markActor.system.attributes.hp.value !== 0) {
        ui.notifications.warn("Can only move mark when original target has no HP")
        return
    }
    if (markId && markId !== targetToken.actor.uuid) {
      switchQuarryId(actor, effect, targetToken.actor)
    }
  } 
}

async function switchQuarryId(actor, effect, targetActor) {
  let newChanges = structuredClone(effect.changes)
  const i = newChanges.findIndex(c => c.key === MARKED_ID_KEY)
  newChanges[i].value = targetActor.uuid
  await actor.updateEmbeddedDocuments("ActiveEffect", [{ _id: effect._id, changes: newChanges }])
  await effect.delete()
}

export let huntersMark = {
  'item': item,
  'move': move
}