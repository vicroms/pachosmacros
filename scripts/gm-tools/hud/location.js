async function setContent() {
  if (game.canvas.tokens.controlled.length === 1) { await displayLocationAlert() }
}

async function displayLocationAlert() {
  const rootToken = game.canvas.tokens.controlled[0]
  const attached = tokenAttacher.getAllAttachedElementsOfToken( rootToken, "Token")
  const titleDrawing = game.canvas.drawings.get(attached.Drawing[0])
  const locationTile = game.canvas.tiles.get(getLocationTile(attached.Tile))
  const borderTile = game.canvas.tiles.get(attached.Tile[0])

  const locale = {
    rootToken: rootToken,
    titleDrawing: titleDrawing,
    locationTile: locationTile,
    borderTile: borderTile
  }
  
  await tokenAttacher.detachElementFromToken(locationTile, rootToken, true)
  
  const myContent = `
  <div>
    <a><label for="nameId">Name:</label></a>
    <a><input id="nameId" type="text" value="${titleDrawing.document.text}" /></a>
  </div>
  <div>
    <label for="imageId">Image:</label>
    <input id="imageId" type="text" value="${locationTile.document.texture.src}" />
  </div>
  `
await new Dialog({
title: "Update location",
content: myContent,
buttons: {
  button1: {
    label: "Find",
    callback: (html) => updateTile2(html, locale),
    icon: `<i class="fa fa-folder"></i>`  
  }

}
}).render(true)
}

async function updateTile2(html, locale) {
    const newName = html.find("input#nameId").val()
    let imageAddress = locale.locationTile.document.texture.src
    let picker = new FilePicker({
        request: imageAddress,
        displayMode: "tiles"
    })
    picker.callback = displayImage
    picker.browse(imageAddress)
    function displayImage(res) {
      submit(newName, res, locale)
    }
}

async function submit(newName, newImage, locale) {
  locale.titleDrawing.document.update({"text": newName})
  await locale.locationTile.document.update({"texture.src": newImage })
  setTimeout(resize, 1000, locale)
}

async function resize(locale) {
  const width = locale.locationTile.document.height * (locale.locationTile.sourceElement.width / locale.locationTile.sourceElement.height)
  const centerSpacing = (locale.borderTile.document.width / 2) - (width / 2)
  await locale.locationTile.document.update({ width: width, "x": locale.borderTile.x + centerSpacing })
  tokenAttacher.attachElementToToken(locale.locationTile, locale.rootToken, true)
}

function getLocationTile(tileIds) {
    const townAddress = "worlds/argonemis/assets/images/towns"
    return tileIds.find(id => game.canvas.tiles.get(id).document.texture.src.startsWith(townAddress))
}

export const hudLocation = {
  'setContent': setContent
}