# RPG Maker MZ - Item and Equipment System

The item and equipment system in RPG Maker MZ manages inventory, equipment, and their effects on characters and gameplay.

## Data Structure

### Base Item Structure
Items, weapons, and armors share common base properties:
```javascript
{
    id: 1,                  // Unique identifier
    name: "Potion",         // Display name
    iconIndex: 176,         // Icon image index
    description: "...",     // Item description
    price: 50,              // Shop purchase price
    note: "",               // Custom note field for plugins
    meta: {}                // Processed note data
}
```

### Item-Specific Properties
```javascript
{
    // Base properties plus:
    itypeId: 1,             // Item type (1=regular, 2=key, 3=hidden A, 4=hidden B)
    consumable: true,       // Whether item is consumed on use
    scope: 7,               // Target scope (0=none, 1=one enemy, 2=all enemies, etc.)
    occasion: 1,            // When usable (0=always, 1=battle, 2=menu, 3=never)
    speed: 0,               // Speed modifier in battle
    successRate: 100,       // Success rate percentage
    repeats: 1,             // Number of times to repeat
    tpGain: 0,              // TP gain for user
    hitType: 0,             // Hit type (0=certain, 1=physical, 2=magical)
    damage: {},             // Damage calculation settings
    effects: []             // Special effects and stat changes
}
```

### Weapon/Armor-Specific Properties
```javascript
{
    // Base properties plus:
    wtypeId: 1,             // Weapon type ID
    // or
    atypeId: 1,             // Armor type ID
    
    etypeId: 1,             // Equipment slot ID
    traits: [],             // Special traits granted
    params: [0,0,0,0,0,0,0,0], // Parameter bonuses (mhp,mmp,atk,def,mat,mdf,agi,luk)
}
```

## Game Objects

### Game_Item
- Located in `rmmz_objects/Game_Item.js`
- Represents a single item, weapon, or armor reference
- Used by actions to identify what item is being used
- Primarily an abstraction to unify different item types

```javascript
// Creating a Game_Item
const item = new Game_Item();
item.setObject($dataItems[1]); // Set to item ID 1
// or
item.setWeapon($dataWeapons[2]); // Set to weapon ID 2
```

### Game_Party (Inventory)
- Located in `rmmz_objects/Game_Party.js`
- Manages the party's inventory and gold
- Handles item gains, losses, and maximum quantities
- Tracks consumable item usage

```javascript
// Inventory management
$gameParty.gainItem($dataItems[1], 5);      // Add 5 potions
$gameParty.loseItem($dataWeapons[3], 1);    // Lose 1 sword
const count = $gameParty.numItems($dataItems[1]); // Get item count
const max = $gameParty.maxItems($dataItems[1]);   // Get max capacity

// Check if item exists in inventory
if ($gameParty.hasItem($dataItems[5])) {
    // Player has the item
}

// Gold management
$gameParty.gainGold(100);               // Add 100 gold
$gameParty.loseGold(50);                // Lose 50 gold
const canAfford = $gameParty.gold() >= 300; // Check if can afford
```

## Equipment System

### Game_Actor Equipment
- Located in `rmmz_objects/Game_Actor.js`
- Manages an actor's equipped items
- Handles equip limitations and requirements
- Calculates parameter changes from equipment

```javascript
// Equipment operations
actor.changeEquip(0, $dataWeapons[2]);   // Equip weapon ID 2 in slot 0
actor.forceChangeEquip(1, $dataArmors[3]); // Force equip armor ID 3 in slot 1
actor.discardEquip(actor.equips()[2]);   // Remove equipment in slot 2

// Equipment access
const weapon = actor.weapons()[0];       // Get first weapon
const armors = actor.armors();           // Get all armors
const equips = actor.equips();           // Get all equipment

// Equipment slots
const slots = actor.equipSlots();        // Get available equip slots
const canEquip = actor.canEquip($dataWeapons[4]); // Check if can equip
```

