$("#p1 .ability").bind("keyup change", function () {
	autoSetCrits($("#p1"), 1);
});

$("#p1 .status").bind("keyup change", function () {
	autoSetCrits($("#p2"), 2);
});

$("#p2 .ability").bind("keyup change", function () {
	autosetWeather($(this).val(), 1);
	autoSetVicStar(2, "R");
	autoSetSteely(2, "R");
	autoSetRuin(2, "R");
	autoSetCrits($("#p2"), 2);
});

$("#p2 .item").bind("keyup change", function () {
	autosetStatus("#p2", $(this).val());
	autoSetMultiHits($("#p2"));
});

$("#p2 .status").bind("keyup change", function () {
	autoSetCrits($("#p1"), 1);
});

$("#maxR").change(function () {
	if (this.checked) {
		for (var i = 0; i < 4; i++) {
			$("#maxR" + (i + 1)).prop("checked", true);
		}
	} else {
		for (var i = 0; i < 4; i++) {
			$("#maxR" + (i + 1)).prop("checked", false);
		}
	}
});

function autoSetCrits(pokeInfo, i) {
	let merciless = pokeInfo.find(".ability").val() === "Merciless" && $("#p" + (i === 1 ? "2" : "1")).find(".status").val().includes("Poisoned");
	for (let i = 1; i <= 4; i++) {
		let moveInfo = pokeInfo.find(".move" + i);
		let moveName = moveInfo.find("select.move-selector").val();
		let move = moves[moveName] || moves["(No Move)"];
		moveInfo.children(".move-crit").prop("checked", move.alwaysCrit || (merciless && move.category));
	}
}

var resultLocations = [[], []];
for (var i = 0; i < 4; i++) {
	resultLocations[0].push({
		"move": "#resultMoveL" + (i + 1),
		"damage": "#resultDamageL" + (i + 1)
	});
	resultLocations[1].push({
		"move": "#resultMoveR" + (i + 1),
		"damage": "#resultDamageR" + (i + 1)
	});
}

var damageResults;
function calculate() {
	var p1info = $("#p1");
	var p2info = $("#p2");
	var p1 = new Pokemon(p1info);
	var p2 = new Pokemon(p2info);
	var field = new Field();
	//optimizeEVs("#p1", p1);
	//optimizeEVs("#p2", p2);
	damageResults = calculateAllMoves(p1, p2, field);
	p1info.find(".sp .totalMod").text(p1.stats.sp);
	p2info.find(".sp .totalMod").text(p2.stats.sp);
	// Removed the auto-select highest damage since it's rarely useful for facilities (or any format?)
	//var highestMaxPercent = -1;
	//var bestResult = $(resultLocations[0][0].move);
	let p1Move, p2Move;
	for (var i = 0; i < 4; i++) {
		setDamageText(damageResults[0][i], p1, p2, p1.moves[i], field.getSide(0), resultLocations[0][i]);
		setDamageText(damageResults[1][i], p2, p1, p2.moves[i], field.getSide(1), resultLocations[1][i]);
	}
	/*if ($(".locked-move").length) {
		bestResult = $(".locked-move");
	} else {
		stickyMoves.setSelectedMove(bestResult.prop("id"));
	}
	bestResult.prop("checked", true);
	bestResult.change();*/
	$("#resultHeaderL").text(p1.name + "'s Moves (select one to show detailed results)");
	$("#resultHeaderR").text(p2.name + "'s Moves (select one to show detailed results)");
	updateDamageText($("input:radio[name='resultMove']:checked"));
}

$(".result-move").change(function () {
	updateDamageText($(this));
});

