import { effectFactory } from "../config/effects.js"

async function start({token, actor, workflow}) {
  const targets = Array.from(workflow.targets)
  if (targets.length != 1) { return }
  const isActorMonk = actor.classes.monk ? true : false
  const dc = isActorMonk ? actor.system.abilities.dex.dc : actor.system.abilities.str.dc
  grappleRoll(targets[0].name, dc, didFinishGrappleRoll)

  async function didFinishGrappleRoll(res) {
    if (res.passed.id !== targets[0].id) {
      await MidiQOL.socket().executeAsGM('createEffects', {actorUuid: targets[0].actor.uuid, effects: [effectFactory.grapple(dc, actor.uuid)]})
    }
  }
}

async function breakFree({token, actor, workflow}) {
  const breakDCKey = 'breakDC'
  console.log(workflow)
  const grappleEffect = actor.appliedEffects.find( e => e.name.includes("Grapple") && e.changes.find( c => c.key === breakDCKey ) )
  if (!grappleEffect) { return }
  const dc = grappleEffect.changes.find( c => c.key === breakDCKey).value
  grappleRoll(token.name, dc, didFinishGrappleRoll)
  
  function didFinishGrappleRoll(res) {
    if (res.passed.id === token.id) {
      grappleEffect.delete()
    }
  }
}

async function grappleRoll(tokenName, dc, callback) {
  game.MonksTokenBar.requestRoll(
    [{"token":tokenName}],
    {
      request:[
        {"type":"skill","key":"acr","count":1},
        {"type":"skill","key":"ath"}
      ], 
      dc: dc, 
      silent: true, 
      fastForward: false, 
      flavor: 'grappleRoll',
      rollMode: 'roll',
      callback: callback
    })
}

export const grapple = {
  'start': start,
  'breakFree': breakFree
}