async function willAttack({actor, workflow}) {
  const origins = allOriginsWithCompelledDuel(actor)
  let targets = Array.from(workflow.targets)

  if (!origins.includes(targets[0].actor.uuid)) {
    workflow.disadvantage = true
  }
}

function allOriginsWithCompelledDuel(actor) {
  const effectNames = [ "Compelled Duel", "Grappled"]
  return actor.appliedEffects
    .filter( e => effectNames.find( en => e.name.includes(en) ) !== undefined )
    .map(e => e.origin)
}

export let compelledDuel = {
  'willAttack': willAttack,
}
