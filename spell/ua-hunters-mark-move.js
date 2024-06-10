/* 
Using rules from One DnD
The cantrip related to this item is added as a dependent of the "marking" effect. macro.createItem
Call this item macro using midi-hooks. A visual indicator for the quarry is recommended
*/

const MARKED_ID_KEY = "markedId"
const LAST_HIT_ROUND_KEY = "lastHitRound"

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
      trackQuarryId(effect, targetToken.actor)
  }
} 

async function trackQuarryId(effect, targetActor) {
  let newChanges = structuredClone(effect.changes)
  const i = newChanges.findIndex(c => c.key === MARKED_ID_KEY)
  newChanges[i].value = targetActor.uuid
  await actor.updateEmbeddedDocuments("ActiveEffect", [{ _id: effect._id, changes: newChanges }])
}