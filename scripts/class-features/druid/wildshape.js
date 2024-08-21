const cacheEffectLabel = 'Wildshape - Cache'
const abiEffectLabel = 'Wildshape - Changes'
const tokenImageKey = 'originalTokenImage'
const tokenSizeKey = 'originalTokenSize'
const effectImage = 'icons/creatures/mammals/elk-moose-marked-green.webp'

async function transform({actor}) {
  if (actor.appliedEffects.find(e => e.name === cacheEffectLabel) !== undefined) {
    ui.notifications.warn("Already transformed")
    return
  }
  const templateActor = fromUuidSync('Actor.fge99cbFPFyGuNcv')
  setTempHP(actor)
  addChangesEffect(actor, templateActor)
  changeShape(actor, templateActor)
}

async function revert({actor}) {
  const cacheEffect = actor.appliedEffects.find(e => e.name === cacheEffectLabel)
  const abiEffect = actor.appliedEffects.find(e => e.name === abiEffectLabel)

  if (cacheEffect === undefined || abiEffect === undefined) {
    ui.notifications.warn("Can only revert when wildshaped")
    return
  }

  const originalSize = cacheEffect.changes.find(c => c.key === tokenSizeKey).value
  const originalImage = cacheEffect.changes.find(c => c.key === tokenImageKey).value

  updateToken(actor, originalSize, originalImage)

  await cacheEffect.delete()
  await abiEffect.delete()
}

async function setTempHP(actor) {
  const defaultTempHP = actor.classes.druid.system.levels * 5
  await actor.update({'system.attributes.hp.temp': defaultTempHP})
}

async function changeShape(actor, templateActor) {
  saveCache(actor)
  updateToken(actor, templateActor.system.traits.size, templateActor.prototypeToken.texture.src)
  // TODO: pass attacks from template to actor
}

async function addChangesEffect(actor, templateActor) {
  let effectData = {
    "changes": [],
    "disabled": false,
    "duration": {
        "turns": 100
    },
    "icon": effectImage,
    "name": abiEffectLabel,
    "tint": "",
    "transfer": false
  }
  
  effectData.changes = abiChanges(actor, templateActor).concat(templateItemChanges(templateActor))

  await actor.createEmbeddedDocuments("ActiveEffect", [effectData])

  setTimeout(function() { addFavorites(actor, templateActor.items.map(i => i.name)) }, 2000) 
}

function abiChanges(actor, templateActor) {
  const overrideAbis = [ 'str', 'dex', 'con' ]
  let changes = []
  for (let abi of overrideAbis) {
    const templateABI = templateActor['system']['abilities'][abi]['value']
    const actorABI = actor['system']['abilities'][abi]['value']
    if (templateABI <= actorABI) { 
      continue
    }
    const change = {
      "key": `system.abilities.${abi}.value`,
      "mode": 2,
      "value": `${templateABI - actorABI}`,
      "priority": "20"
    }
    changes.push(change)
  }
  return changes
}

function templateItemChanges(templateActor) {
  return templateActor.items.map(i => {
    return {
    "key": `macro.createItem`,
    "mode": 0,
    "value": `${i.uuid}`,
    "priority": "20"
  }}) 
}

async function addFavorites(actor, itemNames) {
  for (const name of itemNames) {
    const identifier = actor.items.find(i => i.name === name).id
    await actor.system.addFavorite({type: "item", id: `.Item.${identifier}`})
  }
}


async function saveCache(actor) {
  let effectData = {
    "changes": [
    {
      "key": tokenImageKey,
      "mode": 0,
      "value": `${actor.prototypeToken.texture.src}`,
      "priority": "20" 
    }, {
      "key": tokenSizeKey,
      "mode": 0,
      "value": `${actor.system.traits.size}`,
      "priority": "20" 
    }],
    "disabled": false,
    "duration": {
        "turns": 100
    },
    "icon": effectImage,
    "name": cacheEffectLabel,
    "transfer": false
  }
  await actor.createEmbeddedDocuments("ActiveEffect", [effectData])

}

async function updateToken(actor, newSize, newImage) {
  await actor.update({
    'system.traits.size': newSize
  })

  await actor.prototypeToken.update({
    'texture.src': newImage
  })

  const tokens = game.canvas.scene.tokens.filter(t => t.actor.uuid === actor.uuid)
  const newDimension = newSize === 'lg' ? 2 : 1
  for (let token of tokens) {
    await token.update({
      'texture.src': newImage,
      'width': newDimension,
      'height': newDimension,
    })
  }
}

export let wildshape = {
  'transform': transform,
  'revert': revert
}