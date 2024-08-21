async function didCastSpell({item, actor, token}) {
  const dc = 10 + (item.system.level * 2)
  let promise = new Promise((resolve, reject) => {
    game.MonksTokenBar.requestRoll([{token: token.name}],{
      request: [{"type": "save", "key": "con", "count":1}], 
      dc: dc, 
      silent: true, 
      fastForward: false, 
      flavor: "Runeblood backlash",
      rollMode: 'roll',
      callback: async(args) => {
        if (args.failed) {
          applyExhaustion(actor.uuid)
          if ((await new Roll('1d4').evaluate()).total === 1) {
            ChatMessage.create({
              content: `Remember to add another exhaustion to ${actor.name} later!!`,
              user: game.users.activeGM,
              whisper : game.users.filter(u => u.isGM).map(u => u._id) 
            })
          }
        }
        resolve(true)
      }
    })
  })
  const results = await promise
}

async function applyExhaustion(uuid) {
  await game.dfreds.effectInterface.addEffect({effectName: 'Exhaustion', uuid: uuid})
}

export let runebloodSpell = {
  'didCastSpell': didCastSpell,
}