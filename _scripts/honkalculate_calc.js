$.fn.DataTable.ColVis.prototype._fnDomColumnButton = function (i) {
	var
		that = this,
		column = this.s.dt.aoColumns[i],
		dt = this.s.dt;

	var title = this.s.fnLabel === null ?
		column.sTitle :
		this.s.fnLabel(i, column.sTitle, column.nTh);

	return $(
		'<li ' + (dt.bJUI ? 'class="ui-button ui-state-default"' : '') + '>' +
		'<label>' +
		'<input type="checkbox" />' +
		'<span>' + title + '</span>' +
		'</label>' +
		'</li>'
	)
		.click(function (e) {
			var showHide = !$('input', this).is(":checked");
			if (e.target.nodeName.toLowerCase() !== "li") {
				showHide = !showHide;
			}

			/* Need to consider the case where the initialiser created more than one table - change the
			 * API index that DataTables is using
			 */
			var oldIndex = $.fn.dataTableExt.iApiIndex;
			$.fn.dataTableExt.iApiIndex = that._fnDataTablesApiIndex();

			// Optimisation for server-side processing when scrolling - don't do a full redraw
			if (dt.oFeatures.bServerSide) {
				that.s.dt.oInstance.fnSetColumnVis(i, showHide, false);
				that.s.dt.oInstance.fnAdjustColumnSizing(false);
				if (dt.oScroll.sX !== "" || dt.oScroll.sY !== "") {
					that.s.dt.oInstance.oApi._fnScrollDraw(that.s.dt);
				}
				that._fnDrawCallback();
			} else {
				that.s.dt.oInstance.fnSetColumnVis(i, showHide);
			}

			$.fn.dataTableExt.iApiIndex = oldIndex; /* Restore */

			if ((e.target.nodeName.toLowerCase() === 'input' || e.target.nodeName.toLowerCase() === 'li') && that.s.fnStateChange !== null) {
				that.s.fnStateChange.call(that, i, showHide);
			}
		})[0];
};

$.fn.dataTableExt.oSort['damage100-asc'] = function (a, b) {
	return parseFloat(a) - parseFloat(b);
};
$.fn.dataTableExt.oSort['damage100-desc'] = function (a, b) {
	return parseFloat(b) - parseFloat(a);
};

$.fn.dataTableExt.oSort['damage48-asc'] = function (a, b) {
	return parseInt(a) - parseInt(b);
};
$.fn.dataTableExt.oSort['damage48-desc'] = function (a, b) {
	return parseInt(b) - parseInt(a);
};

