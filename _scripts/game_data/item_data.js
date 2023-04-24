var ITEMS_GSC = [
	"Berry",
	"Berry Juice",
	"Black Belt",
	"BlackGlasses",
	"Charcoal",
	"Dragon Fang",
	"Gold Berry",
	"Hard Stone",
	"King's Rock",
	"Leftovers",
	"Light Ball",
	"Magnet",
	"Metal Coat",
	"Metal Powder",
	"Miracle Seed",
	"Mystic Water",
	"NeverMeltIce",
	"Pink Bow",
	"Poison Barb",
	"Polkadot Bow",
	"Sharp Beak",
	"SilverPowder",
	"Soft Sand",
	"Spell Tag",
	"Stick",
	"Thick Club",
	"TwistedSpoon"
];

var ITEMS_ADV = ITEMS_GSC.concat([
	"Apicot Berry",
	"Aspear Berry",
	"BrightPowder",
	"Cheri Berry",
	"Chesto Berry",
	"Choice Band",
	"DeepSeaScale",
	"DeepSeaTooth",
	"Enigma Berry",
	"Focus Band",
	"Ganlon Berry",
	"Lansat Berry",
	"Lax Incense",
	"Leppa Berry",
	"Liechi Berry",
	"Lum Berry",
	"Macho Brace",
	"Mental Herb",
	"Quick Claw",
	"Oran Berry",
	"Pecha Berry",
	"Persim Berry",
	"Petaya Berry",
	"Rawst Berry",
	"Salac Berry",
	"Sea Incense",
	"Scope Lens",
	"Shell Bell",
	"Silk Scarf",
	"Sitrus Berry",
	"Soul Dew",
	"Starf Berry",
	"White Herb"
]);

ITEMS_ADV.splice(ITEMS_ADV.indexOf("Berry"), 1);
ITEMS_ADV.splice(ITEMS_ADV.indexOf("Gold Berry"), 1);
ITEMS_ADV.splice(ITEMS_ADV.indexOf("Pink Bow"), 1);
ITEMS_ADV.splice(ITEMS_ADV.indexOf("Polkadot Bow"), 1);

var ITEMS_DPP = ITEMS_ADV.concat([
	"Adamant Orb",
	"Babiri Berry",
	"Belue Berry",
	"Big Root",
	"Black Sludge",
	"Charti Berry",
	"Chilan Berry",
	"Choice Scarf",
	"Choice Specs",
	"Chople Berry",
	"Coba Berry",
	"Colbur Berry",
	"Custap Berry",
	"Damp Rock",
	"Draco Plate",
	"Dread Plate",
	"Durin Berry",
	"Earth Plate",
	"Expert Belt",
	"Fist Plate",
	"Flame Orb",
	"Flame Plate",
	"Focus Sash",
	"Grip Claw",
	"Griseous Orb",
	"Haban Berry",
	"Heat Rock",
	"Icicle Plate",
	"Icy Rock",
	"Insect Plate",
	"Iron Ball",
	"Iron Plate",
	"Jaboca Berry",
	"Kasib Berry",
	"Kebia Berry",
	"Lagging Tail",
	"Life Orb",
	"Light Clay",
	"Lustrous Orb",
	"Meadow Plate",
	"Metronome",
	"Micle Berry",
	"Mind Plate",
	"Muscle Band",
	"Occa Berry",
	"Odd Incense",
	"Passho Berry",
	"Payapa Berry",
	"Razor Claw",
	"Razor Fang",
	"Rindo Berry",
	"Rock Incense",
	"Rose Incense",
	"Rowap Berry",
	"Shed Shell",
	"Shuca Berry",
	"Sky Plate",
	"Smooth Rock",
	"Splash Plate",
	"Spooky Plate",
	"Sticky Barb",
	"Stone Plate",
	"Tanga Berry",
	"Toxic Orb",
	"Toxic Plate",
	"Wacan Berry",
	"Watmel Berry",
	"Wave Incense",
	"Wide Lens",
	"Wise Glasses",
	"Yache Berry",
	"Zap Plate",
	"Zoom Lens"
]);

