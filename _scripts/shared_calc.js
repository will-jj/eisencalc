// input field validation
var bounds = {
	"level": [1, 100],
	"autolevel-box": [1, 100],
	"autoivs-box": [0, 31],
	"base": [1, 255],
	"evs": [0, 252],
	"ivs": [0, 31],
	"dvs": [0, 15],
	"move-bp": [0, 999],
	"current-happiness": [0, 255]
};
for (var bounded in bounds) {
	if (bounds.hasOwnProperty(bounded)) {
		attachValidation(bounded, bounds[bounded][0], bounds[bounded][1]);
	}
}
function attachValidation(clazz, min, max) {
	$("." + clazz).keyup(function () {
		validate($(this), min, max);
	});
}
function validate(obj, min, max) {
	obj.val(Math.max(min, Math.min(max, ~~obj.val())));
}

$(".max").bind("keyup change", function () {
	var poke = $(this).closest(".poke-info");
	calcHP(poke);
	calcStats(poke);
});

$(".max-level").bind("keyup change", function () {
	var poke = $(this).closest(".poke-info");
	calcHP(poke);
	calcStats(poke);
});

$("#maxL").change(function () {
	if (this.checked) {
		for (var i = 0; i < 4; i++) {
			$("#maxL" + (i + 1)).prop("checked", true);
		}
	} else {
		for (var i = 0; i < 4; i++) {
			$("#maxL" + (i + 1)).prop("checked", false);
		}
	}
});

$(".tera").bind("keyup change", function () {
	if (gen != 9) {
		return;
	}
	let pokeInfo = $(this).closest(".poke-info");
	let setName = pokeInfo.find("input.set-selector").val(); // speciesName (setName)
	let pokeName = setName.substring(0, setName.indexOf(" ("));
	if ($(this).prop("checked")) {
		if (pokeName.startsWith("Ogerpon")) {
			pokeInfo.find(".ability").val("Embody Aspect");
		} else if (pokeName == "Terapagos-Terastal") {
			pokeInfo.find(".forme").val("Terapagos-Stellar");
			pokeInfo.find(".forme").change();
		}
		let teraType = pokeInfo.find(".tera-type").val();
		if (teraType === "Stellar") {
			return; // do not change typing for Stellar tera type
		}
		pokeInfo.find(".type1").val(teraType);
		pokeInfo.find(".type2").val("");
	} else {
		let dexEntry = pokedex[pokeName];
		let formeName = pokeInfo.find(".forme").val();
		if (dexEntry.formes && formeName) {
			dexEntry = pokedex[formeName];
		}
		if (pokeName.startsWith("Ogerpon")) {
			pokeInfo.find(".ability").val(dexEntry.abilities[0]);
		} else if (formeName == "Terapagos-Stellar") {
			pokeInfo.find(".forme").val("Terapagos-Terastal");
			pokeInfo.find(".forme").change();
		}
		if (pokeInfo.find(".tera-type").val() === "Stellar") {
			return; // do not change typing for Stellar tera type
		}
		pokeInfo.find(".type1").val(dexEntry.t1);
		pokeInfo.find(".type2").val(dexEntry.t2 ? dexEntry.t2 : "");
	}
});

$(".tera-type").bind("keyup change", function () {
	if (gen != 9) {
		return;
	}
	let pokeInfo = $(this).closest(".poke-info");
	if (!pokeInfo.find(".tera").prop("checked")) {
		return;
	}
	// the tera type changed while terastallized, so update the current typing
	let teraType = $(this).val();
	let type1 = teraType;
	let type2 = "";
	if (teraType === "Stellar") {
		let setName = pokeInfo.find("input.set-selector").val(); // speciesName (setName)
		let pokeName = setName.substring(0, setName.indexOf(" ("));
		let dexEntry = pokedex[pokeName];
		let formeName = pokeInfo.find(".forme").val();
		if (dexEntry.formes && formeName) {
			dexEntry = pokedex[formeName];
		}
		type1 = dexEntry.t1;
		type2 = dexEntry.t2 ? dexEntry.t2 : "";
	} else {
		type1 = teraType;
		type2 = "";
	}
	pokeInfo.find(".type1").val(type1);
	pokeInfo.find(".type2").val(type2);
});

$("#autolevel").change(function () {
	// auto-calc stats and current HP on change
	let autoLevel = $(gen == 3 || gen == 4 ? "#autolevel-box" : "input:radio[name='autolevel-btn']:checked").val();
	let p1 = $("#p1");
	let p2 = $("#p2");
	if (gen == 4) {
		// for gen 4 only, due to Hall mechanics, changes to the autolevel should not affect the pokemon if it's a custom set
		if (!isCustomSet(p1.find("input.set-selector").val())) {
			p1.find(".level").val(autoLevel);
		}
		let p2Name = p2.find("input.set-selector").val();
		if (p2Name) {
			if (!isCustomSet(p2Name)) {
				p2.find(".level").val(autoLevel);
			}
		}
	} else {
		p1.find(".level").val(autoLevel);
		p2.find(".level").val(autoLevel);
	}
	$(".level").change();
	localStorage.setItem("autolevelGen" + gen, autoLevel);
});

$("#autoivs-center").change(function () {
	// do not set the IVs of non-AI sets
	if (gen <= 4 || gen >= 8) {
		return;
	}
	let p1 = $("#p1");
	if (!isCustomSet(p1.find("input.set-selector").val())) {
		setIVSelectors(p1, "L");
	}
	let p2 = $("#p2");
	if (!isCustomSet(p2.find("input.set-selector").val())) {
		setIVSelectors(p2, "R");
	}
});

$("#autoivsL").change(function () {
	if (gen != 3 && gen != 4) {
		return;
	}
	setIVSelectors($("#p1"), "L");
});

function setIVSelectors(poke, side) {
	if (!poke) {
		return;
	}

	let autoIVs = getAutoIVValue(side);

	poke.find(".hp .ivs").val(autoIVs);
	for (i = 0; i < STATS.length; i++) {
		poke.find("." + STATS[i] + " .ivs").val(autoIVs);
	}
	calcHP(poke);
	calcStats(poke);
}

function getAutoIVValue(side) {
	let autoIVs;
	if (gen == 3) {
		autoIVs = parseInt($("#autoivs" + side + " #autoivs-select").find(":selected").val());
	} else if (gen == 4) {
		autoIVs = parseInt($("#autoivs" + side + " #autoivs-box").val());
	} else if (gen <= 7) {
		autoIVs = parseInt($('#autoivs-center #autoivs-select').find(":selected").val());
	}
	if (isNaN(autoIVs)) {
		return 31;
	}
	return autoIVs;
}

function isCustomSet(pokeName) {
	// pokeName should be the name as displayed in the sets list: speciesName (setName)
	if (!pokeName) {
		return false;
	}
	let speciesSets = SETDEX_CUSTOM[pokeName.substring(0, pokeName.indexOf(" ("))];
	return (speciesSets && (pokeName.substring(pokeName.indexOf("(") + 1, pokeName.length - 1) in speciesSets));
}

$("#format").change(function () {
	localStorage.setItem("selectedFormat", $("input:radio[name='format']:checked").val().toLowerCase());
});

$(".level").bind("keyup change", function () {
	var poke = $(this).closest(".poke-info");
	calcHP(poke);
	calcStats(poke);
});
$(".nature").bind("keyup keydown click change", function () {
	calcStats($(this).closest(".poke-info"));
});
$(".hp .base, .hp .evs, .hp .ivs, .current-happiness").bind("keyup keydown click change", function () {
	calcHP($(this).closest(".poke-info"));
});
$(".at .base, .at .evs, .at .ivs, .current-happiness").bind("keyup keydown click change", function () {
	calcStat($(this).closest(".poke-info"), "at");
});
$(".df .base, .df .evs, .df .ivs, .current-happiness").bind("keyup keydown click change", function () {
	calcStat($(this).closest(".poke-info"), "df");
});
$(".sa .base, .sa .evs, .sa .ivs, .current-happiness").bind("keyup keydown click change", function () {
	calcStat($(this).closest(".poke-info"), "sa");
});
$(".sd .base, .sd .evs, .sd .ivs, .current-happiness").bind("keyup keydown click change", function () {
	calcStat($(this).closest(".poke-info"), "sd");
});
$(".sp .base, .sp .evs, .sp .ivs, .current-happiness").bind("keyup keydown click change", function () {
	calcStat($(this).closest(".poke-info"), "sp");
});
$(".evs").bind("keyup keydown click change", function () {
	calcEvTotal($(this).closest(".poke-info"));
});