function MassPokemon(speciesName, setName, autoLevel) {
	let pokemon = pokedex[speciesName];
	let set = setdex[speciesName][setName];
	let massPoke = {
		"name": speciesName,
		"setName": setName,
		"type1": pokemon.t1,
		"type2": pokemon.t2 && typeof pokemon.t2 !== "undefined" ? pokemon.t2 : "",
		"rawStats": [],
		"boosts": [],
		"stats": [],
		"evs": [],
		"level": set.level ? set.level : (autoLevel ? autoLevel : 50),
		"HPEVs": set.evs && typeof set.evs.hp !== "undefined" ? set.evs.hp : 0,
		"nature": set.nature,
		"ability": set.ability && typeof set.ability !== "undefined" ? set.ability :
		(pokemon.ab && typeof pokemon.ab !== "undefined" ? pokemon.ab : ""),
		"item": set.item && typeof set.item !== "undefined" && (set.item === "Eviolite" || !set.item.endsWith("ite")) ? set.item : "",
		"status": "Healthy",
		"toxicCounter": 0,
		"moves": [],
		//"baseMoveNames" goes unused by MassPokemon
		"weight": pokemon.w,
		"tier": set.tier,
		"hasType": function (type) { return this.type1 === type || this.type2 === type; },
		"revertStats": function () {
			Object.keys(this.boosts).forEach(stat => { this.boosts[stat] = 0; });
			this.stats = [];
		}
	};
	// maxHP
	let autoIVs = gen == 4 ? parseInt($("#autoivs-box").val()) : (gen <= 7 ? parseInt($('#autoivs-select').find(":selected").val()) : 31);
	if (pokemon.bs.hp === 1) {
		massPoke.maxHP = 1;
	} else {
		let HPIVs = set.ivs && typeof set.ivs.hp !== "undefined" ? set.ivs.hp : autoIVs;
		// ~~ is used as a faster Math.floor() for positive numbers
		massPoke.maxHP = ~~((pokemon.bs.hp * 2 + HPIVs + ~~(massPoke.HPEVs / 4)) * massPoke.level / 100) + massPoke.level + 10;
	}
	// curHP
	massPoke.curHP = massPoke.maxHP;
	// stats
	for (let n = 0; n < STATS.length; n++) {
		let stat = STATS[n];
		massPoke.boosts[stat] = 0;
		massPoke.evs[stat] = set.evs && typeof set.evs[stat] !== "undefined" ? set.evs[stat] : 0;
		let ivs = set.ivs && typeof set.ivs[stat] !== "undefined" ? set.ivs[stat] : autoIVs;
		let natureMods = NATURES[massPoke.nature];
		let nature = natureMods[0] === stat ? 1.1 : natureMods[1] === stat ? 0.9 : 1;
		massPoke.rawStats[stat] = ~~((~~((pokemon.bs[stat] * 2 + ivs + ~~(massPoke.evs[stat] / 4)) * massPoke.level / 100) + 5) * nature);
	}
	// moves
	for (let n = 0; n < 4; n++) {
		let moveName = set.moves[n];
		let defaultDetails = moves[moveName] || moves["(No Move)"];
		massPoke.moves.push($.extend({}, defaultDetails, {
			"name": defaultDetails.bp === 0 ? "(No Move)" : moveName,
			"bp": defaultDetails.bp,
			"type": defaultDetails.type,
			"category": defaultDetails.category,
			"isCrit": !!defaultDetails.alwaysCrit,
			"acc": defaultDetails.acc,
			"hits": defaultDetails.maxMultiHits ? (massPoke.ability === "Skill Link" || moveName === "Population Bomb" || moveName === "Triple Axel" ? defaultDetails.maxMultiHits : (massPoke.item === "Loaded Dice" ? 4 : 3)) : defaultDetails.isThreeHit ? 3 : defaultDetails.isTwoHit ? 2 : 1,
			"usedTimes": 1
		}));
	}

	return massPoke;
}