var ITEMS_BW = ITEMS_DPP.concat([
	"Absorb Bulb",
	"Air Balloon",
	"Binding Band",
	"Bug Gem",
	"Burn Drive",
	"Cell Battery",
	"Chill Drive",
	"Dark Gem",
	"Dragon Gem",
	"Douse Drive",
	"Eject Button",
	"Electric Gem",
	"Eviolite",
	"Fighting Gem",
	"Fire Gem",
	"Float Stone",
	"Flying Gem",
	"Ghost Gem",
	"Grass Gem",
	"Ground Gem",
	"Ice Gem",
	"Icy Rock",
	"Normal Gem",
	"Poison Gem",
	"Psychic Gem",
	"Red Card",
	"Ring Target",
	"Rock Gem",
	"Rocky Helmet",
	"Shock Drive",
	"Steel Gem",
	"Water Gem"
]);

var ITEMS_XY = ITEMS_BW.concat([
	"Assault Vest",
	"Kee Berry",
	"Luminous Moss",
	"Maranga Berry",
	"Pixie Plate",
	"Power Herb",
	"Roseli Berry",
	"Safety Goggles",
	"Snowball",
	"Weakness Policy"
]);

ITEMS_XY.splice(ITEMS_XY.indexOf("BlackGlasses"), 1, "Black Glasses");
ITEMS_XY.splice(ITEMS_XY.indexOf("DeepSeaScale"), 1, "Deep Sea Scale");
ITEMS_XY.splice(ITEMS_XY.indexOf("DeepSeaTooth"), 1, "Deep Sea Tooth");
ITEMS_XY.splice(ITEMS_XY.indexOf("NeverMeltIce"), 1, "Never-Melt Ice");
ITEMS_XY.splice(ITEMS_XY.indexOf("SilverPowder"), 1, "Silver Powder");
ITEMS_XY.splice(ITEMS_XY.indexOf("TwistedSpoon"), 1, "Twisted Spoon");
ITEMS_XY.splice(ITEMS_XY.indexOf("BrightPowder"), 1, "Bright Powder");
ITEMS_XY.splice(ITEMS_XY.indexOf("Bug Gem"), 1);
ITEMS_XY.splice(ITEMS_XY.indexOf("Dark Gem"), 1);
ITEMS_XY.splice(ITEMS_XY.indexOf("Dragon Gem"), 1);
ITEMS_XY.splice(ITEMS_XY.indexOf("Electric Gem"), 1);
ITEMS_XY.splice(ITEMS_XY.indexOf("Fighting Gem"), 1);
ITEMS_XY.splice(ITEMS_XY.indexOf("Fire Gem"), 1);
ITEMS_XY.splice(ITEMS_XY.indexOf("Flying Gem"), 1);
ITEMS_XY.splice(ITEMS_XY.indexOf("Ghost Gem"), 1);
ITEMS_XY.splice(ITEMS_XY.indexOf("Grass Gem"), 1);
ITEMS_XY.splice(ITEMS_XY.indexOf("Ground Gem"), 1);
ITEMS_XY.splice(ITEMS_XY.indexOf("Ice Gem"), 1);
ITEMS_XY.splice(ITEMS_XY.indexOf("Poison Gem"), 1);
ITEMS_XY.splice(ITEMS_XY.indexOf("Psychic Gem"), 1);
ITEMS_XY.splice(ITEMS_XY.indexOf("Rock Gem"), 1);
ITEMS_XY.splice(ITEMS_XY.indexOf("Steel Gem"), 1);
ITEMS_XY.splice(ITEMS_XY.indexOf("Water Gem"), 1);
ITEMS_XY.splice(ITEMS_XY.indexOf("Soul Dew"), 1);

var ITEMS_SM = ITEMS_XY.concat([
	"Adrenaline Orb",
	"Protective Pads",
	"Terrain Extender",
	"Figy Berry",
	"Iapapa Berry",
	"Wiki Berry",
	"Aguav Berry",
	"Mago Berry",
	"Electric Seed",
	"Psychic Seed",
	"Misty Seed",
	"Grassy Seed",
	"Bug Memory",
	"Dark Memory",
	"Dragon Memory",
	"Electric Memory",
	"Fairy Memory",
	"Fighting Memory",
	"Fire Memory",
	"Flying Memory",
	"Ghost Memory",
	"Grass Memory",
	"Ground Memory",
	"Ice Memory",
	"Poison Memory",
	"Psychic Memory",
	"Rock Memory",
	"Steel Memory",
	"Water Memory",
	"Normalium Z",
	"Grassium Z",
	"Firium Z",
	"Waterium Z",
	"Electrium Z",
	"Icium Z",
	"Flyinium Z",
	"Buginium Z",
	"Poisonium Z",
	"Groundium Z",
	"Rockium Z",
	"Fightinium Z",
	"Psychium Z",
	"Ghostium Z",
	"Dragonium Z",
	"Darkinium Z",
	"Steelium Z",
	"Fairium Z",
	"Decidium Z",
	"Incinium Z",
	"Primarium Z",
	"Aloraichium Z",
	"Tapunium Z",
	"Mimikium Z",
	"Ultranecrozium Z",
	"Solganium Z",
	"Lunalium Z",
	"Lycanium Z",
	"Kommonium Z",
	"Marshadium Z"
]);