### Equipment Types and Slots
The equipment system uses several IDs to organize equippable items:

1. **Equip Type ID (etypeId)**: Defines the slot an item goes into
   - Default: 1=Weapon, 2=Shield, 3=Head, 4=Body, 5=Accessory

2. **Weapon Type ID (wtypeId)**: Categorizes weapons
   - Default: 1=Dagger, 2=Sword, 3=Flail, 4=Axe, etc.

3. **Armor Type ID (atypeId)**: Categorizes armors
   - Default: 1=General Armor, 2=Magic Armor, 3=Light Armor, etc.

4. **Equipment Slot**: The position in the actor's equipment array
   - Defined by class's equipSlots property

## Item and Equipment Effects

### Traits System
Equipment can provide traits that modify character capabilities:

```javascript
// Trait objects
{
    code: 11,     // Trait code (11=Element Rate)
    dataId: 3,    // Data ID (element ID 3)
    value: 0.5    // Value (50% damage from that element)
}

// Common trait codes:
// 11: Element Rate (damage received multiplier)
// 12: Debuff Rate (debuff susceptibility)
// 13: State Rate (state susceptibility)
// 14: State Resistance (immunity to states)
// 21: Parameter (base stat boost)
// 22: Ex-Parameter (hit rate, evasion, etc.)
// 23: Sp-Parameter (crit rate, guard, recovery, etc.)
// 31: Attack Element (adds element to attacks)
// 32: Attack State (chance to apply state on attack)
// 33: Attack Speed (speed modifier)
// 34: Attack Times+ (extra attacks)
// 41-44: Additional skills, weapon types, armor types, special flags
// 51-52: Action restrictions
// 61-64: Party ability (encounter rate, gold, drop, exp modifiers)
```

### Item Effects
Items can have various effects when used:

```javascript
// Effect objects
{
    code: 11,       // Effect code (11=HP Recovery)
    dataId: 0,      // Data ID (depends on effect)
    value1: 0.5,    // Primary value (50% of HP)
    value2: 100     // Secondary value (plus 100 HP)
}

// Common effect codes:
// 11: Recover HP
// 12: Recover MP
// 13: Gain TP
// 21: Add State
// 22: Remove State
// 31: Add Buff
// 32: Add Debuff
// 33: Remove Buff
// 34: Remove Debuff
// 41: Special Effect (escape, target enemy level)
// 42: Grow (permanent parameter increase)
// 43: Learn Skill
// 44: Common Event
```

### Damage Formulas
Item and skill damage is calculated using customizable formulas:

```javascript
// Damage object
{
    type: 1,           // Damage type (1=HP damage, 2=MP damage, 3=HP recovery, etc.)
    elementId: 2,      // Element ID (0=neutral)
    formula: "a.atk * 4 - b.def * 2", // Damage formula
    variance: 20,      // Random variance percentage
    critical: true     // Can critical hit
}

// Formula variables:
// a = user (attacker)
// b = target (defender)
// v = game variables array
// Common properties:
// .atk, .def, .mat, .mdf, .agi, .luk (parameters)
// .hp, .mp, .tp (current values)
// .mhp, .mmp (maximum values)
// .level (actor level)
```

## Shop System

### Shop Processing
- Handled by `Scene_Shop` and related windows
- Supports buying, selling, and equipment comparison
- Can be customized for different shop types

```javascript
// Call shop from event
$gameTemp.setShopGoods([
    [0, 1, 0, 0], // Item ID 1, price override 0 (use default)
    [1, 3, 500, 0], // Weapon ID 3, price override 500
    [2, 2, 0, 1] // Armor ID 2, price override 0, equip only view
]);
SceneManager.push(Scene_Shop);
```

### Purchase Logic
```javascript
// Check if item can be purchased
const canBuy = $gameParty.gold() >= item.price &&
               $gameParty.numItems(item) < $gameParty.maxItems(item);

// Purchase item
$gameParty.loseGold(finalPrice);
$gameParty.gainItem(item, 1);
```