function calcStats(poke) {
	for (var i = 0; i < STATS.length; i++) {
		calcStat(poke, STATS[i]);
	}
}

function calcEvTotal(poke) {
	var total = 0;
	poke.find(".evs").each(function (idx, elt) { total += 1 * $(elt).val(); });

	var newClass = total > 510 ? "overLimit" : "underLimit";

	var evTotal = poke.find(".ev-total");
	evTotal.removeClass("underLimit overLimit").text(total).addClass(newClass);
}

function calcCurrentHP(poke, max, percent) {
	var current = Math.ceil(percent * max / 100);
	poke.find(".current-hp").val(current);
}
function calcPercentHP(poke, max, current) {
	var percent = Math.floor(100 * current / max);
	poke.find(".percent-hp").val(percent);
}
$(".current-hp").keyup(function () {
	var max = $(this).parent().children(".max-hp").text();
	validate($(this), 0, max);
	var current = $(this).val();
	calcPercentHP($(this).parent(), max, current);
});
$(".percent-hp").keyup(function () {
	var max = $(this).parent().children(".max-hp").text();
	validate($(this), 0, 100);
	var percent = $(this).val();
	calcCurrentHP($(this).parent(), max, percent);
});

var lastAura = [false, false, false];
var isNeutralizingGas = false;
$(".ability").bind("keyup change", function () {
	autoSetMultiHits($(this).closest(".poke-info"));
	autoSetAura();
});

$("#p1 .ability").bind("keyup change", function () {
	let ability = $(this).val();
	autoSetWeatherTerrain(curAbilities[0], ability, curAbilities[1]);
	curAbilities[0] = $(this).val();
	autoSetVicStar(ability, "L");
	autoSetSteely(ability, "L");
	autoSetRuin(ability, "L");
});

function autoSetAura() {
	var ability1 = $("#p1 .ability").val();
	var ability2 = $("#p2 .ability").val();
	if (!isNeutralizingGas && (ability1 == "Fairy Aura" || ability2 == "Fairy Aura"))
		$("input:checkbox[id='fairy-aura']").prop("checked", true);
	else
		$("input:checkbox[id='fairy-aura']").prop("checked", lastAura[0]);
	if (!isNeutralizingGas && (ability1 == "Dark Aura" || ability2 == "Dark Aura"))
		$("input:checkbox[id='dark-aura']").prop("checked", true);
	else
		$("input:checkbox[id='dark-aura']").prop("checked", lastAura[1]);
	if (!isNeutralizingGas && (ability1 == "Aura Break" || ability2 == "Aura Break"))
		$("input:checkbox[id='aura-break']").prop("checked", true);
	else
		$("input:checkbox[id='aura-break']").prop("checked", lastAura[2]);
}

function autoSetVicStar(ability, side) {
	$("input:checkbox[id='vicStar" + side + "']").prop("checked", (!isNeutralizingGas && ability === "Victory Star"));
}

// Right now this is only getting used by weather/terrain setting since it's the only thing that cares about the previous ability.
// Other functions could use this since it's global, but it would complicate things since the order of calls really starts to matter.
var curAbilities = ["", ""];
var manuallySetWeather = "";
var manuallySetTerrain = "";

$("input:radio[name='weather']").change(function () {
	manuallySetWeather = $(this).val();
});

$("input:radio[name='terrain']").change(function () {
	manuallySetTerrain = $(this).val();
});

function autoWeatherAbilities(ability) {
	switch (ability) {
	case "Drought":
	case "Orichalcum Pulse":
		return "Sun";
	case "Drizzle":
		return "Rain";
	case "Sand Stream":
		return "Sand";
	case "Snow Warning":
		return (gen <= 8 || gen == 80) ? "Hail" : "Snow";
	case "Desolate Land":
		return "Harsh Sun";
	case "Primordial Sea":
		return "Heavy Rain";
	case "Delta Stream":
		return "Strong Winds";
	default:
		return "";
	}
}
var strongWeatherAbilities = {
	"Desolate Land": "Harsh Sun",
	"Primordial Sea": "Heavy Rain",
	"Delta Stream": "Strong Winds",
};
function autoTerrainAbilities(ability) {
	switch (ability) {
	case "Electric Surge":
	case "Hadron Engine":
		return "Electric";
	case "Grassy Surge":
		return "Grassy";
	case "Misty Surge":
		return "Misty";
	case "Psychic Surge":
		return "Psychic";
	default:
		return "";
	}
}

function autoSetWeatherTerrain(currentAbility, newAbility, opponentAbility) {
	setNewFieldEffect("weather", currentAbility, newAbility, opponentAbility, manuallySetWeather, autoWeatherAbilities);
	setNewFieldEffect("terrain", currentAbility, newAbility, opponentAbility, manuallySetTerrain, autoTerrainAbilities);
}

function setNewFieldEffect(effectType, currentAbility, newAbility, opponentAbility, manuallySetEffect, effectAbilities) {
	let currentEffect = $("input:radio[name='" + effectType + "']:checked").val();
	let newEffect = manuallySetEffect;
	let newAbilityEffect = effectAbilities(newAbility);
	// check if setting a new effect
	if (newAbilityEffect !== "") {
		if (!(newAbility in strongWeatherAbilities) &&
			Object.values(strongWeatherAbilities).includes(currentEffect) && !(currentAbility in strongWeatherAbilities)) {
			return;
		}
		newEffect = newAbilityEffect;
	}
	// check if need to switch to the opponent's effect
	else if (effectAbilities(currentAbility) !== currentEffect) {
		// don't change to the opponent's effect if this mon's old ability doesn't match the current effect
		return;
	} else if (effectAbilities(opponentAbility)) {
		newEffect = effectAbilities(opponentAbility);
	}

	$("input:radio[name='" + effectType + "'][value='" + newEffect + "']").prop("checked", true);
}

$("#p1 .item").bind("keyup change", function () {
	autosetStatus("#p1", $(this).val());
	autoSetMultiHits($("#p1"));
});

var lastManualStatus = {"#p1": "Healthy", "#p2": "Healthy"};
var lastAutoStatus = {"#p1": "Healthy", "#p2": "Healthy"};
function autosetStatus(p, item) {
	var currentStatus = $(p + " .status").val();
	if (currentStatus !== lastAutoStatus[p]) {
		lastManualStatus[p] = currentStatus;
	}
	if (item === "Flame Orb") {
		lastAutoStatus[p] = "Burned";
		$(p + " .status").val("Burned");
		$(p + " .status").change();
	} else if (item === "Toxic Orb") {
		lastAutoStatus[p] = "Badly Poisoned";
		$(p + " .status").val("Badly Poisoned");
		$(p + " .status").change();
	} else {
		lastAutoStatus[p] = "Healthy";
		if (currentStatus !== lastManualStatus[p]) {
			$(p + " .status").val(lastManualStatus[p]);
			$(p + " .status").change();
		}
	}
}

function autoSetSteely(ability, side) {
	$("input:checkbox[id='steelySpirit" + side + "']").prop("checked", (!isNeutralizingGas && ability === "Steely Spirit"));
}

function autoSetRuin(ability, side) {
	$("input:checkbox[id='ruinTablets" + side + "']").prop("checked", (!isNeutralizingGas && ability === "Tablets of Ruin"));
	$("input:checkbox[id='ruinVessel" + side + "']").prop("checked", (!isNeutralizingGas && ability === "Vessel of Ruin"));
	$("input:checkbox[id='ruinSword" + side + "']").prop("checked", (!isNeutralizingGas && ability === "Sword of Ruin"));
	$("input:checkbox[id='ruinBeads" + side + "']").prop("checked", (!isNeutralizingGas && ability === "Beads of Ruin"));
}

function autoSetMultiHits(pokeInfo) {
	var ability = pokeInfo.find(".ability").val();
	var item = pokeInfo.find(".item").val();
	for (var i = 1; i <= 4; i++) {
		var moveInfo = pokeInfo.find(".move" + i);
		var moveName = moveInfo.find("select.move-selector").val();
		if (moveName === "Population Bomb") {
			moveInfo.children(".move-hits").val(10);
		} else if (moveName === "Triple Axel") {
			moveInfo.children(".move-hits").val(3);
		} else {
			moveInfo.children(".move-hits").val(ability === "Skill Link" ? 5 : (item === "Loaded Dice" ? 4 : 3));
		}
	}
}

$(".status").bind("keyup change", function () {
	if ($(this).val() === "Badly Poisoned") {
		$(this).parent().children(".toxic-counter").show();
	} else {
		$(this).parent().children(".toxic-counter").hide();
	}
});