var ITEMS_SS = ITEMS_SM.concat([
	"Blunder Policy",
	"Eject Pack",
	"Heavy-Duty Boots",
	"Leek",
	"Room Service",
	"Rusted Shield",
	"Rusted Sword",
	"Throat Spray",
	"Utility Umbrella"
]);

var ITEMS_SV = ITEMS_SS.concat([
	"Booster Energy",
	"Ability Shield",
	"Clear Amulet",
	"Mirror Herb",
	"Punching Glove",
	"Covert Cloak",
	"Loaded Dice"
]);

function getTechnoBlast(item) {
	switch (item) {
	case "Burn Drive":
		return "Fire";
	case "Chill Drive":
		return "Ice";
	case "Douse Drive":
		return "Water";
	case "Shock Drive":
		return "Electric";
	default:
		return "";
	}
}

function getItemBoostType(item) {
	switch (item) {
	case "Draco Plate":
	case "Dragon Fang":
		return "Dragon";
	case "Dread Plate":
	case "BlackGlasses":
	case "Black Glasses":
		return "Dark";
	case "Earth Plate":
	case "Soft Sand":
		return "Ground";
	case "Fist Plate":
	case "Black Belt":
		return "Fighting";
	case "Flame Plate":
	case "Charcoal":
		return "Fire";
	case "Icicle Plate":
	case "NeverMeltIce":
	case "Never-Melt Ice":
		return "Ice";
	case "Insect Plate":
	case "SilverPowder":
	case "Silver Powder":
		return "Bug";
	case "Iron Plate":
	case "Metal Coat":
		return "Steel";
	case "Meadow Plate":
	case "Rose Incense":
	case "Miracle Seed":
		return "Grass";
	case "Mind Plate":
	case "Odd Incense":
	case "TwistedSpoon":
	case "Twisted Spoon":
		return "Psychic";
	case "Pixie Plate":
		return "Fairy";
	case "Sky Plate":
	case "Sharp Beak":
		return "Flying";
	case "Splash Plate":
	case "Sea Incense":
	case "Wave Incense":
	case "Mystic Water":
		return "Water";
	case "Spooky Plate":
	case "Spell Tag":
		return "Ghost";
	case "Stone Plate":
	case "Rock Incense":
	case "Hard Stone":
		return "Rock";
	case "Toxic Plate":
	case "Poison Barb":
		return "Poison";
	case "Zap Plate":
	case "Magnet":
		return "Electric";
	case "Silk Scarf":
	case "Pink Bow":
	case "Polkadot Bow":
		return "Normal";
	default:
		return "";
	}
}

function getBerryResistType(berry) {
	switch (berry) {
	case "Chilan Berry":
		return "Normal";
	case "Occa Berry":
		return "Fire";
	case "Passho Berry":
		return "Water";
	case "Wacan Berry":
		return "Electric";
	case "Rindo Berry":
		return "Grass";
	case "Yache Berry":
		return "Ice";
	case "Chople Berry":
		return "Fighting";
	case "Kebia Berry":
		return "Poison";
	case "Shuca Berry":
		return "Ground";
	case "Coba Berry":
		return "Flying";
	case "Payapa Berry":
		return "Psychic";
	case "Tanga Berry":
		return "Bug";
	case "Charti Berry":
		return "Rock";
	case "Kasib Berry":
		return "Ghost";
	case "Haban Berry":
		return "Dragon";
	case "Colbur Berry":
		return "Dark";
	case "Babiri Berry":
		return "Steel";
	case "Roseli Berry":
		return "Fairy";
	default:
		return "";
	}
}

