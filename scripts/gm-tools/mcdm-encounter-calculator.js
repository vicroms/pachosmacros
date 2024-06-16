// Implements a encounter CR calculator using ther rules found in MCDM's Flee Mortals!
// To use you need to select the player's character tokens and companions participating
// in the encounter.

const CR_TABLE =
{
  "easy": [0.125, 0.125, 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5],
  "standard": [0.125, 0.25, 0.5, 0.75, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9],
  "hard": [0.25, 0.5, 0.75, 1, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10],
  "cap": [1, 3, 4, 6, 8, 9, 10, 12, 13, 15, 16, 17, 19, 20, 22, 24, 25, 26, 28, 30]
};

const CR = {
  EASY: "easy",
  STANDARD: "standard",
  HARD: "hard",
  CAP: "cap"
};

function get_solo_cr_cap(no_of_chars, avg_party_level, difficulty) {
  let cr_cap = CR_TABLE[CR.CAP][avg_party_level - 1];

  switch (difficulty) {
    case CR.EASY:
      cr_cap -= 4;
      break;
    case CR.STANDARD:
      cr_cap -= 2;
      break;
  }

  if (no_of_chars < 6) {
    cr_cap -= 1;
  }

  if (no_of_chars < 4) {
    cr_cap -= 1;
  }

  if (no_of_chars < 2) {
    cr_cap -= 2;
  }

  return Math.max(cr_cap, 1);
}

function get_cr_budget(no_of_chars, avg_party_level, difficulty) {
  if (avg_party_level < 1 || avg_party_level > 20) {
    ui.notifications.error(`Party level outside range (1-20): ${avg_party_level}.`);
    return;
  }

  const cr_per_char = CR_TABLE[difficulty][avg_party_level - 1];
  return {
    average: avg_party_level,
    budget: no_of_chars * cr_per_char,
    cr_cap: get_solo_cr_cap(no_of_chars, avg_party_level, difficulty)
  };
}

function get_cr_budget_for_selected(actors, difficulty) {
  let party_levels = actors.filter(a => a.type === 'character' && a.hasPlayerOwner).map(a => a.system.details.level);

  const companions = actors.filter(a => a.type === 'npc' && a.items.getName('Companion'));
  if (companions.length > 0) {
    party_levels = party_levels.concat(companions.map(a => Math.max(1, a.system.details.cr - 2)));
  }

  console.log(`MCDM_CR_Calculator | Party levels: ${party_levels.join(',')}`)
  const accumulated_levels = party_levels.reduce((a, b) => a + b);
  const total_party_size = party_levels.length;
  const avg_party_level = Math.ceil(accumulated_levels / total_party_size);
  return get_cr_budget(total_party_size, avg_party_level, difficulty);
}

async function showDialog() {
  let difficultyDialog = new Promise((resolve, reject) => {
    new Dialog({
      title: "Encounter Difficulty",
      content: `<p>Select encounter difficulty!</p>`,
      buttons: {
        easy: {
          icon: '<img src="homebrew/icons/bg3/skills_png/actions/Action_DisarmingAttack_Melee.webp"></img>',
          label: "Easy",
          callback: () => { resolve({ value: CR.EASY }) }
        },
        standard: {
          icon: '<img src="homebrew/icons/bg3/skills_png/actions/Action_MagicItem_PoisonLethality.webp"></img>',
          label: "Standard",
          callback: () => { resolve({ value: CR.STANDARD }) }
        },
        hard: {
          icon: '<img src="homebrew/icons/bg3/skills_png/actions/Action_Trip.webp"></img>',
          label: "Hard",
          callback: () => { resolve({ value: CR.HARD }) }
        }
      },
      default: "standard"
    }).render(true);
  });
  return await difficultyDialog;
}

const selected = game.canvas.tokens.controlled.map(t => t.actor);
const difficulty = await showDialog();
const encounter = get_cr_budget_for_selected(selected, difficulty.value);


const message = `
<h2>Encounter difficulty: ${difficulty.value}</h2><br/>
<b>Party Lvl:</b> ${encounter.average}<br/>
<b>Budget:</b> ${encounter.budget}<br/>
<b>CR cap:</b> ${encounter.cr_cap}<br/>
`;

// Setting 'GM' as the recipient whispers the message to all GM/DM users.
ChatMessage.create({
  user: game.user._id,
  content: message,
  whisper: ChatMessage.getWhisperRecipients('GM')
});