$(".move-selector").change(function () {
	var moveName = $(this).val();
	var move = moves[moveName] || moves["(No Move)"];
	var moveGroupObj = $(this).parent();
	let pokeInfo = $(this).closest(".poke-info");
	let ability = pokeInfo.find(".ability").val();
	moveGroupObj.children(".move-bp").val(move.bp);
	moveGroupObj.children(".move-type").val(move.type);
	moveGroupObj.children(".move-cat").val(move.category);
	if (pokeInfo.prop("id")[1] == "1") {
		let forceCrit = move.alwaysCrit || (!isNeutralizingGas && ability === "Merciless" && move.category && $("#p2").find(".status").val().endsWith("Poisoned"));
		moveGroupObj.children(".move-crit").prop("checked", forceCrit);
	}
	var moveHits = moveGroupObj.children(".move-hits");
	moveHits.empty();
	var maxMultiHits = move.maxMultiHits;
	if (maxMultiHits && !move.isMax) {
		for(var i = 2; i <= maxMultiHits; i++) {
			moveHits.append($("<option></option>").attr("value", i).text(i + " hits"));
		}
		moveHits.show();
		moveHits.val(ability === "Skill Link" || moveName === "Population Bomb" ? maxMultiHits : (pokeInfo.find(".item").val() === "Loaded Dice" ? 4 : 3));
	} else {
		moveHits.hide();
	}
	moveGroupObj.children(".move-z").prop("checked", false);
	if (!($(this).closest("poke-info").find(".max").prop("checked"))) {
		moveGroupObj.children(".move-z").prop(".move-max", false);
	}
});

// auto-update set details on select
$(".set-selector").bind("change click keyup keydown", function () {
	let fullSetName = $(this).val();
	let pokemonName = fullSetName.substring(0, fullSetName.indexOf(" ("));
	let setName = fullSetName.substring(fullSetName.indexOf("(") + 1, fullSetName.lastIndexOf(")"));
	let pokemon = pokedex[pokemonName];
	if (!pokemon) {
		console.log("error: `" + pokemonName + "` could not be found in pokedex[]");
		return;
	}
	let pokeObj = $(this).closest(".poke-info");
	let pokeObjID = pokeObj.prop("id");

	// If the sticky move was on this side, reset it
	if (stickyMoves.getSelectedSide() === pokeObjID) {
		stickyMoves.clearStickyMove();
	}

	// If the selected move was on this side, reset it
	let selectedMove = $("input:radio[name='resultMove']:checked").prop("id");
	if (selectedMove !== undefined) {
		var selectedSide = selectedMove.charAt(selectedMove.length - 2);
		if (pokeObjID === "p1" && selectedSide === "L") {
			$("#resultMoveL1").prop("checked", true);
			$("#resultMoveL1").change();
		}
		else if (pokeObjID === "p2" && selectedSide === "R") {
			$("#resultMoveR1").prop("checked", true);
			$("#resultMoveR1").change();
		}
	}

	pokeObj.find(".type1").val(pokemon.t1);
	pokeObj.find(".type2").val(pokemon.t2 !== undefined ? pokemon.t2 : "");
	pokeObj.find(".hp .base").val(pokemon.bs.hp);
	for (let i = 0; i < STATS.length; i++) {
		pokeObj.find("." + STATS[i] + " .base").val(pokemon.bs[STATS[i]]);
	}
	pokeObj.find(".hp").val("calcHP");
	pokeObj.find(".weight").val(pokemon.w);
	pokeObj.find(".boost").val(0);
	pokeObj.find(".percent-hp").val(100);
	pokeObj.find(".status").val("Healthy");
	$(".status").change();
	pokeObj.find(".max-level").val(10);
	pokeObj.find(".max").prop("checked", false);
	pokeObj.find(".tera-type").val(pokemon.t1); // this statement might do nothing
	pokeObj.find(".tera").prop("checked", false);
	//.change() for max and tera is below
	var moveObj;
	var abilityObj = pokeObj.find(".ability");
	var abilityList = pokemon.abilities;
	prependSpeciesAbilities(abilityList, pokeObjID, abilityObj);
	var itemObj = pokeObj.find(".item");
	if (pokemonName in setdexAll && setName in setdexAll[pokemonName]) {
		var set = setdexAll[pokemonName][setName];
		pokeObj.find(".level").val(set.level ? set.level : (localStorage.getItem("autolevelGen" + gen) ? parseInt(localStorage.getItem("autolevelGen" + gen)) : 50));
		let autoIVs = getAutoIVValue(pokeObjID === "p2" ? "R" : "L");
		pokeObj.find(".hp .evs").val(set.evs && typeof set.evs.hp !== "undefined" ? set.evs.hp : 0);
		pokeObj.find(".hp .ivs").val(set.ivs && typeof set.ivs.hp !== "undefined" ? set.ivs.hp : autoIVs);
		for (i = 0; i < STATS.length; i++) {
			pokeObj.find("." + STATS[i] + " .evs").val(set.evs && typeof set.evs[STATS[i]] !== "undefined" ? set.evs[STATS[i]] : 0);
			pokeObj.find("." + STATS[i] + " .ivs").val(set.ivs && typeof set.ivs[STATS[i]] !== "undefined" ? set.ivs[STATS[i]] : autoIVs);
		}
		setSelectValueIfValid(pokeObj.find(".nature"), set.nature, "Hardy");
		setSelectValueIfValid(abilityObj, set.ability ? set.ability : (abilityList && abilityList.length == 1 ? abilityList[0] : pokemon.ab), "");
		setSelectValueIfValid(pokeObj.find(".tera-type"), set.teraType, pokemon.t1);
		setSelectValueIfValid(itemObj, set.item, "");
		for (i = 0; i < 4; i++) {
			moveObj = pokeObj.find(".move" + (i + 1) + " select.move-selector");
			setSelectValueIfValid(moveObj, set.moves[i], "(No Move)");
			moveObj.change();
		}
		if (set.startDmax && gen == 8) {
			pokeObj.find(".max").prop("checked", true);
		} else if (set.startTera && gen == 9) {
			pokeObj.find(".tera").prop("checked", true);
		}
	} else {
		// Blank set
		pokeObj.find(".level").val(localStorage.getItem("autolevelGen" + gen) ? parseInt(localStorage.getItem("autolevelGen" + gen)) : 50);
		pokeObj.find(".hp .evs").val(0);
		pokeObj.find(".hp .ivs").val(31);
		for (i = 0; i < STATS.length; i++) {
			pokeObj.find("." + STATS[i] + " .evs").val(0);
			pokeObj.find("." + STATS[i] + " .ivs").val(31);
		}
		pokeObj.find(".nature").val("Hardy");
		setSelectValueIfValid(abilityObj, abilityList && abilityList.length == 1 ? abilityList[0] : pokemon.ab, "");
		if (pokemonName.startsWith("Ogerpon") && pokemonName.includes("-")) {
			pokeObj.find(".tera-type").val(pokemon.t2);
		} else if (pokemonName.startsWith("Terapagos")) {
			pokeObj.find(".tera-type").val("Stellar");
		} else {
			pokeObj.find(".tera-type").val(pokemon.t1);
		}
		itemObj.val("");
		for (i = 0; i < 4; i++) {
			moveObj = pokeObj.find(".move" + (i + 1) + " select.move-selector");
			moveObj.val("(No Move)");
			moveObj.change();
		}
	}
	pokeObj.find(".max").change();
	pokeObj.find(".tera").change();
	var formeObj = $(this).siblings().find(".forme").parent();
	itemObj.prop("disabled", false);
	if (pokemon.formes) {
		showFormes(formeObj, setName, pokemonName, pokemon);
	} else {
		formeObj.hide();
	}
	calcHP(pokeObj);
	calcStats(pokeObj);
	calcEvTotal(pokeObj);
	abilityObj.change();
	itemObj.change();
});

var p1AbilityCount = 0;
var p2AbilityCount = 0;
function prependSpeciesAbilities(abilityList, pokeObjID, abilityObj) {
	for (let i = pokeObjID === "p1" ? p1AbilityCount : p2AbilityCount; i > 0; i--) {
		abilityObj.children("option").eq(1).remove();
	}
	if (abilityList) {
		let abListObj = abilityObj.children("option");
		abilityList.forEach(ab => abListObj.eq(1).before($('<option></option>').val(ab).text(ab)));
		if (pokeObjID === "p1") {
			p1AbilityCount = abilityList.length;
		} else {
			p2AbilityCount = abilityList.length;
		}
	} else {
		if (pokeObjID === "p1") {
			p1AbilityCount = 0;
		} else {
			p2AbilityCount = 0;
		}
	}
}