function setDamageText(result, attacker, defender, move, fieldSide, resultLocation) {
	let minDamage = result.damage[0] * (move.name === "Triple Axel" ? 1 : move.hits);
	let maxDamage = result.damage[result.damage.length - 1] * (move.name === "Triple Axel" ? 1 : move.hits);
	let minPercent = Math.round(minDamage * 1000 / defender.maxHP) / 10;
	let maxPercent = Math.round(maxDamage * 1000 / defender.maxHP) / 10;
	result.damageText = minDamage + "-" + maxDamage + " (" + minPercent + " - " + maxPercent + "%)";
	if (move.bp === 0) {
		result.koChanceText = "nice move";
	} else if (move.isMLG) {
		result.koChanceText = "<a href = 'https://www.youtube.com/watch?v=iD92h-M474g'>it's a one-hit KO!</a>";
	} else {
		setKOChanceText(result, move, attacker, defender, fieldSide);
	}
	setupRecoilRecoveryText(result, attacker, defender, move, minDamage, maxDamage);
	let recoilRecovery = "";
	// intentionally does not display both recoil and recovery text on the same line
	if (result.recoilPercent) {
		recoilRecovery = " (" + result.recoilPercent + "% " + result.recoilType + " damage)";
	} else if (result.recoveryPercent) {
		recoilRecovery = " (recovers " + result.recoveryPercent + "%)";
	}
	$(resultLocation.move + " + label").text(move.name.replace("Hidden Power", "HP"));
	$(resultLocation.damage).text(minPercent + " - " + maxPercent + "%" + recoilRecovery);
	/*if (maxPercent > highestMaxPercent) {
		highestMaxPercent = maxPercent;
		bestResult = $(resultLocations[1][i].move);
	}*/
}

