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

function MassPokemon(speciesName, setName) {
	this.name = speciesName;
	var pokemon = pokedex[speciesName];
	this.type1 = pokemon.t1;
	this.type2 = pokemon.t2 && typeof pokemon.t2 !== "undefined" ? pokemon.t2 : "";
	this.rawStats = [];
	this.boosts = [];
	this.stats = [];
	this.evs = [];

	var set = setdex[this.name][setName];
	//this.isGmax = setName.includes("-Gmax") || pokemon.isGmax || set.isGmax;
	this.level = set.level ? set.level : (localStorage.getItem("autolevelGen" + gen) ? parseInt(localStorage.getItem("autolevelGen" + gen)) : 50);

	this.HPEVs = set.evs && typeof set.evs.hp !== "undefined" ? set.evs.hp : 0;
	var autoIVs = gen == 4 ? $("#autoivs-box").val() : $('#autoivs-select').find(":selected").val();
	if (pokemon.bs.hp === 1) {
		this.maxHP = 1;
	} else {
		var HPIVs = set.ivs && typeof set.ivs.hp !== "undefined" ? set.ivs.hp : (autoIVs ? parseInt(autoIVs) : 31);
		// ~~ is used as a faster Math.floor() for positive numbers and fails on negative ones
		this.maxHP = ~~((pokemon.bs.hp * 2 + HPIVs + ~~(this.HPEVs / 4)) * this.level / 100) + this.level + 10;
	}
	this.curHP = this.maxHP;
	this.nature = set.nature;
	for (var i = 0; i < STATS.length; i++) {
		var stat = STATS[i];
		this.boosts[stat] = 0;
		this.evs[stat] = set.evs && typeof set.evs[stat] !== "undefined" ? set.evs[stat] : 0;
		var ivs = set.ivs && typeof set.ivs[stat] !== "undefined" ? set.ivs[stat] : (autoIVs ? parseInt(autoIVs) : 31);
		var natureMods = NATURES[this.nature];
		var nature = natureMods[0] === stat ? 1.1 : natureMods[1] === stat ? 0.9 : 1;
		this.rawStats[stat] = ~~((~~((pokemon.bs[stat] * 2 + ivs + ~~(this.evs[stat] / 4)) * this.level / 100) + 5) * nature);
	}

	this.ability = set.ability && typeof set.ability !== "undefined" ? set.ability :
		pokemon.ab && typeof pokemon.ab !== "undefined" ? pokemon.ab : "";
	this.item = set.item && typeof set.item !== "undefined" && (set.item === "Eviolite" || !(set.item.includes("ite"))) ? set.item : "";
	this.status = "Healthy";
	this.toxicCounter = 0;
	this.moves = [];
	for (var i = 0; i < 4; i++) {
		var moveName = set.moves[i];
		var defaultDetails = moves[moveName] || moves["(No Move)"];
		this.moves.push($.extend({}, defaultDetails, {
			"name": defaultDetails.bp === 0 ? "(No Move)" : moveName,
			"bp": defaultDetails.bp,
			"type": defaultDetails.type,
			"category": defaultDetails.category,
			"isCrit": !!defaultDetails.alwaysCrit,
			"acc": defaultDetails.acc,
			"hits": defaultDetails.maxMultiHits ? (this.ability === "Skill Link" || moveName === "Population Bomb" || moveName === "Triple Axel" ? defaultDetails.maxMultiHits : (this.item === "Loaded Dice" ? 4 : 3)) : defaultDetails.isThreeHit ? 3 : defaultDetails.isTwoHit ? 2 : 1,
			"usedTimes": 1
		}));
	}
	this.baseMoveNames = [this.moves[0].name, this.moves[1].name, this.moves[2].name, this.moves[3].name];
	this.weight = pokemon.w;
	this.tier = set.tier;

	this.hasType = function (type) {
		return this.type1 === type || this.type2 === type;
	};
}

