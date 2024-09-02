async function itemFlow({workflow}) {
  if (workflow.diceRoll <= 3) {
    hitSelfAndRecharge(workflow)
  } else {
    displayItemChargeAlert(workflow)
  }  
}

function hitSelfAndRecharge(workflow) {
  workflow.item.update({"system.uses.value": workflow.item.system.uses.value + 1})
  new MidiQOL.DamageOnlyWorkflow(
    workflow.actor, 
    workflow.token,
    "1d6", 
    "fire", 
    [workflow.token], 
    new Roll("1d6[fire]"), 
    {flavor: "Firefeather Backlash", 
    itemCardId: null})
}

function displayItemChargeAlert(workflow) {
  if (workflow.item.system.uses.value < 1) { return } 
  pachos.gmTools.itemUse.onHitUseCharge(workflow, ( () => doBurnSave(workflow) ))
}

async function doBurnSave(workflow) {
  workflow.item.update({"system.uses.value": workflow.item.system.uses.value - 1})
  const target = workflow.targets.first().actor
  const spellcastingABI = workflow.actor.system.abilities[workflow.actor.system.attributes.spellcasting]
  pachos.effects.burning.applyOnSaveFail(`1d6+${spellcastingABI.mod}`, "fire", spellcastingABI.dc, 'con', workflow) 
}

export let firefeather = {
  'itemFlow': itemFlow
}