function setupRecoilRecoveryText(result, attacker, defender, move, minDamage, maxDamage) {
	let minRecoilDamage, maxRecoilDamage;
	let atkMaxHP = attacker.maxHP;
	let defCurHP = defender.curHP;
	let defMaxHP = defender.maxHP;
	if (typeof move.hasRecoil === "number") {
		// percentage-based recoil and healing use normal rounding for their final value.
		result.recoilType = "recoil";
		// Parental Bond adds the damage values into a total and then applies the recoil value, so this is fine
		minRecoilDamage = Math.round(Math.min(minDamage, defCurHP) * move.hasRecoil);
		maxRecoilDamage = Math.round(Math.min(maxDamage, defCurHP) * move.hasRecoil);
		result.recoilRange = minRecoilDamage;
		result.recoilPercent = Math.round(minRecoilDamage * 1000 / atkMaxHP) / 10;
		if (minRecoilDamage != maxRecoilDamage) {
			result.recoilRange += "-" + maxRecoilDamage;
			result.recoilPercent += " - " + (Math.round(maxRecoilDamage * 1000 / atkMaxHP) / 10);
		}
	} else if (move.hasRecoil === "crash") {
		result.recoilType = "potential crash";
		if (gen == 3) {
			minRecoilDamage = Math.floor(Math.min(minDamage, defCurHP) / 2);
			maxRecoilDamage = Math.floor(Math.min(maxDamage, defCurHP) / 2);
			result.recoilRange = minRecoilDamage;
			result.recoilPercent = Math.round(minRecoilDamage * 1000 / atkMaxHP) / 10;
			if (minRecoilDamage != maxRecoilDamage) {
				result.recoilRange += "-" + maxRecoilDamage;
				result.recoilPercent += " - " + (Math.round(maxRecoilDamage * 1000 / atkMaxHP) / 10);
			}
		} else {
			minRecoilDamage = Math.floor((gen == 4 ? defMaxHP : atkMaxHP) / 2);
			result.recoilRange = minRecoilDamage;
			result.recoilPercent = gen == 4 ? (Math.round(minRecoilDamage * 1000 / atkMaxHP) / 10) : 50;
		}
	} else if (move.hasRecoil === "Struggle") {
		result.recoilType = move.hasRecoil;
		result.recoilRange = gen == 4 ? Math.floor(atkMaxHP / 4) : Math.round(atkMaxHP / 4);
		result.recoilPercent = 25;
	} else if (move.hasRecoil) {
		result.recoilType = "recoil";
		result.recoilRange = Math.ceil(atkMaxHP / 2);
		result.recoilPercent = 50;
	}

	let minHealthRecovered = 0;
	let maxHealthRecovered = 0;
	if (move.percentHealed) {
		let healingMultiplier = move.percentHealed * (attacker.item === "Big Root" ? 1.3 : 1);
		if (result.childDamage) {
			// unnecessarily messy solution just to account for Parental Bond healing after each hit
			let minParentDamage = result.parentDamage[0];
			let maxParentDamage = result.parentDamage[result.parentDamage.length - 1];
			let minChildDamage = result.childDamage[0];
			let maxChildDamage = result.childDamage[result.childDamage.length - 1];
			// get min recovery
			if (maxParentDamage >= defCurHP) {
				// edge case where the parent hit can fully KO the defender
				minHealthRecovered = Math.round(defCurHP * healingMultiplier);
			} else {
				minHealthRecovered = Math.round(minParentDamage * healingMultiplier) + Math.round(Math.min(minChildDamage, defCurHP - minParentDamage) * healingMultiplier);
			}
			// get max recovery
			if (defCurHP % 2 == 1) {
				maxHealthRecovered = Math.round(Math.min(maxParentDamage, defCurHP) * healingMultiplier);
				if (maxParentDamage < defCurHP) {
					maxHealthRecovered = Math.round(Math.min(maxChildDamage, defCurHP - maxParentDamage) * healingMultiplier);
				}
			} else if (maxParentDamage >= defCurHP) {
				maxHealthRecovered = Math.round(defCurHP * healingMultiplier);
				for (let i = result.parentDamage.length - 1; i >= 0; i--) {
					if (result.parentDamage[i] == defCurHP - 1) {
						maxHealthRecovered++;
						break;
					}
				}
			} else {
				// edge case where hitting optimal damage rolls to KO an even-HP defender maximizes recovery due to recovery values using normal rounding
				let i = result.parentDamage.length - 1;
				let highestOddParent = result.parentDamage[i];
				for (i--; highestOddParent % 2 == 0 && i >= 0; i--) {
					highestOddParent = result.parentDamage[i];
				}
				i = result.childDamage.length - 1;
				let highestOddChild = result.childDamage[i];
				for (i--; highestOddChild % 2 == 0 && i >= 0; i--) {
					highestOddChild = result.childDamage[i];
				}

				if (highestOddParent + highestOddChild >= defCurHP) {
					maxHealthRecovered = Math.round(defCurHP * healingMultiplier) + 1;
				} else {
					maxHealthRecovered = Math.round(Math.min(maxParentDamage, defCurHP) * healingMultiplier) +
					Math.round(Math.min(maxChildDamage, defCurHP - maxParentDamage) * healingMultiplier);
				}
			}
		} else {
			minHealthRecovered = Math.round(Math.min(minDamage, defCurHP) * healingMultiplier);
			maxHealthRecovered = Math.round(Math.min(maxDamage, defCurHP) * healingMultiplier);
		}

		if (defender.ability === "Liquid Ooze") {
			result.recoilType = defender.ability;
			result.recoilRange = minHealthRecovered;
			result.recoilPercent = Math.round(minHealthRecovered * 1000 / atkMaxHP) / 10;
			if (minHealthRecovered != maxHealthRecovered) {
				result.recoilRange += "-" + maxHealthRecovered;
				result.recoilPercent += " - " + (Math.round(maxHealthRecovered * 1000 / atkMaxHP) / 10);
			}
			minHealthRecovered = 0;
			maxHealthRecovered = 0;
		}
	}
	if ((attacker.item === "Shell Bell" && !["Future Sight", "Doom Desire"].includes(move.name)) ||
		(gen == 3 && defender.item === "Shell Bell" && attacker.item === "" && ["Thief", "Covet"].includes(move.name))) {
		minHealthRecovered += Math.floor(Math.min(minDamage, defCurHP) / 8);
		maxHealthRecovered += Math.floor(Math.min(maxDamage, defCurHP) / 8);
	}
	if (minHealthRecovered) {
		result.recoveryRange = minHealthRecovered;
		result.recoveryPercent = Math.round(minHealthRecovered * 1000 / atkMaxHP) / 10;
		if (minHealthRecovered != maxHealthRecovered) {
			result.recoveryRange += "-" + maxHealthRecovered;
			result.recoveryPercent += " - " + Math.round(maxHealthRecovered * 1000 / atkMaxHP) / 10;
		}
	}
}

