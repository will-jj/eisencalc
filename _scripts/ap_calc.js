$("#p2 .ability").bind("keyup change", function () {
	autosetWeather($(this).val(), 1);
	autoSetVicStar(2, "R");
	autoSetSteely(2, "R");
	autoSetRuin(2, "R");
});

$("#p2 .item").bind("keyup change", function () {
	autosetStatus("#p2", $(this).val());
});

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
	var p1 = new Pokemon($("#p1"));
	var p2 = new Pokemon($("#p2"));
	var field = new Field();
	//optimizeEVs("#p1", p1);
	//optimizeEVs("#p2", p2);
	damageResults = calculateAllMoves(p1, p2, field);
	p1info.find(".sp .totalMod").text(p1.stats.sp);
	p2info.find(".sp .totalMod").text(p2.stats.sp);
	var result, minDamage, maxDamage, minPercent, maxPercent, percentText;
	// Removed the auto-select highest damage since it's rarely useful for facilities (or any format?)
	//var highestMaxPercent = -1;
	//var bestResult = $(resultLocations[0][0].move);
	for (var i = 0; i < 4; i++) {
		result = damageResults[0][i];
		minDamage = result.damage[0] * p1.moves[i].hits;
		maxDamage = result.damage[result.damage.length - 1] * p1.moves[i].hits;
		minPercent = Math.floor(minDamage * 1000 / p2.maxHP) / 10;
		maxPercent = Math.floor(maxDamage * 1000 / p2.maxHP) / 10;
		result.damageText = minDamage + "-" + maxDamage + " (" + minPercent + " - " + maxPercent + "%)";
		result.koChanceText = p1.moves[i].bp === 0 ? "nice move" :
			getKOChanceText(result.damage, p1.moves[i], p2, field.getSide(1), p1.ability === "Bad Dreams", p1, p2.isMinimized, p1.isVictoryStar, gen, true);
		if (p1.moves[i].isMLG && p1.level >= p2.level) {
			result.koChanceText = "<a href = 'https://www.youtube.com/watch?v=iD92h-M474g'>it's a one-hit KO!</a>"; //dank memes
		}
		var recoveryText = "";
		if (p1.moves[i].givesHealth) {
			var minHealthRecovered = "%" === "%" ? Math.floor(minDamage * p1.moves[i].percentHealed * 1000 / p1.maxHP) /
                10 : Math.floor(minDamage * p1.moves[i].percentHealed * 48 / p1.maxHP);
			var maxHealthRecovered = "%" === "%" ? Math.floor(maxDamage * p1.moves[i].percentHealed * 1000 / p1.maxHP) /
                10 : Math.floor(maxDamage * p1.moves[i].percentHealed * 48 / p1.maxHP);
			if (minHealthRecovered > 100 && "%" === "%") {
				minHealthRecovered = Math.floor(p2.maxHP * p1.moves[i].percentHealed * 1000 / p1.maxHP) / 10;
				maxHealthRecovered = Math.floor(p2.maxHP * p1.moves[i].percentHealed * 1000 / p1.maxHP) / 10;
			} else if ("%" !== "%" && minHealthRecovered > 48) {
				minHealthRecovered = Math.floor(p2.maxHP * p1.moves[i].percentHealed * 48 / p1.maxHP);
				maxHealthRecovered = Math.floor(p2.maxHP * p1.moves[i].percentHealed * 48 / p1.maxHP);
			}
			recoveryText = " (recovers between " + minHealthRecovered + "%" + " and " + maxHealthRecovered + "%" + ")";
		}
		var recoilText = "";
		if (typeof p1.moves[i].hasRecoil === "number") {
			var damageOverflow = minDamage > p2.curHP || maxDamage > p2.curHP;
			var minRecoilDamage = "%" === "%" ? Math.floor(Math.min(minDamage, p2.curHP) * p1.moves[i].hasRecoil * 10 / p1.maxHP) / 10 :
				Math.floor(Math.min(minDamage, p2.curHP) * p1.moves[i].hasRecoil * 0.48 / p1.maxHP);
			var maxRecoilDamage = "%" === "%" ? Math.floor(Math.min(maxDamage, p2.curHP) * p1.moves[i].hasRecoil * 10 / p1.maxHP) / 10 :
				Math.floor(Math.min(maxDamage, p2.curHP) * p1.moves[i].hasRecoil * 0.48 / p1.maxHP);
			if (damageOverflow) {
				minRecoilDamage = "%" === "%" ? Math.floor(p2.curHP * p1.moves[i].hasRecoil * 10 / p1.maxHP) / 10 :
					Math.floor(p2.maxHP * p1.moves[i].hasRecoil * 0.48 / p1.maxHP);
				maxRecoilDamage = "%" === "%" ? Math.floor(p2.curHP * p1.moves[i].hasRecoil * 10 / p1.maxHP) / 10 :
					Math.floor(p2.curHP * p1.moves[i].hasRecoil * 0.48 / p1.maxHP);
			}
			recoilText = " (" + minRecoilDamage + " - " + maxRecoilDamage + "%" + " recoil damage)";
		} else if (p1.moves[i].hasRecoil === "crash") {
			var genMultiplier = gen === 2 ? 12.5 : gen >= 3 ? 50 : 1;
			var gen4CrashDamage = Math.floor(p2.maxHP * 0.5 / p1.maxHP * 100);
			var minRecoilDamage = "%" === "%" ? Math.floor(Math.min(minDamage, p2.maxHP) * genMultiplier * 10 / p1.maxHP) / 10 :
			   Math.floor(Math.min(minDamage, p2.maxHP) * genMultiplier * 0.48 / p1.maxHP);
			var maxRecoilDamage = "%" === "%" ? Math.floor(Math.min(maxDamage, p2.maxHP) * genMultiplier * 10 / p1.maxHP) / 10 :
				Math.floor(Math.min(maxDamage, p2.maxHP) * genMultiplier * 0.48 / p1.maxHP);
			if (damageOverflow && gen !== 2) {
				minRecoilDamage = "%" === "%" ? Math.floor(p2.curHP * genMultiplier * 10 / p1.maxHP) / 10 :
					Math.floor(p2.curHP * genMultiplier * 0.48 / p1.maxHP);
				maxRecoilDamage = "%" === "%" ? Math.floor(p2.maxHP * genMultiplier * 10 / p1.maxHP) / 10 :
					Math.floor(Math.min(p2.maxHP, p1.maxHP) * genMultiplier * 0.48);
			}
			recoilText = gen === 1 ? " (1hp damage on miss)" :
				gen === 2 ? (p2.type1 === "Ghost" || p2.type2 === "Ghost") ? " (no crash damage on Ghost types)" : " (" + minRecoilDamage + " - " + maxRecoilDamage + "%" + " crash damage on miss)" :
					gen === 3 ? (p2.type1 === "Ghost" || p2.type2 === "Ghost") ? " (no crash damage on Ghost types)" : " (" + minRecoilDamage + " - " + maxRecoilDamage + "%" + " crash damage on miss)" :
						gen === 4 ? (p2.type1 === "Ghost" || p2.type2 === "Ghost") ? " (" + gen4CrashDamage + "% crash damage)" : " (" + minRecoilDamage + " - " + maxRecoilDamage + "%" + " crash damage on miss)" :
							gen > 4 ? " (50% crash damage)" :
								"";
		} else if (p1.moves[i].hasRecoil === "Struggle") {
			recoilText = " (25% struggle damage)";
		} else if (p1.moves[i].hasRecoil) {
			recoilText = " (50% recoil damage)";
		}
		$(resultLocations[0][i].move + " + label").text(p1.moves[i].name.replace("Hidden Power", "HP"));
		$(resultLocations[0][i].damage).text(minPercent + " - " + maxPercent + "%" + recoveryText + recoilText);
		/*if (maxPercent > highestMaxPercent) {
			highestMaxPercent = maxPercent;
			bestResult = $(resultLocations[0][i].move);
		}*/

		result = damageResults[1][i];
		var recoveryText = "";
		minDamage = result.damage[0] * p2.moves[i].hits;
		maxDamage = result.damage[result.damage.length - 1] * p2.moves[i].hits;
		minPercent = Math.floor(minDamage * 1000 / p1.maxHP) / 10;
		maxPercent = Math.floor(maxDamage * 1000 / p1.maxHP) / 10;
		result.damageText = minDamage + "-" + maxDamage + " (" + minPercent + " - " + maxPercent + "%)";
		result.koChanceText = p2.moves[i].bp === 0 ? "nice move" :
			getKOChanceText(result.damage, p2.moves[i], p1, field.getSide(0), p2.ability === "Bad Dreams", p2, p1.isMinimized, p2.isVictoryStar, gen, true);
		if (p2.moves[i].isMLG) {
			result.koChanceText = "<a href = 'https://www.youtube.com/watch?v=iD92h-M474g'>it's a one-hit KO!</a>";
		}
		if (p2.moves[i].givesHealth) {
			var minHealthRecovered = "%" === "%" ? Math.floor(minDamage * p2.moves[i].percentHealed * 1000 / p2.maxHP) /
                10 : Math.floor(minDamage * p2.moves[i].percentHealed * 48 / p2.maxHP);
			var maxHealthRecovered = "%" === "%" ? Math.floor(maxDamage * p2.moves[i].percentHealed * 1000 / p2.maxHP) /
                10 : Math.floor(maxDamage * p2.moves[i].percentHealed * 48 / p2.maxHP);
			if (minHealthRecovered > 100 && "%" === "%") {
				minHealthRecovered = Math.floor(p1.maxHP * p2.moves[i].percentHealed * 1000 / p2.maxHP) / 10;
				maxHealthRecovered = Math.floor(p1.maxHP * p2.moves[i].percentHealed * 1000 / p2.maxHP) / 10;
			} else if ("%" !== "%" && minHealthRecovered > 48) {
				minHealthRecovered = Math.floor(p1.maxHP * p2.moves[i].percentHealed * 48 / p2.maxHP);
				maxHealthRecovered = Math.floor(p1.maxHP * p2.moves[i].percentHealed * 48 / p2.maxHP);
			}
			recoveryText = " (recovers between " + minHealthRecovered + "%" + " and " + maxHealthRecovered + "%" + ")";
		}
		var recoilText = "";
		if (typeof p2.moves[i].hasRecoil === "number") {
			var damageOverflow = minDamage > p1.curHP || maxDamage > p1.curHP;
			var minRecoilDamage = "%" === "%" ? Math.floor(Math.min(minDamage, p1.curHP) * p2.moves[i].hasRecoil * 10 / p2.maxHP) / 10 :
				Math.floor(Math.min(minDamage, p1.curHP) * p2.moves[i].hasRecoil * 0.48 / p2.maxHP);
			var maxRecoilDamage = "%" === "%" ? Math.floor(Math.min(maxDamage, p1.maxHP) * p2.moves[i].hasRecoil * 10 / p2.maxHP) / 10 :
				Math.floor(Math.min(maxDamage, p1.curHP) * p2.moves[i].hasRecoil * 0.48 / p2.maxHP);
			if (damageOverflow) {
				minRecoilDamage = "%" === "%" ? Math.floor(Math.min(p1.maxHP * p2.moves[i].hasRecoil) * 10 / p2.maxHP) / 10 :
					Math.floor(p1.maxHP * p2.moves[i].recoilPercentage * 0.48 / p1.maxHP);
				maxRecoilDamage = "%" === "%" ? Math.floor(Math.min(p1.maxHP, p2.moves[i].hasRecoil) * 10 / p2.maxHP) / 10 :
					Math.floor(Math.min(p1.maxHP, p2.moves[i].hasRecoil) * 0.48 / p2.maxHP);
			}
			recoilText = " (" + minRecoilDamage + " - " + maxRecoilDamage + "%" + " recoil damage)";
		} else if (p2.moves[i].hasRecoil === "crash") {
			var genMultiplier = gen === 2 ? 12.5 : gen >= 3 ? 50 : 1;
			var gen4CrashDamage = Math.floor(p2.maxHP * 0.5 / p1.maxHP * 100);
			var minRecoilDamage = "%" === "%" ? Math.floor(Math.min(minDamage, p1.maxHP) * genMultiplier * 10 / p2.maxHP) / 10 :
				Math.floor(Math.min(minDamage, p1.maxHP) * 0.48 / p2.maxHP);
			var maxRecoilDamage = "%" === "%" ? Math.floor(Math.min(maxDamage, p1.maxHP) * genMultiplier * 10 / p2.maxHP) / 10 :
				Math.floor(Math.min(maxDamage, p1.maxHP) * 0.48 / p2.maxHP);
			if (damageOverflow && gen !== 2) {
				minRecoilDamage = "%" === "%" ? Math.floor(Math.min(p1.maxHP, genMultiplier) * 10 / p2.maxHP) / 10 :
					Math.floor(Math.min(p1.maxHP, p1.maxHP) * genMultiplier * 0.48);
				maxRecoilDamage = "%" === "%" ? Math.floor(Math.min(p1.maxHP, genMultiplier) * 10 / p2.maxHP) / 10 :
					Math.floor(Math.min(p1.maxHP, p2.maxHP) * genMultiplier * 0.48);
			}
			recoilText = gen === 1 ? " (1hp damage on miss)" :
				gen === 2 ? (p1.type1 === "Ghost" || p1.type2 === "Ghost") ? " (no crash damage on Ghost types)" : " (" + minRecoilDamage + " - " + maxRecoilDamage + "%" + " crash damage on miss)" :
					gen === 3 ? (p1.type1 === "Ghost" || p1.type2 === "Ghost") ? " (no crash damage on Ghost types)" : " (" + minRecoilDamage + " - " + maxRecoilDamage + "%" + " crash damage on miss)" :
						gen === 4 ? (p1.type1 === "Ghost" || p1.type2 === "Ghost") ? " (" + gen4CrashDamage + "% crash damage)" : " (" + minRecoilDamage + " - " + maxRecoilDamage + "%" + " crash damage on miss)" :
							gen > 4 ? " (50% crash damage)" :
								"";
		} else if (p2.moves[i].hasRecoil === "Struggle") {
			recoilText = " (25% struggle damage)";
		} else if (p2.moves[i].hasRecoil) {
			recoilText = " (50% recoil damage)";
		}
		$(resultLocations[1][i].move + " + label").text(p2.moves[i].name.replace("Hidden Power", "HP"));
		$(resultLocations[1][i].damage).text(minPercent + " - " + maxPercent + "%" + recoveryText + recoilText);
		/*if (maxPercent > highestMaxPercent) {
			highestMaxPercent = maxPercent;
			bestResult = $(resultLocations[1][i].move);
		}*/
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

function updateDamageText(resultMoveObj) {
	if (damageResults) {
		var result = findDamageResult(resultMoveObj);
		if (result) {
			$("#mainResult").html(result.description + ": " + result.damageText + " -- " + result.koChanceText);
			if (result.parentDamage) {
				$("#damageValues").text("(First hit: " + result.parentDamage.join(", ") +
                    "; Second hit: " + result.childDamage.join(", ") + ")");
			} else {
				$("#damageValues").text("(" + result.damage.join(", ") + ")");
			}
		}
	}
}

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

function optimizeEVs(side, mon) {
	/*
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
	*/
}

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