function performCalculations() {
	var attacker, defender, setPoke, setTier;
	var selectedTier = getSelectedTier(); // selectedTier can be: All, threshold, Hall, HallR10, Tower, RS, SM, DM.  *SM and DM are Singles and Doubles Master
	var dataSet = [];
	var userPoke = new Pokemon($("#p1"));
	userPoke.startingBoosts = [];
	STATS.forEach(stat => { userPoke.startingBoosts[stat] = userPoke.boosts[stat]; });
	userPoke.revertStats = function () {
		Object.keys(this.boosts).forEach(stat => { this.boosts[stat] = this.startingBoosts[stat] });
		this.stats = [];
	};
	if (mode === "one-vs-all") {
		attacker = userPoke;
	} else {
		defender = userPoke;
	}
	var field = new Field();
	var startingWeather = field.getWeather();
	var counter = 0;
	for (let i = 0; i < setsArray.length; i++) {
		setPoke = setsArray[i];
		setTier = setPoke.tier; // setPoke.tier can be: 50, Hall, HallR10, 28, 40, Tower, RS, SM, DM, SMDM. A set might not have a tier key.
		if (gen == 4 && selectedTier === "All" && setTier && setTier.indexOf("Hall") != -1) {
			continue;
		} else if (selectedTier === "All" || (setTier && setTier.indexOf(selectedTier) != -1) || (selectedTier == "threshold" && parseInt(setTier))) {
			// let set be calculated
		} else {
			continue;
		}

		if (mode === "one-vs-all") {
			defender = setPoke;
		} else {
			attacker = setPoke;
		}
		if (attacker.ability === "Rivalry") {
			attacker.gender = "N";
		}
		if (defender.ability === "Rivalry") {
			defender.gender = "N";
		}
		var damageResults = calculateMovesOfAttacker(attacker, defender, field);
		var result, minDamage, maxDamage, minPercentage, maxPercentage, minPixels, maxPixels;
		var highestDamage = -1;
		var data = [setPoke.setName];
		for (let n = 0; n < 4; n++) {
			result = damageResults[n];
			attackerMove = attacker.moves[n];
			minDamage = result.damage[0] * (attackerMove.name === "Triple Axel" ? 1 : attackerMove.hits); // Triple Axel already handles its extra hit(s) in the damage script
			maxDamage = result.damage[result.damage.length - 1] * (attackerMove.name === "Triple Axel" ? 1 : attackerMove.hits);
			// If any piece of the calculation is a string and not a number ie. Pokemon.level, stats will concatinate into strings, and the below will eval to 0.
			// I want to be very sure that everything is using the correct types, so I want this behavior. Shoutouts to writing code w/o tests.
			minPercentage = Math.round(minDamage * 1000 / defender.maxHP) / 10;
			maxPercentage = Math.round(maxDamage * 1000 / defender.maxHP) / 10;
			minPixels = Math.floor(minDamage * 48 / defender.maxHP);
			maxPixels = Math.floor(maxDamage * 48 / defender.maxHP);
			if (maxDamage > highestDamage) {
				highestDamage = maxDamage;
				while (data.length > 1) {
					data.pop();
				}
				data.push(attackerMove.name.replace("Hidden Power", "HP"));
				data.push(minPercentage + " - " + maxPercentage + "%");
				data.push(minPixels + " - " + maxPixels + "px");
				data.push(attackerMove.bp === 0 ? "nice move" :
					getKOChanceText(result.damage, attackerMove, defender, field.getSide(~~(mode === "one-vs-all")), false, attacker, false, attacker.isVictoryStar, gen, false));
			}
		}
		data.push((mode === "one-vs-all") ? defender.type1 : attacker.type1);
		data.push(((mode === "one-vs-all") ? defender.type2 : attacker.type2) || "");
		data.push(((mode === "one-vs-all") ? defender.ability : attacker.ability) || "");
		data.push(((mode === "one-vs-all") ? defender.item : attacker.item) || "");
		dataSet.push(data);

		// fields in the boosts and stats objects should be the only things that get changed in the Pokemon object during mass calc
		attacker.revertStats();
		defender.revertStats();
		// the only Field object "property" that can be modified is weather
		field.setWeather(startingWeather);
		counter++;
	}
	var pokemon = mode === "one-vs-all" ? attacker : defender;
	table.rows.add(dataSet).draw();
	return counter;
}

function getSelectedTier() {
	return $("input[name=tier]:checked").attr('id'); // assumes exactly one of the the tier buttons is selected
}

var calculateMovesOfAttacker;
var setsArray;
$(".gen").change(function () {
	//$(".tiers input").prop("checked", false); // since tiers is a radio button now, don't uncheck it
	adjustTierBorderRadius();
	let defaultChecked = "#All";
	switch (gen) {
	case 3:
		calculateMovesOfAttacker = CALCULATE_MOVES_OF_ATTACKER_ADV;
		$("#threshold").next("label").text("50+");
		break;
	case 4:
		calculateMovesOfAttacker = CALCULATE_MOVES_OF_ATTACKER_PTHGSS;
		$("#threshold").next("label").text("50+");
		break;
	case 5:
		calculateMovesOfAttacker = CALCULATE_MOVES_OF_ATTACKER_MODERN;
		$("#threshold").next("label").text("28+");
		break;
	case 6:
		calculateMovesOfAttacker = CALCULATE_MOVES_OF_ATTACKER_MODERN;
		$("#threshold").next("label").text("40+");
		break;
	case 7:
		calculateMovesOfAttacker = CALCULATE_MOVES_OF_ATTACKER_MODERN;
		$("#threshold").next("label").text("40+");
		break;
	case 8:
		calculateMovesOfAttacker = CALCULATE_MOVES_OF_ATTACKER_MODERN;
		defaultChecked = "#Tower";
		break;
	case 80:
	case 9:
	default:
		calculateMovesOfAttacker = CALCULATE_MOVES_OF_ATTACKER_MODERN;
		break;
	}
	$(defaultChecked).prop("checked", true);
	if ($.fn.DataTable.isDataTable("#holder-2")) {
		table.clear();
		constructDataTable();
		placeBsBtn();
	}

	// set up the list of MassPokemon
	let autoLevel = parseInt(localStorage.getItem("autolevelGen" + gen));
	let setSpecies = Object.keys(gen == 3 && $("#autolevel-box").val() == 50 ? SETDEX_EM : setdex);
	setsArray = [];
	for (let i = 0; i < setSpecies.length; i++) {
		let speciesName = setSpecies[i];
		let setNames = Object.keys(setdex[speciesName]);
		for (let j = 0; j < setNames.length; j++) {
			let setName = setNames[j];
			setsArray.push(MassPokemon(speciesName, setName, autoLevel));
		}
	}
});