function showFormes(formeObj, setName, pokemonName, pokemon) {
	let formeOptions = getSelectOptions(pokemon.formes, false, getFormeNum(setName, pokemonName));
	formeObj.children("select").find("option").remove().end().append(formeOptions).change();
	formeObj.show();
}

function getFormeNum(setName, pokemonName) {
	if (setName === "Blank Set") {
		return 0;
	}
	let set = setdexAll[pokemonName][setName];
	if (set.forme) {
		return pokedex[pokemonName].formes.indexOf(set.forme);
	} else if (set.isGmax) {
		return 1;
	} else if (set.item) {
		if (set.item !== "Eviolite" && (set.item.endsWith("ite") || set.item.endsWith("ite X"))) {
			return 1;
		} else if (set.item.endsWith("ite Y")) {
			return 2;
		}
	}
	return 0;
}

function setSelectValueIfValid(select, value, fallback) {
	select.val(select.children("option[value='" + value + "']").length !== 0 ? value : fallback);
}

$(".forme").change(function () {
	var altForme = pokedex[$(this).val()],
		container = $(this).closest(".info-group").siblings(),
		fullSetName = container.find(".select2-chosen").first().text(),
		pokemonName = fullSetName.substring(0, fullSetName.indexOf(" (")),
		setName = fullSetName.substring(fullSetName.indexOf("(") + 1, fullSetName.lastIndexOf(")"));

	if (gen != 9 || !$(this).closest(".poke-info").find(".tera").prop("checked")) {
		$(this).parent().siblings().find(".type1").val(altForme.t1);
		$(this).parent().siblings().find(".type2").val(altForme.t2 !== undefined ? altForme.t2 : "");
	}
	$(this).parent().siblings().find(".weight").val(altForme.w);

	for (var i = 0; i < STATS.length; i++) {
		var baseStat = container.find("." + STATS[i]).find(".base");
		baseStat.val(altForme.bs[STATS[i]]);
		var altHP = container.find(".hp .base").val(altForme.bs.hp);
		altHP.keyup();
		baseStat.keyup();
	}

	var abilityList = altForme.abilities;
	prependSpeciesAbilities(abilityList, container.parent().parent().prop("id"), container.find(".ability"));

	if (abilityList && abilityList.length == 1) {
		container.find(".ability").val(abilityList[0]);
	} else if (abilities.includes(altForme.ab)) {
		container.find(".ability").val(altForme.ab);
	} else if (setName !== "Blank Set" && abilities.includes(setdexAll[pokemonName][setName].ability)) {
		container.find(".ability").val(setdexAll[pokemonName][setName].ability);
	} else {
		container.find(".ability").val("");
	}
	container.find(".ability").keyup();

	if ($(this).val().indexOf("Mega") === 0 && $(this).val() !== "Mega Rayquaza") {
		container.find(".item").val("").keyup();
		//container.find(".item").prop("disabled", true);
		//edited out by squirrelboy1225 for doubles!
	} else {
		container.find(".item").prop("disabled", false);
	}

	if (pokemonName === "Darmanitan") {
		container.find(".percent-hp").val($(this).val() === "Darmanitan-Z" ? "50" : "100").keyup();
	}
	// This is where we would make Zygarde's Forme change @50% HP, need to define var formeName
	// if (pokemonName === "Zygarde" && (formeName === "Zygarde-10%" || formeName === "Zygarde")) {
	//    container.find(".percent-hp").val($(this).val() === "Zygarde-Complete" ? "50" : "100").keyup();
	//}
});

/*function getTerrainEffects() {
	var className = $(this).prop("className");
	className = className.substring(0, className.indexOf(" "));
	switch (className) {
	case "type1":
	case "type2":
	case "ability":
	case "item":
		var id = $(this).closest(".poke-info").prop("id");
		let terrainValue = $("input:checkbox[name='terrain']:checked").val();
		if (terrainValue === "Electric") {
			$("#" + id).find("[value='Asleep']").prop("disabled", isGroundedTerrain($("#" + id)));
		} else if (terrainValue === "Misty") {
			$("#" + id).find(".status").prop("disabled", isGroundedTerrain($("#" + id)));
		}
		break;
	default:
		$("input:checkbox[name='terrain']").not(this).prop("checked", false);
		if ($(this).prop("checked") && $(this).val() === "Electric") {
			$("#p1").find("[value='Asleep']").prop("disabled", isGroundedTerrain($("#p1")));
			$("#p2").find("[value='Asleep']").prop("disabled", isGroundedTerrain($("#p2")));
		} else if ($(this).prop("checked") && $(this).val() === "Misty") {
			$("#p1").find(".status").prop("disabled", isGroundedTerrain($("#p1")));
			$("#p2").find(".status").prop("disabled", isGroundedTerrain($("#p2")));
		} else {
			$("#p1").find("[value='Asleep']").prop("disabled", false);
			$("#p1").find(".status").prop("disabled", false);
			$("#p2").find("[value='Asleep']").prop("disabled", false);
			$("#p2").find(".status").prop("disabled", false);
		}
		break;
	}
}

function isGroundedTerrain(pokeInfo) {
	return $("#gravity").prop("checked") || pokeInfo.find(".type1").val() !== "Flying" && pokeInfo.find(".type2").val() !== "Flying" &&
            pokeInfo.find(".ability").val() !== "Levitate" && pokeInfo.find(".item").val() !== "Air Balloon";
}*/

// Need to close over "lastClicked", so we'll do it the old-fashioned way to avoid
// needlessly polluting the global namespace.
var stickyMoves = (function () {
	var lastClicked = "resultMoveL1";
	$(".result-move").click(function () {
		if (this.id === lastClicked) {
			$(this).toggleClass("locked-move");
		} else {
			$(".locked-move").removeClass("locked-move");
		}
		lastClicked = this.id;
	});

	return {
		"clearStickyMove": function () {
			lastClicked = null;
			$(".locked-move").removeClass("locked-move");
		},
		"setSelectedMove": function (slot) {
			lastClicked = slot;
		},
		"getSelectedSide": function () {
			if (lastClicked) {
				if (lastClicked.includes("resultMoveL")) {
					return "p1";
				} else if (lastClicked.includes("resultMoveR")) {
					return "p2";
				}
			}
			return null;
		}
	};
})();

function Pokemon(pokeInfo) {
	// pokeInfo is a jquery object
	let setName = pokeInfo.find("input.set-selector").val();
	let speciesName = setName.substring(0, setName.indexOf(" ("));
	let poke = {
		"type1": pokeInfo.find(".type1").val(),
		"type2": pokeInfo.find(".type2").val(),
		// ~~ is used as a faster Math.floor() for positive numbers
		"level": ~~pokeInfo.find(".level").val(),
		"maxHP": ~~pokeInfo.find(".hp .total").text(),
		"curHP": ~~pokeInfo.find(".current-hp").val(),
		"HPEVs": ~~pokeInfo.find(".hp .evs").val(),
		"HPIVs": ~~pokeInfo.find(".hp .ivs").val(),
		"isDynamax": pokeInfo.find(".max").prop("checked"),
		"isTerastal": pokeInfo.find(".tera").prop("checked"),
		"rawStats": [],
		"boosts": [],
		"stats": [],
		"evs": [],
		"ivs": [],
		"nature": pokeInfo.find(".nature").val(),
		"ability": pokeInfo.find(".ability").val(),
		"item": pokeInfo.find(".item").val(),
		"status": pokeInfo.find(".status").val(),
		"toxicCounter": pokeInfo.find(".status").val() === "Badly Poisoned" ? ~~pokeInfo.find(".toxic-counter").val() : 0,
		"weight": +pokeInfo.find(".weight").val(),
		"hasType": function (type) { return this.type1 === type || this.type2 === type; },
		// Reset this mon's current ability subject to Neutralizing Gas
		// This is designed to be called once before calcs and after calcing each move as defender
		"resetCurAbility": function () { this.curAbility = (isNeutralizingGas && this.item !== "Ability Shield") ? "" : this.ability }
	};
	// name
	let dexEntry = pokedex[speciesName];
	if (!setName.includes("(")) {
		poke.name = setName;
	} else {
		let currentForme = pokeInfo.find(".forme").val();
		if (dexEntry.formes && currentForme != null) {
			poke.name = currentForme;
			dexEntry = pokedex[currentForme];
		} else {
			poke.name = speciesName;
		}
	}
	// dexType
	if (dexEntry) {
		poke.dexType1 = dexEntry.t1;
		poke.dexType2 = dexEntry.t2;
	}
	// .ability is the mon's ability and should never be overwritten
	// .curAbility represents the ability after negation through Neutralizing Gas or a Mold Breaker ability or move
	poke.resetCurAbility();
	// teraType
	if (gen === 9) {
		poke.teraType = pokeInfo.find(".tera-type").val();
	}
	// populate rawStats, boosts, evs, and ivs
	STATS.forEach(stat => {
		poke.rawStats[stat] = ~~pokeInfo.find("." + stat + " .total").text();
		poke.boosts[stat] = ~~pokeInfo.find("." + stat + " .boost").val();
		poke.evs[stat] = ~~pokeInfo.find("." + stat + " .evs").val();
		poke.ivs[stat] = ~~pokeInfo.find("." + stat + " .ivs").val();
	});
	// moves and baseMoveNames
	let move1 = pokeInfo.find(".move1");
	let move2 = pokeInfo.find(".move2");
	let move3 = pokeInfo.find(".move3");
	let move4 = pokeInfo.find(".move4");
	// if the set is a facility set and the move does not exist in moves, pass on the move's name so it appears in resultMove
	let setdexPoke = setdex[speciesName] ? setdex[speciesName][setName.substring(speciesName.length + 2, setName.length - 1)] : false;
	poke.baseMoveNames = [ // baseMoveNames is used in set export
		setdexPoke ? setdexPoke.moves[0] : move1.find("select.move-selector").val(),
		setdexPoke ? setdexPoke.moves[1] : move2.find("select.move-selector").val(),
		setdexPoke ? setdexPoke.moves[2] : move3.find("select.move-selector").val(),
		setdexPoke ? setdexPoke.moves[3] : move4.find("select.move-selector").val()
	];
	poke.moves = [
		setdexPoke && !(setdexPoke.moves[0] in moves) ? {"name": setdexPoke.moves[0], "bp": 0} : getMoveDetails(move1, poke.item, poke.name),
		setdexPoke && !(setdexPoke.moves[1] in moves) ? {"name": setdexPoke.moves[1], "bp": 0} : getMoveDetails(move2, poke.item, poke.name),
		setdexPoke && !(setdexPoke.moves[2] in moves) ? {"name": setdexPoke.moves[2], "bp": 0} : getMoveDetails(move3, poke.item, poke.name),
		setdexPoke && !(setdexPoke.moves[3] in moves) ? {"name": setdexPoke.moves[3], "bp": 0} : getMoveDetails(move4, poke.item, poke.name)
	];

	return poke;
}

