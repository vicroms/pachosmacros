async function influence({args}) {
  if (args[0] !== 'each') { return }
  const lastArgs = args[args.length-1]
  const token = lastArgs.token
  const baseDC = 13
  const minDamageDice = 2
  const options = [2, 3, 4, 5, 6]
  function didChangeDropdown(value) {
    console.log(value)
  }

  let optionContent = ""
  for (const key of options) {
    optionContent += `<option value=${key}>${`${key}d6, DC ${baseDC + ((key - minDamageDice) * 2)}`}</option>`       
  }

  let content = `
    <label>Choose a number of damage dice, determining the DC of the performance check</label>
    <div style="display:flex; flex-direction: row; justify-content: center; align-items: center" width=150>
    <select name="numberOfDice">
      ${optionContent}
    </select>
    </div>`

    let dialog = new foundry.applications.api.DialogV2({
      window: { title: "Rock the audience" },
      content: content,
      buttons: [{
        action: "ok",
        label: "Start Performance",
        default: true,
        callback: (event, button, dialog) => {
          doPerformance(token, baseDC + ((button.form.elements['numberOfDice'].value - minDamageDice) * 2)) 
        } 
      }],
    })
    dialog.render({ force: true })
}

async function doPerformance(token, dc) {
  await game.MonksTokenBar.requestRoll(
    [{ "token": token }],
    {
        request: 'skill:prf',
        dc: dc,
        silent: true,
        fastForward: false,
        rollMode: 'publicroll',
        showdc: true,
        flavor: 'Rock the audience!',
    })
}

export const battleOfTheBands = {
  'influence': influence
}