function adjustTierBorderRadius() {
	 // Used to round the tier buttons to appear like the gens or mode buttons
	var squaredRightCorner = {"border-top-right-radius": 0, "border-bottom-right-radius": 0};
	var roundedRightCorner = {"border-top-right-radius": "8px", "border-bottom-right-radius": "8px"};
	var squaredLeftCorner = {"border-top-left-radius": 0, "border-bottom-left-radius": 0};
	var roundedLeftCorner = {"border-top-left-radius": "8px", "border-bottom-left-radius": "8px"};
	if (gen == 4) {
		$("#All").next("label").css(squaredRightCorner);
		$("#threshold").next("label").css(squaredRightCorner);
		$("#HallR10").next("label").css(roundedRightCorner);
	}
	else if (gen == 3 || gen == 5 || gen == 6 || gen == 7) {
		$("#All").next("label").css(squaredRightCorner);
		$("#threshold").next("label").css(roundedRightCorner);
	}
	else if (gen == 8) {
		$("#Tower").next("label").css(roundedLeftCorner);
		$("#RS").next("label").css(roundedRightCorner);
	}
	else if (gen == 80) {
		$("#All").next("label").css(squaredRightCorner);
		$("#DM").next("label").css(roundedRightCorner);
	}
	else {
		$("#All").next("label").css(roundedRightCorner);
	}
}

var table;
function constructDataTable() {
	table = $("#holder-2").DataTable({
		destroy: true,
		columnDefs: [
			{
				targets: [3, 5, 6, 7, 8],
				visible: false,
				searchable: false
			},
			{
				targets: [2],
				type: 'damage100'
			},
			{
				targets: [3],
				type: 'damage48'
			},
			{targets: [4],
				iDataSort: 2
			}
		],
		dom: 'frti',
		colVis: {
			exclude: (gen > 2) ? [0, 1, 2] : (gen === 2) ? [0, 1, 2, 7] : [0, 1, 2, 7, 8],
			stateChange: function (iColumn, bVisible) {
				var column = table.settings()[0].aoColumns[iColumn];
				if (column.bSearchable !== bVisible) {
					column.bSearchable = bVisible;
					table.rows().invalidate();
				}
			}
		},
		paging: false,
		scrollX: Math.floor(dtWidth / 100) * 100, // round down to nearest hundred
		scrollY: dtHeight,
		scrollCollapse: true
	});
	$(".dataTables_wrapper").css({"max-width": dtWidth});
}

function placeBsBtn() {
	var honkalculator = "<button id='honkalculate' style='position:relative;margin-top:7px;font-size:larger' class='btn btn-fit'>Mass Calc</button>";
	$("#holder-2_wrapper").prepend(honkalculator);
	$("#honkalculate").click(function () {
		table.clear();
		var startTime = performance.now();
		var setCount = performCalculations();
		var endTime = performance.now();
		console.log("honkalculated " + setCount + " sets in " + Math.round(endTime - startTime) + "ms");
	});
}

/*$(".mode").change(function () {
	if ($("#one-vs-one").prop("checked")) {
		var params = new URLSearchParams(window.location.search);
		params.delete('mode');
		params = '' + params;
		window.location.replace();
	}
 	else {
		var params = new URLSearchParams(window.location.search);
		params.set('mode', $(this).attr("id"));
		window.location.replace('honkalculate' + linkExtension + '?' + params);
	}
});*/

$(".mode").change(function () {
	if ($("#one-vs-one").prop("checked")) {
		window.location.href = "/";
	} else {
		window.location.replace('honkalculate' + linkExtension + '?mode=' + $(this).attr("id"));
	}
});