function getMoveDetails(moveInfo, item, species) {
	let moveName = moveInfo.find("select.move-selector").val();
	let defaultDetails = moves[moveName];

	if (gen == 7 && moveInfo.find("input.move-z").prop("checked") && moveName !== "Struggle" && "zp" in defaultDetails) {
		return getZMove(moveName, defaultDetails, item, moveInfo.find(".move-crit").prop("checked"));
	}
	if (gen == 8 && moveInfo.find("input.move-max").prop("checked") && moveName !== "Struggle") {
		return getMaxMove(moveName, defaultDetails, species, moveInfo);
	}

	return $.extend({
		"name": moveName,
		"bp": ~~moveInfo.find(".move-bp").val(),
		"type": moveInfo.find(".move-type").val(),
		"category": moveInfo.find(".move-cat").val(),
		"isCrit": moveInfo.find(".move-crit").prop("checked"),
		"hits": defaultDetails.maxMultiHits ? ~~moveInfo.find(".move-hits").val() : defaultDetails.isThreeHit ? 3 : defaultDetails.isTwoHit ? 2 : 1,
		"usedTimes": defaultDetails.dropsStats ? ~~moveInfo.find(".stat-drops").val() : 1
	}, defaultDetails);
}

function getMaxMove(moveName, defaultDetails, species, moveInfo) {
	let exceptions_100_fight = ["Low Kick", "Reversal", "Final Gambit"];
	let exceptions_80_fight = ["Double Kick", "Triple Kick"];
	let exceptions_75_fight = ["Counter", "Seismic Toss"];
	let exceptions_140 = ["Triple Axel", "Crush Grip", "Wring Out", "Magnitude", "Double Iron Bash", "Rising Voltage"];
	let exceptions_130 = ["Lash Out (Doubled)", "Scale Shot", "Dual Wingbeat", "Terrain Pulse", "Bolt Beak (Doubled)", "Fishious Rend (Doubled)", "Pin Missile", "Power Trip", "Punishment", "Dragon Darts", "Dual Chop", "Electro Ball", "Heat Crash",
		"Bullet Seed", "Grass Knot", "Bonemerang", "Bone Rush", "Fissure", "Icicle Spear", "Sheer Cold", "Weather Ball", "Tail Slap", "Guillotine", "Horn Drill",
		"Flail", "Return", "Frustration", "Endeavor", "Natural Gift", "Trump Card", "Stored Power", "Rock Blast", "Gear Grind", "Gyro Ball", "Heavy Slam"];
	let exceptions_120 = ["Double Hit", "Spike Cannon"];
	let exceptions_110 = ["Avalanche (Doubled)", "Revenge (Doubled)"];
	let exceptions_100 = ["Twineedle", "Beat Up", "Fling", "Dragon Rage", "Nature\'s Madness", "Night Shade", "Comet Punch", "Fury Swipes", "Sonic Boom", "Bide",
		"Super Fang", "Present", "Spit Up", "Psywave", "Mirror Coat", "Metal Burst"];

	let moveType = defaultDetails.type;

	let ability = moveInfo ? moveInfo.closest(".poke-info").find(".ability").val() : "";
	// changing the type like this prevents getDamageResult() from applying the -ate boost, which is accurate to the game
	if (!isNeutralizingGas && ability === "Pixilate" && moveType === "Normal") {
		moveType = "Fairy";
	} else if (!isNeutralizingGas && ability === "Refrigerate" && moveType === "Normal") {
		moveType = "Ice";
	}

	let maxMoveName = MAXMOVES_LOOKUP[defaultDetails.type];

	let tempBP = 0;
	if (moveType == "Fighting" || moveType == "Poison") {
		if (exceptions_100_fight.includes(moveName)) tempBP = 100;
		else if (exceptions_80_fight.includes(moveName)) tempBP = 80;
		else if (exceptions_75_fight.includes(moveName)) tempBP = 75;
		else if (defaultDetails.bp >= 150) tempBP = 100;
		else if (defaultDetails.bp >= 110) tempBP = 95;
		else if (defaultDetails.bp >= 75) tempBP = 90;
		else if (defaultDetails.bp >= 65) tempBP = 85;
		else if (defaultDetails.bp >= 55) tempBP = 80;
		else if (defaultDetails.bp >= 45) tempBP = 75;
		else if (defaultDetails.bp >= 1) tempBP = 70;
	} else {
		if (exceptions_140.includes(moveName)) tempBP = 140;
		else if (exceptions_130.includes(moveName)) tempBP = 130;
		else if (exceptions_120.includes(moveName)) tempBP = 120;
		else if (exceptions_110.includes(moveName)) tempBP = 110;
		else if (exceptions_100.includes(moveName)) tempBP = 100;
		else if (defaultDetails.bp >= 150) tempBP = 150;
		else if (defaultDetails.bp >= 110) tempBP = 140;
		else if (defaultDetails.bp >= 75) tempBP = 130;
		else if (defaultDetails.bp >= 65) tempBP = 120;
		else if (defaultDetails.bp >= 55) tempBP = 110;
		else if (defaultDetails.bp >= 45) tempBP = 100;
		else if (defaultDetails.bp >= 1) tempBP = 90;
	}

	let negateAbility = false;
	if (tempBP == 0) {
		maxMoveName = "Max Guard";
		moveType = "Normal";
	} else if (species === "Cinderace-Gmax" && moveType === "Fire") {
		tempBP = 160;
		maxMoveName = "G-Max Fireball";
		negateAbility = true;
	} else if (species === "Inteleon-Gmax" && moveType === "Water") {
		tempBP = 160;
		maxMoveName = "G-Max Hydrosnipe";
		negateAbility = true;
	} else if (species === "Rillaboom-Gmax" && moveType === "Grass") {
		tempBP = 160;
		maxMoveName = "G-Max Drum Solo";
		negateAbility = true;
	}

	return {
		"name": maxMoveName,
		"bp": tempBP,
		"type": moveType,
		"category": defaultDetails.category,
		"acc": 101,
		"isCrit": moveInfo ? moveInfo.find(".move-crit").prop("checked") : false,
		"hits": 1,
		"isMax": true,
		"negateAbility": negateAbility
	};
}

