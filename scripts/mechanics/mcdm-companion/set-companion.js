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
  const player_rows = users.map(u => {
      return `
  <tr>
    <td><label>${u.name}</label></td>
    <td>
      <select id="select-${u.id}" style="width: 100%">
        <option value="0">No changes</option/>
        ${companion_options}
      </select>
    </td>
  </tr>
  `
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
            <select id="select-default" style="width: 100%">
              <option value="NONE">None</option>
              <option value="LIMITED">Limited</option>
              <option value="OBSERVER">Observer</option>"Compa
        </tr> 
        ${player_rows}
      </tbody>
    </table>
  </form>
  `;
  
  new Dialog({
    title: 'Select companions',
    content: FORM_CONTENT,
    buttons: {
      ok: { 
        label: 'OK',
        callback: (html) => setCompanions(html, users, companions)
      },
      cancel: { 
        label: 'Cancel'
      }
    }
  }).render(true);
}

async function setCompanions(html, users, companions) {
  const defaultOwnership = html.find('select#select-default').val();
    
  for (const u of users) {
    const INPUT_ID = `select#select-${u.id}`;
    const companionId = html.find(`${INPUT_ID}`).val();
    const companionName = html.find(`${INPUT_ID} option:selected`).text();
    console.log(`${u.name} selected ${companionName} with ID ${companionId}`);
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
  owners ['default'] = defaultOwnership;
  owners [userId] = OWNERSHIP.OWNER;
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
        value: `FerocityGM ${companionActor.uuid}`,
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
      effects: [ effect.id ]
    })
  }
  
  await MidiQOL.socket().executeAsGM('createEffects', {
     actorUuid: actor.uuid,
     effects: [ EFFECT_DATA ]
  });   
}
