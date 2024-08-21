// options = dictionary where key is the dropdown text and object is the string address path
async function showImage(options) {
  let optionContent = ''
  for (const key in options) {
    optionContent += `<option value=${options[key]}>${key}</option>`       
  }
  let content = `
      <div class="form-group">
      <select name="image">
          ${optionContent}
      </select>`
  
  new Dialog({
      title: "What will be displayed?",
      content,
      buttons: {
          Ok: {
              label: `Ok`,
              callback: (html) => {
                  let itemId = html.find('[name=image]')[0].value
                  displayImage(itemId) },
          Cancel: {
              label: `Cancel`
          }}}})
      .render(true)
   
  function displayImage(res) {
      const ip = new ImagePopout(res)
      ip.render(true)
      ip.shareImage()
  }
}

export let showContent = {
  'showImage': showImage,
}