function getZMove(moveName, defaultDetails, item, isCrit) {
	let moveType = defaultDetails.type;

	let zMoveName, moveDetails;
	if (item in EXCLUSIVE_ZMOVES_LOOKUP && EXCLUSIVE_ZMOVES_LOOKUP[item].baseMove === moveName) {
		zMoveName = EXCLUSIVE_ZMOVES_LOOKUP[item].zMoveName;
		moveDetails = EXCLUSIVE_ZMOVES[zMoveName];
	} else {
		if (moveName.includes("Hidden Power")) { // Hidden Power will become Breakneck Blitz
			moveType = "Normal";
		} else if (moveName === "Nature Power") {
			let terrainValue = $("input:radio[name='terrain']:checked").val();
			moveType = terrainValue === "Electric" ? "Electric" : terrainValue === "Grassy" ? "Grass" : terrainValue === "Misty" ? "Fairy" : terrainValue === "Psychic" ? "Psychic" : defaultDetails.type;
		}

		zMoveName = ZMOVES_LOOKUP[moveType];
		moveDetails = {
			"bp": (moveName === "Nature Power" && moveType !== defaultDetails.type) ? 175 : defaultDetails.zp,
			"type": moveType,
			"category": defaultDetails.category
		};
	}

	return $.extend({
		"name": zMoveName,
		"acc": 101,
		"isCrit": isCrit,
		"hits": 1,
		"isZ": true
	}, moveDetails);
}

function Field() {
	let format = $("input:radio[name='format']:checked").val().toLowerCase();
	let terrain = $("input:radio[name='terrain']:checked").val();
	let weather = $("input:radio[name='weather']:checked").val();
	let isAuraFairy = $("#fairy-aura").prop("checked");
	let isAuraDark = $("#dark-aura").prop("checked");
	let isAuraBreak = $("#aura-break").prop("checked");
	let isGravity = $("#gravity").prop("checked");
	// isSR (stealth rocks), spikes, and Busted are all in the correct order.
	let isSR = [$("#srR").prop("checked"), $("#srL").prop("checked")];
	let isProtect = [$("#protectL").prop("checked"), $("#protectR").prop("checked")];
	let spikes = [~~$("input:radio[name='spikesR']:checked").val(), ~~$("input:radio[name='spikesL']:checked").val()];
	let isReflect = [$("#reflectL").prop("checked"), $("#reflectR").prop("checked")];
	let isLightScreen = [$("#lightScreenL").prop("checked"), $("#lightScreenR").prop("checked")];
	let isSeeded = [$("#leechSeedR").prop("checked"), $("#leechSeedL").prop("checked")]; // affects attacks against opposite side
	let isHelpingHand = [$("#helpingHandR").prop("checked"), $("#helpingHandL").prop("checked")]; // affects attacks against opposite side
	let isCharge = [$("#chargeR").prop("checked"), $("#chargeL").prop("checked")]; // affects attacks against opposite side
	let isPowerSpot = [$("#powerSpotR").prop("checked"), $("#powerSpotL").prop("checked")]; // affects attacks against opposite side
	let isFriendGuard = [$("#friendGuardL").prop("checked"), $("#friendGuardR").prop("checked")];
	let isBattery = [$("#batteryR").prop("checked"), $("#batteryL").prop("checked")]; // affects attacks against opposite side
	let isMinimized = [$("#minimL").prop("checked"), $("#minimR").prop("checked")];
	let isVictoryStar = [$("#vicStarL").prop("checked"), $("#vicStarR").prop("checked")];
	let isBusted8 = [$("#busted8R").prop("checked"), $("#busted8L").prop("checked")];
	let isBusted16 = [$("#busted16R").prop("checked"), $("#busted16L").prop("checked")];
	let isSteelySpirit = [$("#steelySpiritR").prop("checked"), $("#steelySpiritL").prop("checked")]; // affects attacks against opposite side
	let fainted = [$("#faintedR").val(), $("#faintedL").val()]; // affects attacks against opposite side
	let isRuinTablets = [$("#ruinTabletsL").prop("checked"), $("#ruinTabletsR").prop("checked")];
	let isRuinVessel = [$("#ruinVesselL").prop("checked"), $("#ruinVesselR").prop("checked")];
	let isRuinSword = [$("#ruinSwordR").prop("checked"), $("#ruinSwordL").prop("checked")]; // affects attacks against opposite side
	let isRuinBeads = [$("#ruinBeadsR").prop("checked"), $("#ruinBeadsL").prop("checked")]; // affects attacks against opposite side

	this.getWeather = function () {
		return weather;
	};
	this.setWeather = function (newWeather) {
		weather = newWeather;
	};
	this.clearWeather = function () {
		weather = "";
	};
	this.getTerrain = function () {
		return terrain;
	};
	this.getSide = function (i) {
		return new Side(format, terrain, weather, isAuraFairy, isAuraDark, isAuraBreak, isGravity,
			isSR[i], spikes[i], isReflect[i], isLightScreen[i], isSeeded[i], isHelpingHand[i], isCharge[i], isMinimized[i],
			isVictoryStar[i], isFriendGuard[i],
			isBattery[i], isProtect[i],
			isPowerSpot[i], isBusted8[i], isBusted16[i], isSteelySpirit[i],
			fainted[i], isRuinTablets[i], isRuinVessel[i], isRuinSword[i], isRuinBeads[i]);
	};
}

function Side(format, terrain, weather, isAuraFairy, isAuraDark, isAuraBreak, isGravity,
	isSR, spikes, isReflect, isLightScreen, isSeeded, isHelpingHand, isCharge, isMinimized,
	isVictoryStar, isFriendGuard,
	isBattery, isProtect,
	isPowerSpot, isBusted8, isBusted16, isSteelySpirit,
	faintedCount, isRuinTablets, isRuinVessel, isRuinSword, isRuinBeads) {
	this.format = format;
	this.terrain = terrain;
	this.weather = weather;
	this.isAuraFairy = isAuraFairy;
	this.isAuraDark = isAuraDark;
	this.isAuraBreak = isAuraBreak;
	this.isGravity = isGravity;
	this.isSR = isSR;
	this.spikes = spikes;
	this.isReflect = isReflect;
	this.isLightScreen = isLightScreen;
	this.isSeeded = isSeeded;
	this.isHelpingHand = isHelpingHand;
	this.isCharge = isCharge;
	this.isMinimized = isMinimized;
	this.isVictoryStar = isVictoryStar;
	this.isFriendGuard = isFriendGuard;
	this.isBattery = isBattery;
	this.isProtect = isProtect;
	this.isPowerSpot = isPowerSpot;
	this.isBusted8 = isBusted8;
	this.isBusted16 = isBusted16;
	this.isSteelySpirit = isSteelySpirit;
	this.faintedCount = faintedCount;
	this.isRuinTablets = isRuinTablets;
	this.isRuinVessel = isRuinVessel;
	this.isRuinSword = isRuinSword;
	this.isRuinBeads = isRuinBeads;
}

// Damage map functions
function mapFromArray(array) {
	let map = new Map();
	for (let i = 0; i < array.length; i++) {
		mapAddKey(map, array[i], 1);
	}
	return map;
}

function mapAddKey(map, key, value) {
	map.set(key, map.has(key) ? map.get(key) + value : value);
}

function combineDuplicateDamageMaps(damageMap) {
	// for combining two damage maps that have the same kv-pairs, thus just one arg
	let returnDamageMap = new Map();
	let damageValues = Array.from(damageMap.keys());
	let valuesLength = damageValues.length;
	for (let i = 0; i < valuesLength; i++) {
		let iDamage = damageValues[i];
		let iCount = damageMap.get(iDamage);
		mapAddKey(returnDamageMap, iDamage + iDamage, iCount * iCount);
		for (let j = i + 1; j < valuesLength; j++) {
			let jDamage = damageValues[j];
			let jCount = damageMap.get(jDamage);
			mapAddKey(returnDamageMap, iDamage + jDamage, 2 * iCount * jCount);
		}
	}
	return returnDamageMap;
}

function combineDamageMaps(iDamageMap, jDamageMap) {
	let returnDamageMap = new Map();
	for (const [iDamage, iCount] of iDamageMap) {
		for (const [jDamage, jCount] of jDamageMap) {
			mapAddKey(returnDamageMap, iDamage + jDamage, iCount * jCount);
		}
	}
	return returnDamageMap;
}

function recurseDamageMaps(damageMap, numHits) {
	// this function can be optimized a few ways, but with numHits <= 10, it won't do anything.
	if (numHits == 1) {
		return damageMap;
	}
	if (numHits % 2 == 0) {
		return combineDuplicateDamageMaps(recurseDamageMaps(damageMap, numHits / 2));
	} else {
		return combineDamageMaps(damageMap, recurseDamageMaps(damageMap, numHits - 1));
	}
}

