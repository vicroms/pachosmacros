const OWNERSHIP = {
  NONE: 0,
  LIMITED: 1,
  OBSERVER: 2,
  OWNER: 3
};

export async function setupLink() {
  let companions = game.folders.getName("ActiveCompanions").contents.map(x => game.actors.getName(x.name));
  const users = game.users.filter(u => !u.isGM).map(u => { return { id: u.id, name: u.name, character: u.character }; });
  displayAssignmentDialog(users, companions)
}

async function displayAssignmentDialog(users, companions) {
  const companion_options = companions.map(a => { return `<option value="${a.uuid}">${a.name}</option>`; }).join('\r\n');
  const player_rows = users
    .map(u => { return `
      <tr>
      <td><label>${u.name}</label></td>
      <td>
        <select id="select-${u.id}">
          <option value="0">No changes</option/>
            ${companion_options}
          </select>
        </td>
      </tr>`
    }).join('\r\n');

  const FORM_CONTENT = `
  <form>
    <table>
      <thead>
        <tr>
          <td>Player</td>
          <td>Companion</td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><label>Default</label></td>
          <td>
            <select id="select-default">
              <option value="NONE">None</option>
              <option value="LIMITED">Limited</option>
              <option value="OBSERVER">Observer</option>
            </select>
          </td>
        </tr> 
        ${player_rows}
      </tbody>
    </table>
  </form>
  `;

  new foundry.applications.api.DialogV2({
    window: { title: 'Select companions' },
    content: FORM_CONTENT,
    buttons: [{
      action: "ok",
      label: "OK",
      default: true,
      callback: (event, button, dialog) => {
        let html = button.form.elements
        setCompanions(html, users, companions)
      }
    }],
  }).render({ force: true });
}

async function setCompanions(html, users, companions) {
  
  const defaultOwnership = html['select-default'].value

  for (const u of users) {
    const INPUT_ID = `select-${u.id}`;
    const companionId = html[INPUT_ID].value

    if (companionId !== '0') {
      let companionActor = companions.find(c => c.uuid === companionId);
      await setOwner(companionActor, u.id, OWNERSHIP[defaultOwnership]);
      await setCaregiverId(companionActor, users.find(x => x.id === u.id)?.character);
    }
  }
}

async function setOwner(companionActor, userId, defaultOwnership) {
  if (!companionActor) return;

  let owners = {};
  owners['default'] = defaultOwnership;
  owners[userId] = OWNERSHIP.OWNER;
  await companionActor.update({ 'ownership': owners });
}

async function setCaregiverId(companionActor, caregiverActor) {
  if (!caregiverActor) return;

  if (!companionActor.items.find(i => i.name === 'Companion')) return;

  const COMPANION_EFFECT_DATA = {
    name: 'Companion',
    origin: caregiverActor.uuid,
    img: 'icons/magic/nature/cornucopia-orange.webp',
    changes: [
      {
        key: 'CaregiverId',
        value: caregiverActor.uuid,
        mode: 0,
        priority: 20
      }
    ]
  };

  const CAREGIVER_EFFECT_DATA = {
    name: 'Caregiver',
    origin: companionActor.uuid,
    img: 'icons/magic/symbols/star-solid-gold.webp',
    changes: [
      {
        key: 'macro.execute',
        value: `function.pachos.mechanics.companion.addFerocity ${companionActor.uuid}`,
        mode: 0,
        priority: 20
      }
    ],
    flags: {
      dae: {
        macroRepeat: 'startEveryTurn'
      }
    }
  };

  await setClearEffect(companionActor, COMPANION_EFFECT_DATA);
  await setClearEffect(caregiverActor, CAREGIVER_EFFECT_DATA);
}

async function setClearEffect(actor, EFFECT_DATA) {
  if (!actor) return;

  let effect = actor.appliedEffects.find(e => e.name === EFFECT_DATA.name);
  if (effect) {
    await MidiQOL.socket().executeAsGM('removeEffects', {
      actorUuid: actor.uuid,
      effects: [effect.id]
    })
  }

  await MidiQOL.socket().executeAsGM('createEffects', {
    actorUuid: actor.uuid,
    effects: [EFFECT_DATA]
  });
}