function performCalculations() {
	var attacker, defender, setPoke, setTier;
	var selectedTier = getSelectedTier(); // selectedTier can be: All, threshold, Hall, HallR10, Tower, RS, SM, DM.  *SM and DM are Singles and Doubles Master
	var dataSet = [];
	var userPoke = new Pokemon($("#p1"));
	var startingBoosts = [userPoke.boosts.at, userPoke.boosts.df, userPoke.boosts.sa, userPoke.boosts.sd, userPoke.boosts.sp, userPoke.boosts.ac, userPoke.boosts.es];
	var field = new Field();
	var startingWeather = field.getWeather();
	var counter = 0;
	var setSpecies = Object.keys((gen == 3 && $("#autolevel-box").val() == 50) ? SETDEX_EM : setdex);
	for (var i = 0; i < setSpecies.length; i++) {
		var speciesName = setSpecies[i];
		var setNames = Object.keys(setdex[speciesName]);
		for (var j = 0; j < setNames.length; j++) {
			var setName = setNames[j];
			setPoke = new MassPokemon(speciesName, setName);
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
				attacker = userPoke;
			} else {
				attacker = setPoke;
				defender = userPoke;
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
			var data = [setName];
			for (var n = 0; n < 4; n++) {
				result = damageResults[n];
				attackerMove = attacker.moves[n];
				minDamage = result.damage[0] * attackerMove.hits;
				maxDamage = result.damage[result.damage.length - 1] * attackerMove.hits;
				// If any piece of the calculation is a string and not a number ie. Pokemon.level, stats will concatinate into strings, and the below will eval to 0.
				// I want to be very sure that everything is using the correct types, so I want this behavior. Shoutouts to writing code w/o tests.
				minPercentage = Math.floor(minDamage * 1000 / defender.maxHP) / 10;
				maxPercentage = Math.floor(maxDamage * 1000 / defender.maxHP) / 10;
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
			userPoke.boosts.at = startingBoosts[0];
			userPoke.boosts.df = startingBoosts[1];
			userPoke.boosts.sa = startingBoosts[2];
			userPoke.boosts.sd = startingBoosts[3];
			userPoke.boosts.sp = startingBoosts[4];
			userPoke.boosts.ac = startingBoosts[5];
			userPoke.boosts.es = startingBoosts[6];
			userPoke.stats = [];
			// the only Field object "property" that can be modified is weather
			field.setWeather(startingWeather);
			counter++;
		}
	}
	var pokemon = mode === "one-vs-all" ? attacker : defender;
	table.rows.add(dataSet).draw();
	return counter;
}

function getSelectedTier() {
	return $("input[name=tier]:checked").attr('id'); // assumes exactly one of the the tier buttons is selected
}

var calculateMovesOfAttacker;
$(".gen").change(function () {
	//$(".tiers input").prop("checked", false); // since tiers is a radio button now, don't uncheck it
	adjustTierBorderRadius();
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
	default:
		calculateMovesOfAttacker = CALCULATE_MOVES_OF_ATTACKER_MODERN;
		break;
	}
	if (gen == 8) {
		$("#Tower").prop("checked", true)
	}
	else {
		$("#All").prop("checked", true)
	}
	if ($.fn.DataTable.isDataTable("#holder-2")) {
		table.clear();
		constructDataTable();
		placeBsBtn();
	}
});

function adjustTierBorderRadius() {
	 // Used to round the tier buttons to appear like the gens or mode buttons
	var squaredRightCorner = {"border-top-right-radius": 0, "border-bottom-right-radius": 0};
	var roundedRightCorner = {"border-top-right-radius": "8px", "border-bottom-right-radius": "8px"};
	var squaredLeftCorner = {"border-top-left-radius": 0, "border-bottom-left-radius": 0};
	var roundedLeftCorner = {"border-top-left-radius": "8px", "border-bottom-left-radius": "8px"};
	if (gen == 3) {
		$("#All").next("label").css(squaredRightCorner);
		$("#threshold").next("label").css(roundedRightCorner);
	}
	else if (gen == 4) {
		$("#All").next("label").css(squaredRightCorner);
		$("#threshold").next("label").css(squaredRightCorner);
		$("#HallR10").next("label").css(roundedRightCorner);
	}
	else if (gen == 5) {
		$("#All").next("label").css(squaredRightCorner);
		$("#threshold").next("label").css(roundedRightCorner);
	}
	else if (gen == 6 || gen == 7) {
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

function getFinalSpeedHonk(pokemon) {
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
	if (ability === "Chlorophyll" && weather.indexOf("Sun") > -1 ||
            ability === "Sand Rush" && weather === "Sand" ||
            ability === "Swift Swim" && weather.indexOf("Rain") > -1 ||
            ability === "Slush Rush" && weather.indexOf("Hail") > -1 ||
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
