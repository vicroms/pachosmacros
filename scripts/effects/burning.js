import { effectTags, effectHelper, effectFactory } from "../config/effects.js"

async function applyOnSaveFail(damageExpression, damageType, dc, abi, workflow) {
  const sourceItem = workflow.item
  let theActor = workflow.actor
  
  const itemData = mergeObject(duplicate(sourceItem), {
    type: "weapon",
    effects: [],
    flags: {
      "midi-qol": {
        noProvokeReaction: true, 
        onUseMacroName: null 
      },
    },
    system: {
      actionType: "save",
      save: { dc: dc, ability: abi, scaling: "flat" },
      damage: { parts: [], versatile: '' },
      components: { concentration: false, material: false, ritual: false, somatic: false, value: "", vocal: false },
      duration: { units: "inst", value: undefined },
      weaponType: "improv"
    }
  }, { overwrite: true, inlace: true, insertKeys: true, insertValues: true });
  const item = new CONFIG.Item.documentClass(itemData, { parent: theActor })
  const targets = workflow.diceRoll === 1 ? [workflow.token.uuid] : Array.from(workflow.hitTargets.map(t => t.document.uuid))
  const options = { showFullCard: false, createWorkflow: true, versatile: false, configureDialog: false, targetUuids: targets}
  let workflow2 = await MidiQOL.completeItemUse(item, {}, options);

  if (workflow2.saves.first() !== undefined) { return }
  for (let t of workflow2.saves) {
    applyEffect(damageExpression, damageType, workflow.item, t.actor)  
  } 
}

async function applyEffect(damageExpression, damageType, item, actor) {
  const itemUuid = item.uuid
  const burningEffects = effectHelper.filter(actor, effectTags.burning)
  if (burningEffects.find(e => e.origin === itemUuid)) { return }
  const effect = effectFactory.burning(damageExpression, damageType, itemUuid, item.name)
  await MidiQOL.socket().executeAsGM('createEffects', { actorUuid: actor.uuid, effects: [effect] })
}

async function endEffect({ actor }) {
  const burningEffects = effectHelper.filter(actor, effectTags.burning)
  if (burningEffects === undefined || burningEffects.length === 0) { return }
  for (let e of burningEffects) {
    await e.delete()
  }
}

async function load({args}) {
  if (args[0] !== 'on') { return }
  const lastArgs = args[args.length-1]
  let effectData = effectFactory.burning(args[1], args[2], lastArgs.origin, "Some Item")
  effectData._id = lastArgs.effectId
  await MidiQOL.socket().executeAsGM('updateEffects', {'actorUuid': lastArgs.actorUuid, 'updates': [effectData]})
}

export const burning = {
  'apply': applyEffect,
  'applyOnSaveFail': applyOnSaveFail,
  'end': endEffect,
  'load': load
}