var mainResult = "";
function updateDamageText(resultMoveObj) {
	if (damageResults) {
		var result = findDamageResult(resultMoveObj);
		if (result) {
			let recoilText = result.recoilRange ? ("; " + result.recoilType + " damage: " + result.recoilRange + " (" + result.recoilPercent + "%)") : "";
			let recoveryText = result.recoveryRange ? ("; recovers " + result.recoveryRange + " (" + result.recoveryPercent + "%)") : "";
			mainResult = result.description + ": " + result.damageText + recoilText + recoveryText +
				" -- " + result.koChanceText + (result.afterText ? result.afterText : "");
			$("#mainResult").html(mainResult);
			$("#afterAcc").html(result.afterAccText ? result.afterAccText : "");
			if (result.parentDamage) {
				$("#damageValues").text("(First hit: " + result.parentDamage.join(", ") +
                    "; Second hit: " + result.childDamage.join(", ") + ")");
			} else {
				$("#damageValues").text("(" + result.damage.join(", ") + ")");
			}
		}
	}
}

// Click-to-copy function (thanks DimK19, this is an excellent idea)
$("#mainResult").click(function () {
	navigator.clipboard.writeText(mainResult);
});

function findDamageResult(resultMoveObj) {
	var selector = "#" + resultMoveObj.attr("id");
	for (var i = 0; i < resultLocations.length; i++) {
		for (var j = 0; j < resultLocations[i].length; j++) {
			if (resultLocations[i][j].move === selector) {
				return damageResults[i][j];
			}
		}
	}
}

$(".mode").change(function () {
	window.location.replace('honkalculate' + linkExtension + '?mode=' + $(this).attr("id"));
});

$(document).ready(function () {
	$(".calc-trigger").bind("change keyup", calculate);
	calculate();
});

/******************/
/*  EV OPTIMIZER  */
/******************/

/*function optimizeEVs(side, mon) {
	//log(mon.rawStats)
	var basehp = ~~$(side).find(".hp .base").val();
	var baseat = ~~$(side).find(".at .base").val();
	var basedf = ~~$(side).find(".df .base").val();
	var basesa = ~~$(side).find(".sa .base").val();
	var basesd = ~~$(side).find(".sd .base").val();
	var basesp = ~~$(side).find(".sp .base").val();
	var ivshp = ~~$(side).find(".hp .ivs").val();
	var ivsat = ~~$(side).find(".at .ivs").val();
	var ivsdf = ~~$(side).find(".df .ivs").val();
	var ivssa = ~~$(side).find(".sa .ivs").val();
	var ivssd = ~~$(side).find(".sd .ivs").val();
	var ivssp = ~~$(side).find(".sp .ivs").val();
	var evshp = ~~$(side).find(".hp .evs").val();
	var evsat = ~~$(side).find(".at .evs").val();
	var evsdf = ~~$(side).find(".df .evs").val();
	var evssa = ~~$(side).find(".sa .evs").val();
	var evssd = ~~$(side).find(".sd .evs").val();
	var evssp = ~~$(side).find(".sp .evs").val();
	var nature = NATURES[mon.nature];
	var level = ~~mon.level;
	var natureVals = ["1", "1", "1", "1", "1"];
	console.log(nature)
	var hp0 = Math.floor((basehp * 2 + ivshp + Math.floor(evshp / 4)) * level / 100) + level + 10;
	var at0 = Math.floor((Math.floor((baseat * 2 + ivsat + Math.floor(evsat / 4)) * level / 100) + 5) * natureVals[0]);
	var df0 = Math.floor((Math.floor((basedf * 2 + ivsdf + Math.floor(evsdf / 4)) * level / 100) + 5) * natureVals[1]);
	var sa0 = Math.floor((Math.floor((basesa * 2 + ivssa + Math.floor(evssa / 4)) * level / 100) + 5) * natureVals[2]);
	var sd0 = Math.floor((Math.floor((basesd * 2 + ivssd + Math.floor(evssd / 4)) * level / 100) + 5) * natureVals[3]);
	var sp0 = Math.floor((Math.floor((basesp * 2 + ivssp + Math.floor(evssp / 4)) * level / 100) + 5) * natureVals[4]);
	switch (nature[0]) {
		case "at":
		natureVals[0] = 1.1;
		break;
		case "df":
		natureVals[1] = 1.1;
		break;
	}
	console.log(hp);
	console.log(at);
	console.log(df);
	console.log(sa);
	console.log(sd);
	console.log(sp);
}*/