async function onHitChargeUseAlert(workflow, onYes) {
  const item = workflow.item
  let uses = item.system.uses.value
  if (uses <= 0) { return {} }

  let promise = new Promise((resolve) => {
    Dialog.confirm({
      title: workflow.item.name,
      content: "Use charge?",
      defaultYes: false
    })
      .then(res => resolve(res))
  })

  let shouldRunBlock = await promise
  if (shouldRunBlock) { 
    onYes() 
  } 
}

export let itemUse = {
  'onHitUseCharge': onHitChargeUseAlert
}