var MAP_SQUASH_CONSTANT = 2 ** 13;
function squashDamageMap(damageMap, mapCombinations) {
	let divisor = mapCombinations / MAP_SQUASH_CONSTANT;
	for (const [key, value] of damageMap) {
		damageMap.set(key, value / divisor);
	}
	return mapCombinations / divisor;
}

function getAssembledDamageMap(result, resultDamageMap, moveHits, considerReducedDamage) {
	if (result.damage.length == 1) {
		//result.hitDamageValues = "(" + result.damage[0] + ")";
		return new Map([[result.damage[0], 1]]);
	} else if (result.tripleAxelDamage) {
		// result.tripleAxelDamage[0] goes unused, it should be the non-resist berry first hit.
		let assembledDamageMap = combineDamageMaps((considerReducedDamage ? mapFromArray(result.firstHitDamage) : resultDamageMap), mapFromArray(result.tripleAxelDamage[1]));
		if (moveHits == 3) {
			return combineDamageMaps(assembledDamageMap, mapFromArray(result.tripleAxelDamage[2]));
		}
		return assembledDamageMap;
	} else if (result.childDamage) {
		return combineDamageMaps((considerReducedDamage ? mapFromArray(result.firstHitDamage) : resultDamageMap), mapFromArray(result.childDamage));
	} else if (moveHits > 1) {
		if (considerReducedDamage) {
			return combineDamageMaps(recurseDamageMaps(resultDamageMap, moveHits - 1), mapFromArray(result.firstHitDamage));
		}
		return recurseDamageMaps(resultDamageMap, moveHits);
	}

	return considerReducedDamage ? mapFromArray(result.firstHitDamage) : resultDamageMap;
}
// End damage map functions

// please add the new setdex to this function whenever adding a new gen
function isFacilitySet(speciesName, setName) {
	let setdexMaps = [SETDEX_EM, SETDEX_PHGSS, SETDEX_GEN5, SETDEX_GEN6, SETDEX_GEN7, SETDEX_GEN8, SETDEX_GEN80];
	for (let setdexMap of setdexMaps) {
		let speciesSets = setdexMap[speciesName];
		if (speciesSets && (setName in speciesSets)) {
			return true;
		}
	}
	return false;
}

const IVS_GEN3 = [31, 21, 18, 15, 12, 9, 6, 3];
const IVS_OTHER = [31, 27, 23, 19];

var gen, pokedex, setdex, setdexAll, typeChart, moves, abilities, items, calculateAllMoves;
var STATS = STATS_GSC;
var calcHP = CALC_HP_ADV;
var calcStat = CALC_STAT_ADV;
var forumLink = "https://www.smogon.com/forums/forums/battle-facilities.697/";
$(".gen").change(function () {
	gen = ~~$(this).val();
	switch (gen) {
	case 3:
		pokedex = POKEDEX_ADV;
		setdex = SETDEX_EM;
		typeChart = TYPE_CHART_GSC;
		moves = MOVES_ADV;
		items = ITEMS_ADV;
		abilities = ABILITIES_ADV;
		calculateAllMoves = CALCULATE_ALL_MOVES_ADV;
		$(".autoivs-select").find("option").remove().end().append(getSelectOptions(IVS_GEN3));
		forumLink = "https://www.smogon.com/forums/threads/gen-iii-battle-frontier-discussion-and-records.3648697/";
		break;
	case 4:
		pokedex = POKEDEX_DPP;
		setdex = SETDEX_PHGSS;
		typeChart = TYPE_CHART_GSC;
		moves = MOVES_DPP;
		items = ITEMS_DPP;
		abilities = ABILITIES_DPP;
		calculateAllMoves = CALCULATE_ALL_MOVES_PTHGSS;
		forumLink = "https://www.smogon.com/forums/threads/4th-generation-battle-facilities-discussion-and-records.3663294/";
		break;
	case 5:
		pokedex = POKEDEX_BW;
		setdex = SETDEX_GEN5;
		typeChart = TYPE_CHART_GSC;
		moves = MOVES_BW;
		items = ITEMS_BW;
		abilities = ABILITIES_BW;
		calculateAllMoves = CALCULATE_ALL_MOVES_MODERN;
		$("#autoivs-center #autoivs-select").find("option").remove().end().append(getSelectOptions(IVS_OTHER));
		forumLink = "https://www.smogon.com/forums/threads/black-white-battle-subway-records-now-with-gen-4-records.102593/";
		break;
	case 6:
		pokedex = POKEDEX_XY;
		setdex = SETDEX_GEN6;
		typeChart = TYPE_CHART_XY;
		moves = MOVES_XY;
		items = ITEMS_XY;
		abilities = ABILITIES_XY;
		calculateAllMoves = CALCULATE_ALL_MOVES_MODERN;
		$("#autoivs-center #autoivs-select").find("option").remove().end().append(getSelectOptions(IVS_OTHER));
		forumLink = "https://www.smogon.com/forums/threads/battle-maison-discussion-records.3492706/";
		break;
	case 7:
		$(".evo_img1").attr("src", "_images/eevee.png");
		$(".evo_img2").attr("src", "_images/eevium.png");
		pokedex = POKEDEX_SM;
		setdex = SETDEX_GEN7;
		typeChart = TYPE_CHART_XY;
		moves = MOVES_SM;
		items = ITEMS_SM;
		abilities = ABILITIES_SM;
		calculateAllMoves = CALCULATE_ALL_MOVES_MODERN;
		$("#autoivs-center #autoivs-select").find("option").remove().end().append(getSelectOptions(IVS_OTHER));
		forumLink = "https://www.smogon.com/forums/threads/battle-tree-discussion-and-records.3587215/";
		break;
	case 8:
		pokedex = POKEDEX_SS;
		setdex = SETDEX_GEN8;
		typeChart = TYPE_CHART_XY;
		moves = MOVES_SS;
		items = ITEMS_SS;
		abilities = ABILITIES_SS;
		calculateAllMoves = CALCULATE_ALL_MOVES_MODERN;
		forumLink = "https://www.smogon.com/forums/threads/swsh-battle-facilities-discussion-records.3656190/";
		$("#startGimmick-label").text("Start Dynamaxed");
		$("#startGimmick-label").prop("title", "This custom set starts Dynamaxed when loaded");
		break;
	case 80:
		pokedex = POKEDEX_BDSP;
		setdex = SETDEX_GEN80;
		typeChart = TYPE_CHART_XY;
		moves = MOVES_SS;
		items = ITEMS_SS;
		abilities = ABILITIES_SS;
		calculateAllMoves = CALCULATE_ALL_MOVES_MODERN;
		forumLink = "https://www.smogon.com/forums/threads/bdsp-battle-tower-discussion-records.3693739/";
		break;
	case 9:
		$(".evo_img1").attr("src", "_images/dozo.png");
		$(".evo_img2").attr("src", "_images/giri.png");
		pokedex = POKEDEX_SV;
		setdex = [];//SV
		typeChart = TYPE_CHART_XY;
		moves = MOVES_SV;
		items = ITEMS_SV;
		abilities = ABILITIES_SV;
		calculateAllMoves = CALCULATE_ALL_MOVES_MODERN;
		$("#startGimmick-label").text("Start Terastallized");
		$("#startGimmick-label").prop("title", "This custom set starts Terastallized when loaded");
	}
	localStorage.setItem("selectedGen", gen);
	$("#autolevel-title").text((gen == 4 ? "AI " : "") + "Auto-Level to:");
	setdexAll = joinDexes([setdex, SETDEX_CUSTOM]);
	$("#midimg").parent().prop("href", forumLink);
	clearField();
	$(".gen-specific.g" + gen).show();
	$(".gen-specific").not(".g" + gen).hide();
	let typeOptions = getSelectOptions(Object.keys(typeChart));
	$("select.type1").find("option").remove().end().append(typeOptions);
	$("select.type2").find("option").remove().end().append("<option value=\"\">(none)</option>" + typeOptions);
	$("select.move-type").find("option").remove().end().append("<option value=\"None\">None</option>" + typeOptions);
	if (gen == 9) {
		$("select.tera-type").find("option").remove().end().append(typeOptions + "<option value=\"Stellar\">Stellar</option>");
	}
	var moveOptions = getSelectOptions(Object.keys(moves), true);
	$("select.move-selector").find("option").remove().end().append(moveOptions);
	var abilityOptions = getSelectOptions(abilities, true);
	$("select.ability").find("option").remove().end().append("<option value=\"\">(other)</option><option disabled>--</option>" + abilityOptions);
	p1AbilityCount = 0;
	p2AbilityCount = 0;
	var itemOptions = getSelectOptions(items, true);
	$("select.item").find("option").remove().end().append("<option value=\"\">(none)</option>" + itemOptions);
	manuallySetWeather = "";
	manuallySetTerrain = "";
	$("input:radio[name='weather'][value='']").prop("checked", true);
	$("input:radio[name='terrain'][value='']").prop("checked", true);

	$(".set-selector").val(getSetOptions()[1].id); // load the first set after the unselectable species name
	$(".set-selector").change();
});

