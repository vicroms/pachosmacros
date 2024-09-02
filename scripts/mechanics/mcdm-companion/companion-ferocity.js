export async function addFerocity({ args }) {
    let companionActor = fromUuidSync(args[1])
    let companionToken = canvas.scene.tokens.find(t => t.name === companionActor.name)
    if (args[0] !== 'each' || game.combat?.round === 0 || !companionActor || !companionToken) { return }
    const creatures = MidiQOL.findNearby(CONST.TOKEN_DISPOSITIONS.HOSTILE, companionToken.uuid, 5)
    const conditions = ['Dead', 'Incapacitated', 'Paralysed', 'Paralyzed', 'Petrified', 'Stunned', 'Unconscious'];
    for (let condition of conditions) {
        if (creatures.length === 0 ||
            creatures
                .filter(t => t.actor.effects
                    .filter(i => i.disabled === false)
                    .find(z => z.label === condition))
                .length === creatures.length) {
        }
    }
    let templateHtml = `<div class="dnd5e chat-card item-card midi-qol-item-card" > 
 <header class="card-header flexrow">
   <img src="icons/magic/fire/flame-burning-eye.webp" title="Ferocity"+roll width="36" height="36">
   <h3 class="item-name">Ferocity (COMPANION_NAME)</h3>
 </header>
</div>`
    let html = templateHtml.replace("COMPANION_NAME", companionToken.name)
    const fero = await new Roll("1d4+" + creatures.length).toMessage({
        rollMode: CONST.DICE_ROLL_MODES.PUBLIC,
        flavor: html,
        speaker: ChatMessage.getSpeaker({ actor: companionActor }),
        user: game.user
    });
    const current = Math.max(companionActor.system.resources.legact.value, 0);
    const increased = Math.max(current + parseInt(fero.content), 0);
    await companionActor.update({ "system.resources.legact.value": increased });
    let ferocity = companionActor.system.resources.legact.value;
    if (ferocity > 9) {
        let result = await game.MonksTokenBar.requestRoll(
            [{ "token": token }],
            {
                request: 'skill:ani',
                dc: ferocity + 5,
                silent: true,
                fastForward: false,
                rollMode: 'publicroll',
                showdc: true,
                flavor: 'Stop the rampage!',
                callback: async (args) => {
                    if (args.failed) {
                        game.dfreds.effectInterface.toggleEffect('Rampaging', { uuids: [companionActor.uuid] });
                    }
                }
            });
    }
}
