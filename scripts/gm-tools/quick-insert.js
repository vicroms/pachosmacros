async function qiDisplayImage() {
  QuickInsert.open({ 
    mode: 1,
    onSubmit: (item) => { 
      displayImage(item)
    } 
  })
}

async function qiPrint() {
  QuickInsert.open({ 
    mode: 1,
    restrictTypes: ["Item"],
    onSubmit: chatPrint 
  })
}

function displayImage(item) {
  const ip = new ImagePopout(item.img)
  ip.render(true)
  ip.shareImage() 
}

function chatPrint(item) {
  const i = fromUuidSync(item.uuid)
  const chatContent = `<b>${item.name}</b>\n${i.system.description.value}`
  ChatMessage.create({content: chatContent})
}

export const quickInsert = {
  'displayImage': qiDisplayImage,
  'print': qiPrint
}