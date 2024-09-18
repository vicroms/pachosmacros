function retaliation(damageDice, damageType, distance, hitActor, hitToken, attackingToken) {
  if (distance && !MidiQOL.findNearby(null, hitToken, distance).includes(attackingToken)) {
    return
  }

  new MidiQOL.DamageOnlyWorkflow(
    hitActor, 
    hitToken,
    damageDice, 
    damageType, 
    [attackingToken], 
    null, 
    {flavor: "Retaliation damage", 
    itemCardId: null})
}

// block is a function with params (hitActor, hitToken, attackingToken)
function retaliationBlock(block, distance, hitActor, hitToken, attackingToken) {
  if (distance && !MidiQOL.findNearby(null, hitToken, distance).includes(attackingToken)) {
    return
  }

  block(hitActor, hitToken, attackingToken)
}

export const onHit = {
  'retaliation': retaliation,
  'retaliationBlock': retaliationBlock
}