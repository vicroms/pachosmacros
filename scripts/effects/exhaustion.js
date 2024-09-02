import {effectFactory, effectHelper, effectTags} from '../config/effects.js'

async function selectExhaustionLevel({actor}) {
  let optionContent = ''
  const options = [0, 1, 2, 3, 4, 5, 6]
  for (const key of options) {
    optionContent += `<option value=${key}>${key}</option>`       
  }
  let content = `
      <div class="form-group">
      <select name="level">
          ${optionContent}
      </select>`
  
  new Dialog({
      title: "On a level of 1 to 6, how tired are you?",
      content,
      buttons: {
          Ok: {
              label: `Ok`,
              callback: (html) => {
                  let exhaustionLevel = html.find('[name=level]')[0].value
                  applyExhaustion(actor, exhaustionLevel) },
          Cancel: {
              label: `Cancel`
          }}}})
      .render(true)
}

async function applyExhaustion(actor, exhaustionLevel) {
  let eLevel = exhaustionLevel
  const exhaustionEffects = effectHelper.filter(actor, effectTags.exhaustion)
  let effect = exhaustionEffects === undefined || exhaustionEffects.length === 0 ? undefined : exhaustionEffects[0]

  if (exhaustionLevel === undefined) {
    if (effect === undefined) {
      eLevel = 1
    } else {
      eLevel = parseInt(effect.flags.dae.stacks) + 1
    }
  }
  else if (eLevel === `${0}` && effect !== undefined) {
    effect.delete()
    return
  }
  if (effect === undefined) {
    await MidiQOL.socket().executeAsGM('createEffects', {actorUuid: actor.uuid, effects: [effectFactory.exhaustion]})
    effect = actor.appliedEffects.find(e => e.name === "Exhaustion")
  }
  await effect.update({
    'name': `Exhaustion - ${eLevel}`,
    'flags.dae.stacks': eLevel
  }) 
}

export let exhaustion = {
  'selectLevel': selectExhaustionLevel,
  'apply': applyExhaustion
}

