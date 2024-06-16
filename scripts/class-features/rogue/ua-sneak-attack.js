const version = "10.0.33"
const CS = {
  NONE: -1,
  DISARM: 0,
  POISON: 1,
  TRIP: 2,
  WITHDRAW: 3
};

async function damageBonus({actor, token, args, workflow}) {
  try {
    if (!["mwak", "rwak"].includes(args[0].itemData.system.actionType)) return {}; // weapon attack
    
    if (args[0].itemData.system.actionType === "mwak" 
        && !rolledItem?.system.properties.has("fin")) {
      return {}; // ranged or finesse
    }
    
    if (args[0].hitTargets.length < 1) return {};
    
    token = canvas.tokens.get(args[0].tokenId);
    actor = token.actor;
    if (!actor || !token || args[0].hitTargets.length < 1) return {};
    
    const rogueLevels = actor.getRollData().classes.rogue?.levels;
    if (!rogueLevels) {
      MidiQOL.warn("Sneak Attack Damage: Trying to do sneak attack and not a rogue");
      return {}; // rogue only
    }
    
    let target = canvas.tokens.get(args[0].hitTargets[0].id ?? args[0].hitTargers[0]._id);
    if (!target) MidiQOL.error("Sneak attack macro failed");
  
    if (game.combat) {
      const combatTime = `${game.combat.id}-${game.combat.round + game.combat.turn / 100}`;
      const lastTime = actor.getFlag("midi-qol", "sneakAttackTime");
      if (combatTime === lastTime) {
        MidiQOL.warn("Sneak Attack Damage: Already done a sneak attack this turn");
        return {};
      }
    }
    let foundEnemy = true;
    let isSneak = args[0].advantage;
  
    if (!isSneak) {
      foundEnemy = false;
      let nearbyEnemy = canvas.tokens.placeables.filter(t => {
        let nearby = (t.actor &&
          t.actor?.id !== args[0].actor._id && // not me
          t.id !== target.id && // not the target
          t.actor?.system.attributes?.hp?.value > 0 && // not incapacitated
          t.document.disposition !== target.document.disposition && // not an ally
          MidiQOL.getDistance(t, target, false) <= 5 // close to the target
        );
        foundEnemy = foundEnemy || (nearby && t.document.disposition === -target.document.disposition)
        return nearby;
      });
      isSneak = nearbyEnemy.length > 0;
    }
    
    if (!isSneak) {
      MidiQOL.warn("Sneak Attack Damage: No advantage/ally next to target");
      return {};
    }
    
    let autoSneak= getProperty(actor, "flags.dae.autoSneak");
    let useSneak = await showCunningStrikeDialog(autoSneak, rogueLevels);
    if (!useSneak) return {}
    
    let baseDice = Math.ceil(rogueLevels / 2);
    if (game.combat) {
      const combatTime = `${game.combat.id}-${game.combat.round + game.combat.turn / 100}`;
      const lastTime = actor.getFlag("midi-qol", "sneakAttackTime");
      if (combatTime !== lastTime) {
        await actor.setFlag("midi-qol", "sneakAttackTime", combatTime)
      }
    }
   
    if (useSneak && useSneak.effect!== CS.NONE){
      const itemName= getItemName(useSneak.effect);
      let i= workflow.actor.items.getName(itemName);
      if (!i){
          ui.notifications.error(`Sneak Attack | ${itemName} not found`);
      }
      else {
        if (useSneak.effect=== CS.POISON && !workflow.actor.items.getName("Poisoner's Kit")){
          ui.notifications.error(`Sneak Attack | No Kit Found`);
          useSneak.cost= 0;
          }  
        else {
          await MidiQOL.completeItemUse(i, {}, {targetUuids: args[0].hitTargets.map(t => t.uuid)});
        }
      }
    } 
    const cost = useSneak? useSneak.cost : 0;
    const damageFormula = new CONFIG.Dice.DamageRoll(`${baseDice - cost}d6`, {}, {
      critical: args[0].isCritical ?? false,
      powerfulCritical: game.settings.get("dnd5e", "criticalDamageMaxDice"),
      multiplyNumeric: game.settings.get("dnd5e", "criticalDamageModifiers")
    }).formula
    // How to check that we've already done one this turn?
    return { damageRoll: damageFormula, flavor: "Sneak Attack" };
  } catch (err) {
    console.error(`${args[0].itemData.name} - Sneak Attack ${version}`, err);
  }
}