function joinDexes(components) {
	var joinedDex = {};
	for (var i = 0; i < components.length; i++) {
		var sourceDex = components[i];
		if (sourceDex) {
			for (var p in sourceDex) {
				if (sourceDex.hasOwnProperty(p)) {
					joinedDex[p] = $.extend(joinedDex[p], sourceDex[p]);
				}
			}
		}
	}
	return joinedDex;
}

function clearField() {
	var storedLevel = localStorage.getItem("autolevelGen" + gen) ? localStorage.getItem("autolevelGen" + gen) : 50;
	if (gen == 3 || gen == 4) {
		$("#autolevel-box").val(storedLevel);
	} else {
		$("input:radio[id='autolevel" + storedLevel + "']").prop("checked", true);
	}
	if (localStorage.getItem("selectedFormat") != null) {
		switch (localStorage.getItem("selectedFormat") + "") {

		case "singles":
			$("#singles").prop("checked", true);
			break;

		case "doubles":
			$("#doubles").prop("checked", true);
			break;

		default:
			$("#doubles").prop("checked", true);
		}
	} else if (gen == 3 || gen == 4) {
		$("#singles").prop("checked", true);
	} else {
		$("#doubles").prop("checked", true);
	}
	$("#clear").prop("checked", true);
	$("#gscClear").prop("checked", true);
	$("#gravity").prop("checked", false);
	$("#srL").prop("checked", false);
	$("#srR").prop("checked", false);
	$("#spikesL0").prop("checked", true);
	$("#spikesR0").prop("checked", true);
	$("#gscSpikesL").prop("checked", false);
	$("#gscSpikesR").prop("checked", false);
	$("#reflectL").prop("checked", false);
	$("#reflectR").prop("checked", false);
	$("#lightScreenL").prop("checked", false);
	$("#lightScreenR").prop("checked", false);
	$("#leechSeedL").prop("checked", false);
	$("#leechSeedR").prop("checked", false);
	$("#helpingHandL").prop("checked", false);
	$("#helpingHandR").prop("checked", false);
	$("#chargeL").prop("checked", false);
	$("#chargeR").prop("checked", false);
	$("#powerSpotL").prop("checked", false);
	$("#powerSpotR").prop("checked", false);
	$("#friendGuardL").prop("checked", false);
	$("#friendGuardR").prop("checked", false);
	$("#batteryL").prop("checked", false);
	$("#batteryR").prop("checked", false);
	$("#clangL").prop("checked", false); // +1 All
	$("#clangR").prop("checked", false);
	$("#wpL").prop("checked", false);
	$("#wpR").prop("checked", false);
	$("#evoL").prop("checked", false); // +2 All
	$("#evoR").prop("checked", false);
	$("#steelySpiritL").prop("checked", false);
	$("#steelySpiritR").prop("checked", false);
	$("#faintedL").val(0);
	$("#faintedR").val(0);
	$("#ruinTabletsL").prop("checked", false);
	$("#ruinTabletsR").prop("checked", false);
	$("#ruinVesselL").prop("checked", false);
	$("#ruinVesselR").prop("checked", false);
	$("#ruinSwordL").prop("checked", false);
	$("#ruinSwordR").prop("checked", false);
	$("#ruinBeadsL").prop("checked", false);
	$("#ruinBeadsR").prop("checked", false);

	$("#startGimmick").prop("checked", false);
}

function getSetOptions() {
	var pokeNames, index;
	pokeNames = Object.keys(pokedex);
	index = pokeNames.length;
	while (index--) {
		if (pokedex[pokeNames[index]].hasBaseForme) {
			pokeNames.splice(index, 1);
		}
	}
	pokeNames.sort();
	index = pokeNames.length;
	while (index--) { //forcing alolan forms to show first
		if (pokeNames[index].includes("-Alola")) {
			var temp = pokeNames[index];
			pokeNames.splice(index, 1); //deleting alolan entry
			var regularForm = temp.substring(0, temp.indexOf("-Alola"));
			var regularIndex = pokeNames.indexOf(regularForm);
			pokeNames.splice(regularIndex, 0, temp); //re-inserting it right before non-alolan entry
		}
	}
	var setOptions = [];
	for (var i = 0; i < pokeNames.length; i++) {
		var pokeName = pokeNames[i];
		setOptions.push({
			"pokemon": pokeName,
			"text": pokeName
		});
		if (pokeName in setdexAll) {
			var setNames = Object.keys(setdexAll[pokeName]);
			for (var j = 0; j < setNames.length; j++) {
				var setName = setNames[j];
				setOptions.push({
					"pokemon": pokeName,
					"set": setName,
					"text": pokeName + " (" + setName + ")",
					"id": pokeName + " (" + setName + ")"
				});
			}
		}
		setOptions.push({
			"pokemon": pokeName,
			"set": "Blank Set",
			"text": pokeName + " (Blank Set)",
			"id": pokeName + " (Blank Set)"
		});
	}
	return setOptions;
}

function getSelectOptions(arr, sort, defaultIdx) {
	if (sort) {
		arr.sort();
	}
	var r = "";
	// Zero is of course falsy too, but this is mostly to coerce undefined.
	if (!defaultIdx) {
		defaultIdx = 0;
	}
	for (var i = 0; i < arr.length; i++) {
		if (i === defaultIdx) {
			r += '<option value="' + arr[i] + '" selected="selected">' + arr[i] + "</option>";
		} else {
			r += '<option value="' + arr[i] + '">' + arr[i] + "</option>";
		}
	}
	return r;
}

$(document).ready(function () {
	if (localStorage.getItem("selectedGen") != null) {
		switch (localStorage.getItem("selectedGen") + "") {

		case "3":
			$("#gen3").prop("checked", true);
			$("#gen3").change();
			break;

		case "4":
			$("#gen4").prop("checked", true);
			$("#gen4").change();
			break;

		case "5":
			$("#gen5").prop("checked", true);
			$("#gen5").change();
			break;

		case "6":
			$("#gen6").prop("checked", true);
			$("#gen6").change();
			break;

		case "7":
			$("#gen7").prop("checked", true);
			$("#gen7").change();
			break;

		case "8":
			$("#gen8").prop("checked", true);
			$("#gen8").change();
			break;
				
		case "80": // BDSP
			$("#gen80").prop("checked", true);
			$("#gen80").change();
			break;
				
		case "9":
			$("#gen9").prop("checked", true);
			$("#gen9").change();
			break;

		default:
			$("#gen9").prop("checked", true);
			$("#gen9").change();
		}
	} else {
		$("#gen9").prop("checked", true);
		$("#gen9").change();
	}
	//$(".terrain-trigger").bind("change keyup", getTerrainEffects);
	//$(".calc-trigger").bind("change keyup", calculate);
	$(".set-selector").select2({
		"formatResult": function (object) {
			return object.set ? "&nbsp;&nbsp;&nbsp;" + object.set : "<b>" + object.text + "</b>";
		},
		"query": function (query) {
			var setOptions = getSetOptions();
			var pageSize = 30;
			var results = [];
			for (var i = 0; i < setOptions.length; i++) {
				var pokeName = setOptions[i].pokemon.toUpperCase();
				if (!query.term || pokeName.indexOf(query.term.toUpperCase()) === 0 || pokeName.includes("" + query.term.toUpperCase())) {
					results.push(setOptions[i]);
				}
			}
			query.callback({
				"results": results.slice((query.page - 1) * pageSize, query.page * pageSize),
				"more": results.length >= query.page * pageSize
			});
		},
		"initSelection": function (element, callback) {
			var data = getSetOptions()[1]; // skip over the unselectable first species name and display the name of the first set in the selector
			callback(data);
		}
	});
	$(".move-selector").select2({
		"dropdownAutoWidth": true,
		"matcher": function (term, text) {
			// 2nd condition is for Hidden Power
			return text.toUpperCase().indexOf(term.toUpperCase()) === 0 || text.toUpperCase().includes(" " + term.toUpperCase());
		}
	});
	//$(".set-selector").val(getSetOptions()[1].id); // load the first set after the unselectable species name
	//$(".set-selector").change();
});

var linkExtension = '.html';
