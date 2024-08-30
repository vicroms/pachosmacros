async function turnEnd({actor}) {
  const clericLevel = 5 // should replace
  const defaultTempHP = 6
  new Dialog({
    title: "Twilight Domain - Turn End",
    content: "Choose",
    buttons: {
      button1: {
        label: "Temp HP",
        callback: () => {
          actor.update({"system.attributes.hp.temp": clericLevel + defaultTempHP})
        },
        icon: `<i class="fas fa-check"></i>`
      },
      button2: {
        label: "Remove status ailment",
        callback: () => {
          ui.notifications.info("Delete one effect with Charm or Frightened")
        },
        icon: `<i class="fas fa-times"></i>`
      }
    }
  }).render(true)
}

export let twilightSanctuary = {
  'turnEnd': turnEnd,
}