/* If a Cunning Strike effect requires a saving throw, the DC equals 8 + your Proficiency Bonus + your Dexterity modifier.
 * 
 * Disarm (Cost: 1d6). The target must succeedon a Dexterity saving throw, or it drops one item of your choice that it’s holding.
 *
 * Poison (Cost: 1d6). You add a toxin to your strike, forcing the target to make a Constitution saving throw. On a failed save, 
 * the target has the Poisoned condition for 1 minute. At the end of each of its turns, the Poisoned target can repeat the save, 
 * ending the effect on itself on a success. To use this effect, you must have a Poisoner’s Kit on your person.
 * 
 * Trip (Cost: 1d6). If the target is Large or smaller, it must succeed on a Dexterity saving throw or have the Prone condition.
 *  
 * Withdraw (Cost: 1d6). Immediately after the attack, you move up to half your Speed.
 */
async function showCunningStrikeDialog(autoSneak, rogueLevels) {    
    if (rogueLevels < 5) {
        // TODO: show dialog to select weather to apply sneak attack
        return { effect: CS.NONE, cost: 0};    
    }

    let effectDialog = new Promise((resolve, reject) => {
      new Dialog({
        // localize this text
        title: "Conditional Damage",
        content: `<p>Use Cunning Strike effect?</p>`,
        buttons: {
          noextraeffect: {
            icon: '<img src="homebrew/icons/bg3/skills_png/actions/Action_SneakAttack_Melee.webp"></img>',
            label: "No Effect",
            callback: () => { resolve({ effect: CS.NONE, cost: 0 }) }
          },
          disarm: {
            //icon: '<i class="fas fa-check"></i>',
            icon: '<img src="homebrew/icons/bg3/skills_png/actions/Action_DisarmingAttack_Melee.webp"></img>',
            label: "Disarm",
            callback: () => { resolve({ effect: CS.DISARM, cost: 1 }) }
          },
          poison: {
            icon: '<img src="homebrew/icons/bg3/skills_png/actions/Action_MagicItem_PoisonLethality.webp"></img>',
            label: "Poison",
            callback: () => { resolve({ effect: CS.POISON, cost: 1 }) }
          },
          trip: {
            icon: '<img src="homebrew/icons/bg3/skills_png/actions/Action_Trip.webp"></img>',
            label: "Trip",
            callback: () => { resolve({ effect: CS.TRIP, cost: 1 }) }
          },
          withdraw: {
            icon: '<img src="homebrew/icons/bg3/skills_png/actions/Action_SupremeSneak.webp"></img>',
            label: "Withdraw",
            callback: () => { resolve({ effect: CS.WITHDRAW, cost: 1 }) }
          },
          none: {
            icon: '<i class="fas fa-times"></i>',
            label: "None",
            callback: () => { resolve(false) }
          }

        },
        default: "noextraeffect"
      }).render(true);
    });
    return await effectDialog;
}

function getItemName(effectName){
  switch(effectName){
      case CS.NONE:
      return "";
      case CS.TRIP:
      return "Cunning Strike - Trip";
      case CS.POISON:
      return "Cunning Strike - Poison";
      case CS.WITHDRAW:
      return "Cunning Strike - Withdraw";
      case CS.DISARM:
      return "Cunning Strike - Disarm";
  }
  return "";
}

export let sneakAttack = {
  'damageBonus': damageBonus,
}