const exhaustionEffect = {
  "changes": [
      {
          "key": "system.bonuses.All-Attacks",
          "mode": 2,
          "value": "-@stackCount*2",
          "priority": 20
      },
      {
          "key": "system.attributes.exhaustion",
          "mode": 5,
          "value": "@stackCount",
          "priority": 20
      },
      {
          "key": "system.bonuses.abilities.check",
          "mode": 2,
          "value": "-@stackCount*2",
          "priority": 20
      },
      {
          "key": "system.attributes.movement.all",
          "mode": 0,
          "value": "-5*@stackCount",
          "priority": 20
      }
  ],
  "description": "<p>Cumulative effect for each level:<br />-2 on all d20 rolls</p><p>-5ft of movement</p><p></p>",
  "disabled": false,
  "flags": {
      "dae": {
          "stackable": "count",
          "stacks": "1",
          "showIcon": "true"
      }
  },
  "icon": "icons/magic/symbols/rune-sigil-hook-white-red.webp",
  "name": "Exhaustion",
  "transfer": false
}

function grappleEffect(dc, originUuid) {
    return { 
        "changes": [
          {
            "key": "system.attributes.movement.all",
            "mode": 0,
            "value": "0",
            "priority": 25
          },
          {
            "key": "flags.midi-qol.onUseMacroName",
            "mode": 0,
            "value": "function.pachos.effects.compelledDuel.willAttack,preAttackRoll",
            "priority": 20
          },
          {
            "key": "breakDC",
            "mode": 0,
            "value": `${dc}`,
            "priority": 20
          },
          {
            "key": "macro.createItem",
            "mode": 0,
            "value": "Compendium.pachos-compendium.pachos-feats.Item.ijwN0vigdjEXNAA4",
            "priority": 20
          }
        ],
        "origin": originUuid,
        "description": "<p>- A grappled creature's speed becomes 0, and it can't benefit from any bonus to its speed.</p><p>- Disadvantage when attacking anyone other than the grappling creature<br />- The condition ends if the grappler is incapacitated.<br />- The condition also ends if an effect removes the grappled creature from the reach of the grappler or grappling effect.</p>",
        "disabled": false,
        "duration": {
          "rounds": 100,
        },
        "flags": {
          "dae": {
            "showIcon": true,
          },
        },
        "icon": "icons/skills/social/diplomacy-handshake-yellow.webp",
        "name": "Grappled (2024)",
        "transfer": false
    
    }   
}

export const effectsData = {
  'exhaustion': exhaustionEffect,
  'grapple': grappleEffect
}
