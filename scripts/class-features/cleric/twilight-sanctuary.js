async function turnEnd({token, actor, args}) {
  if (['on', 'off'].includes(args[0])) { return }
  new Dialog({
    title: "Twilight Domain - Turn End",
    content: "Choose",
    buttons: {
      button1: {
        label: "Temp HP",
        callback: () => {
          addTempHP(actor)
        },
        icon: `<i class="fas fa-check"></i>`
      },
      button2: {
        label: "Remove status ailment",
        callback: () => {
          ui.notifications.info("Delete one effect with Charm or Frightened")
          clearEffect(token)
        },
        icon: `<i class="fas fa-times"></i>`
      }
    }
  }).render(true)
}

async function addTempHP(actor) {
  const clericLevel = 5 // should replace
  const defaultTempHP = (await new Roll('1d6').roll()).total
  const newTempHP = clericLevel + defaultTempHP
  if (newTempHP > actor.system.attributes.hp.temp) {
    await actor.update({"system.attributes.hp.temp": clericLevel + defaultTempHP})
  }
}

function clearEffect(token) {
  const tokenActor = token?.actor ?? game.user.character
  const effects = tokenActor.appliedEffects.filter(i => i.isTemporary && (i.name.includes("Charmed") || i.name.includes("Frightened")) ).reduce((acc, e) => acc += `
    <div class="form-group">
      <label for="${e.id}">${e.label}</label>
      <div class="form-fields"><input type="checkbox" id="${e.id}" /></div>
    </div><hr>`, ``)
  const content = `<form>${effects}</form>`
  const title = "Delete effects"
  const buttons = {del: {
    icon: `<i class="fas fa-check"></i>`,
    label: "Delete!",
    callback: async (html) => {
      const selected = html[0].querySelectorAll("input[type=checkbox]:checked")
      const deleteIds = []
      for(let s of selected) deleteIds.push(s.id)
      await tokenActor.deleteEmbeddedDocuments("ActiveEffect", deleteIds)
    }
  }}
  new Dialog({content, title, buttons, default: "del"}).render(true) 
}

export let twilightSanctuary = {
  'turnEnd': turnEnd,
}