$(".tiers label").mouseup(function () {
	var oldID = $('.tiers input:checked').attr("id");
	var newID = $(this).attr("for");
	/*if ((oldID === "Doubles" || startsWith(oldID, "VGC")) && (newID !== oldID)) {
		$("#singles-format").attr("disabled", false);
		$("#singles-format").prop("checked", true);
	}
	if ((startsWith(oldID, "VGC") || oldID === "LC") && (!startsWith(newID, "VGC") && newID !== "LC")) {
		setLevel("100");
	}*/
});

$(".tiers input").change(function () {
	var type = $(this).attr("type");
	var id = $(this).attr("id");
	//$(".tiers input").not(":" + type).prop("checked", false); // deselect all radios if a checkbox is checked, and vice-versa
});

function setLevel(lvl) {
	$('.level').val(lvl);
	$('.level').keyup();
	$('.level').popover({
		content: "Level has been set to " + lvl,
		placement: "right"
	}).popover('show');
	setTimeout(function () { $('.level').popover('destroy'); }, 1350);
}

$(".set-selector").change(function (e) {
	var genWasChanged;
	var format = getSelectedTier();
	if (genWasChanged) {
		genWasChanged = false;
	}
});

function calcDTDimensions() {
	$("#holder-2").DataTable({
		dom: 'frti'
	});

	var theadBottomOffset = getBottomOffset($(".sorting"));
	var heightUnderDT = getBottomOffset($(".holder-0")) - getBottomOffset($("#holder-2 tbody"));
	dtHeight = $(document).height() - theadBottomOffset - heightUnderDT;
}

function getBottomOffset(obj) {
	return obj.offset().top + obj.outerHeight();
}

function getFinalSpeedHonk() {
	var speed = getModifiedStat($(".sp .total").text(), $(".sp .boost").val());
	var item = $(".item").val();
	var ability = $(".ability").val();
	var weather = $("input[name=weather]:checked").attr('value');
	var terrain = $("input[name=terrain]:checked").attr('value');
	if ((ability === "Protosynthesis" && (item === "Booster Energy" || weather.indexOf("Sun") > -1)) ||
		(ability === "Quark Drive" && (item === "Booster Energy" || terrain === "Electric"))) {
		if (speed > getModifiedStat($(".at .total").text(), $(".at .boost").val()) && speed > getModifiedStat($(".df .total").text(), $(".df .boost").val()) &&
			speed > getModifiedStat($(".sa .total").text(), $(".sa .boost").val()) && speed > getModifiedStat($(".sd .total").text(), $(".sd .boost").val())) {
			speed = Math.floor(speed * 1.5);
		}
	}
	if (item === "Choice Scarf") {
		speed = Math.floor(speed * 1.5);
	} else if (item === "Macho Brace" || item === "Iron Ball") {
		speed = Math.floor(speed / 2);
	}
	if (ability === "Chlorophyll" && weather.indexOf("Sun") > -1 && item !== "Utility Umbrella" ||
		ability === "Sand Rush" && weather === "Sand" ||
		ability === "Swift Swim" && weather.indexOf("Rain") > -1 && item !== "Utility Umbrella" ||
		ability === "Slush Rush" && (weather.indexOf("Hail") > -1 || weather === "Snow") ||
		ability === "Surge Surfer" && terrain === "Electric") {
		speed *= 2;
	}
	$(".totalMod").text(speed);
}

var dtHeight, dtWidth;
$(document).ready(function () {
	var params = new URLSearchParams(window.location.search);
	window.mode = params.get("mode");
	if (window.mode) {
		if (window.mode === "one-vs-one") {
			window.location.replace("");
		}
		else if (window.mode !== "one-vs-all" && window.mode !== "all-vs-one") {
			window.mode = "one-vs-all";
			window.location.replace("honkalculate" + linkExtension + "?mode=" + window.mode);
		}
	} else {
		window.mode = "one-vs-all";
	}
	$("#" + mode).prop("checked", true);

	$("#holder-2 th:first").text((mode === "one-vs-all") ? "Defender" : "Attacker");
	$("#holder-2").show();

	calcDTDimensions();
	constructDataTable();
	placeBsBtn();

	$(".calc-trigger").bind("change keyup", getFinalSpeedHonk);
	getFinalSpeedHonk();
});