function getFlingPower(item) {
	return item === "Iron Ball" ? 130 :
		item === "Hard Stone" ? 100 :
			item.indexOf("Plate") !== -1 || ["Deep Sea Tooth", "Thick Club"].indexOf(item) !== -1 ? 90 :
				["Assault Vest", "Weakness Policy"].indexOf(item) !== -1 ? 80 :
					["Poison Barb", "Dragon Fang"].indexOf(item) !== -1 ? 70 :
						["Adamant Orb", "Lustrous Orb", "Macho Brace", "Stick"].indexOf(item) !== -1 ? 60 :
							item === "Sharp Beak" ? 50 :
								item === "Eviolite" ? 40 :
									["Black Belt", "Black Sludge", "Black Glasses", "Charcoal", "Deep Sea Scale", "Flame Orb", "King's Rock",
										"Life Orb", "Light Ball", "Magnet", "Metal Coat", "Miracle Seed", "Mystic Water", "Never-Melt Ice",
										"Razor Fang", "Soul Dew", "Spell Tag", "Toxic Orb", "Twisted Spoon"].indexOf(item) !== -1 ? 30 :
										10;
}

function getNaturalGift(item) {
	var gift = {
		"Apicot Berry": {"t": "Ground", "p": 100},
		"Babiri Berry": {"t": "Steel", "p": 80},
		"Belue Berry": {"t": "Electric", "p": 100},
		"Charti Berry": {"t": "Rock", "p": 80},
		"Chesto Berry": {"t": "Water", "p": 80},
		"Chilan Berry": {"t": "Normal", "p": 80},
		"Chople Berry": {"t": "Fighting", "p": 80},
		"Coba Berry": {"t": "Flying", "p": 80},
		"Colbur Berry": {"t": "Dark", "p": 80},
		"Custap Berry": {"t": "Ghost", "p": 100},
		"Durin Berry": {"t": "Water", "p": 100},
		"Enigma Berry": {"t": "Bug", "p": 100},
		"Ganlon Berry": {"t": "Ice", "p": 100},
		"Haban Berry": {"t": "Dragon", "p": 80},
		"Jaboca Berry": {"t": "Dragon", "p": 100},
		"Kasib Berry": {"t": "Ghost", "p": 80},
		"Kebia Berry": {"t": "Poison", "p": 80},
		"Kee Berry": {"t": "Fairy", "p": 100},
		"Lansat Berry": {"t": "Flying", "p": 100},
		"Leppa Berry": {"t": "Fighting", "p": 80},
		"Liechi Berry": {"t": "Grass", "p": 100},
		"Lum Berry": {"t": "Flying", "p": 80},
		"Maranga Berry": {"t": "Dark", "p": 100},
		"Micle Berry": {"t": "Rock", "p": 100},
		"Occa Berry": {"t": "Fire", "p": 80},
		"Oran Berry": {"t": "Poison", "p": 80},
		"Passho Berry": {"t": "Water", "p": 80},
		"Payapa Berry": {"t": "Psychic", "p": 80},
		"Petaya Berry": {"t": "Poison", "p": 100},
		"Rawst Berry": {"t": "Grass", "p": 80},
		"Rindo Berry": {"t": "Grass", "p": 80},
		"Roseli Berry": {"t": "Fairy", "p": 80},
		"Rowap Berry": {"t": "Dark", "p": 100},
		"Salac Berry": {"t": "Fighting", "p": 100},
		"Shuca Berry": {"t": "Ground", "p": 80},
		"Sitrus Berry": {"t": "Psychic", "p": 80},
		"Starf Berry": {"t": "Psychic", "p": 100},
		"Tanga Berry": {"t": "Bug", "p": 80},
		"Wacan Berry": {"t": "Electric", "p": 80},
		"Watmel Berry": {"t": "Fire", "p": 100},
		"Yache Berry": {"t": "Ice", "p": 80}
	}[item];
	if (gift) {
		if (gen < 6) {
			gift.p -= 20;
		}
		return gift;
	}
	return {"t": "Normal", "p": 1};
}

function getMultiAttack(item) {
	switch (item) {
	case "Bug Memory":
		return "Bug";
	case "Dark Memory":
		return "Dark";
	case "Dragon Memory":
		return "Dragon";
	case "Electric Memory":
		return "Electric";
	case "Fairy Memory":
		return "Fairy";
	case "Fighting Memory":
		return "Fighting";
	case "Fire Memory":
		return "Fire";
	case "Flying Memory":
		return "Flying";
	case "Ghost Memory":
		return "Ghost";
	case "Grass Memory":
		return "Grass";
	case "Ground Memory":
		return "Ground";
	case "Ice Memory":
		return "Ice";
	case "Poison Memory":
		return "Poison";
	case "Psychic Memory":
		return "Psychic";
	case "Rock Memory":
		return "Rock";
	case "Steel Memory":
		return "Steel";
	case "Water Memory":
		return "Water";
	default:
		return "";
	}
}
