function setKOChanceText(result, move, attacker, defender, field) {
//getKOChanceText(damage, move, defender, field, isBadDreams, attacker, isMinimized, isVictoryStar, gen, includeAcc)
	damage = result.damage;
	if (isNaN(damage[0])) {
		result.koChanceText = "something broke; please tell Silver or Eisen";
		return;
	}
	var moveAccuracy = "";
	var ignoreAccMods = false;
	if (move.acc || move.isZ) {
		// all genie sig moves have perfect acc in rain, except the pink one's.
		if (move.isZ || move.acc === 101 || (move.name === "Blizzard" && (field.weather === "Hail" || field.weather === "Snow")) || (["Thunder", "Hurricane", "Bleakwind Storm", "Sandsear Storm", "Wildbolt Storm"].includes(move.name) && field.weather.includes("Rain")) ||
			(["Astonish", "Body Slam", "Dragon Rush", "Extrasensory", "Flying Press", "Heat Crash", "Heavy Slam", "Malicious Moonsault", "Needle Arm", "Phantom Force", "Shadow Force", "Steamroller", "Stomp"].includes(move.name) && defender.isMinimized)) {
			moveAccuracy = 100;
			ignoreAccMods = true;
		}
		if (move.isMLG) {
			if (move.name === "Sheer Cold" && attacker.type1 !== "Ice" && attacker.type2 !== "Ice") {
				moveAccuracy = 20;
				ignoreAccMods = true;
			} else {
				moveAccuracy = 30;
				ignoreAccMods = true;
			}
		}
		if (!ignoreAccMods) {
			moveAccuracy = move.acc;
			if ((move.name === "Thunder" || move.name === "Hurricane") && field.weather.includes("Sun")) {
				moveAccuracy = 50;
			}
			var accMods = attacker.boosts.ac;
			var evaMods = defender.boosts.es;
			if (move.name === "Chip Away" || move.name === "Sacred Sword" || attacker.ability === "Unaware") {
				evaMods = 0;
				if (attacker.ability === "Unaware") {
					accMods = 1; // Bulbapedia says that it ignores changes to accuracy, not specifically drops
				}
			}
			var modStages = getStages(accMods + (evaMods * -1));
			var otherAccMods = getOtherAccMods(move, attacker, defender, field);
			moveAccuracy = Math.min(moveAccuracy * modStages * otherAccMods, 100);
		}
	}
	if (damage[damage.length - 1] === 0) {
		if (field.weather === "Harsh Sun" && move.type === "Water") {
			result.koChanceText = "the Water-Type attack evaporated in the harsh sunlight";
			return;
		} else if (field.weather === "Heavy Rain" && move.type === "Fire") {
			result.koChanceText = "the Fire-Type attack fizzled out in the heavy rain";
			return;
		}
		result.koChanceText = "aim for the horn next time";
		return;
	}
	var hasSitrus = defender.item === "Sitrus Berry";
	var hasFigy = defender.item === "Figy Berry";
	var hasIapapa = defender.item === "Iapapa Berry";
	var hasWiki = defender.item === "Wiki Berry";
	var hasAguav = defender.item === "Aguav Berry";
	var hasMago = defender.item === "Mago Berry";
	let hasFIWAM = hasFigy || hasIapapa || hasWiki || hasAguav || hasMago;
	var gluttony = defender.ability === "Gluttony";

	// both ap and honk use koChanceText
	// honk: honk's output table does not use afterText nor afterAccText
	// ap: the main result displayed uses all 3
	// ap: click-to-copy excludes afterAccText
	if (((damage.length !== 256 || !hasSitrus && !hasFIWAM) && damage[0] >= defender.curHP) ||
		(damage.length === 256 && hasSitrus && damage[0] >= defender.curHP + Math.floor(defender.maxHP / 4)) ||
		(damage.length === 256 && hasFIWAM && damage[0] >= defender.curHP + Math.floor(defender.maxHP / (gen < 7 ? 8 : gen == 7 ? 2 : 3)))) {
		result.koChanceText = "guaranteed OHKO";
		result.afterAccText = move.acc ? " (" + (100 * (moveAccuracy / 100)).toFixed(2) + "% after accuracy)" : "";
		return;
	}

	var hazards = 0;
	var hazardText = [];
	if (field.isSR && defender.ability !== "Magic Guard" && defender.item !== "Heavy-Duty Boots") {
		var effectiveness = typeChart["Rock"][defender.type1] * (defender.type2 ? typeChart["Rock"][defender.type2] : 1);
		hazards += Math.floor(effectiveness * defender.maxHP / 8);
		hazardText.push("Stealth Rock");
	}
	if (field.isBusted8) {
		hazards += Math.floor(defender.maxHP / 8);
		hazardText.push("1/8th Disguise damage");
	}
	if (field.isBusted16) {
		hazards += Math.floor(defender.maxHP / 16);
		hazardText.push("1/16th Disguise damage");
	}
	if ([defender.type1, defender.type2].indexOf("Flying") === -1 &&
            ["Magic Guard", "Levitate"].indexOf(defender.ability) === -1 && ["Air Balloon", "Heavy-Duty Boots"].indexOf(defender.item) === -1) {
		if (field.spikes === 1) {
			hazards += Math.floor(defender.maxHP / 8);
			if (gen === 2) {
				hazardText.push("Spikes");
			} else {
				hazardText.push("1 layer of Spikes");
			}
		} else if (field.spikes === 2) {
			hazards += Math.floor(defender.maxHP / 6);
			hazardText.push("2 layers of Spikes");
		} else if (field.spikes === 3) {
			hazards += Math.floor(defender.maxHP / 4);
			hazardText.push("3 layers of Spikes");
		}
	}
	if (isNaN(hazards)) {
		hazards = 0;
	}

	var eot = 0;
	var eotText = [];
	if (field.weather === "Sun") {
		if (defender.ability === "Dry Skin" || defender.ability === "Solar Power") {
			eot -= Math.floor(defender.maxHP / (defender.isDynamax ? 16 : 8));
			eotText.push(defender.ability + " damage");
		}
	} else if (field.weather === "Rain") {
		if (defender.ability === "Dry Skin") {
			eot += Math.floor(defender.maxHP / (defender.isDynamax ? 16 : 8));
			eotText.push("Dry Skin recovery");
		} else if (defender.ability === "Rain Dish") {
			eot += Math.floor(defender.maxHP / (defender.isDynamax ? 32 : 16));
			eotText.push("Rain Dish recovery");
		}
	} else if (field.weather === "Sand") {
		if (["Rock", "Ground", "Steel"].indexOf(defender.type1) === -1 &&
                ["Rock", "Ground", "Steel"].indexOf(defender.type2) === -1 &&
                ["Magic Guard", "Overcoat", "Sand Force", "Sand Rush", "Sand Veil"].indexOf(defender.ability) === -1 &&
                defender.item !== "Safety Goggles") {
			eot -= Math.floor(defender.maxHP / (defender.isDynamax ? 32 : 16));
			eotText.push("sandstorm damage");
		}
	} else if (field.weather === "Hail") {
		if (defender.ability === "Ice Body") {
			eot += Math.floor(defender.maxHP / (defender.isDynamax ? 32 : 16));
			eotText.push("Ice Body recovery");
		} else if (defender.type1 !== "Ice" && defender.type2 !== "Ice" &&
                ["Magic Guard", "Overcoat", "Snow Cloak"].indexOf(defender.ability) === -1 &&
                defender.item !== "Safety Goggles") {
			eot -= Math.floor(defender.maxHP / (defender.isDynamax ? 32 : 16));
			eotText.push("hail damage");
		}
	} else if (field.weather === "Snow") {
		if (defender.ability === "Ice Body") {
			eot += Math.floor(defender.maxHP / 16);
			eotText.push("Ice Body recovery");
		}
	}
	if (defender.item === "Leftovers") {
		eot += Math.floor(defender.maxHP / (defender.isDynamax ? 32 : 16));
		eotText.push("Leftovers recovery");
	} else if (defender.item === "Black Sludge") {
		if (defender.type1 === "Poison" || defender.type2 === "Poison") {
			eot += Math.floor(defender.maxHP / (defender.isDynamax ? 32 : 16));
			eotText.push("Black Sludge recovery");
		} else if (defender.ability !== "Magic Guard" && defender.ability !== "Klutz") {
			eot -= Math.floor(defender.maxHP / (defender.isDynamax ? 16 : 8));
			eotText.push("Black Sludge damage");
		}
	}
	if (field.isSeeded) {
		if (defender.ability !== "Magic Guard") {
			eot -= gen >= 2 ? Math.floor(defender.maxHP / (defender.isDynamax ? 16 : 8)) : Math.floor(defender.maxHP / 16); // 1/16 in gen 1, 1/8 in gen 2 onwards
			eotText.push("Leech Seed damage");
		}
	}
	if (field.terrain === "Grassy") {
		if (field.isGravity || defender.type1 !== "Flying" && defender.type2 !== "Flying" &&
                defender.item !== "Air Balloon" && defender.ability !== "Levitate") {
			eot += Math.floor(defender.maxHP / (defender.isDynamax ? 32 : 16));
			eotText.push("Grassy Terrain recovery");
		}
	}
	var toxicCounter = 0;
	if (defender.status === "Poisoned") {
		if (defender.ability === "Poison Heal") {
			eot += Math.floor(defender.maxHP / (defender.isDynamax ? 16 : 8));
			eotText.push("Poison Heal");
		} else if (defender.ability !== "Magic Guard") {
			eot -= Math.floor(defender.maxHP / (defender.isDynamax ? 16 : 8));
			eotText.push("poison damage");
		}
	} else if (defender.status === "Badly Poisoned") {
		if (defender.ability === "Poison Heal") {
			eot += Math.floor(defender.maxHP / (defender.isDynamax ? 16 : 8));
			eotText.push("Poison Heal");
		} else if (defender.ability !== "Magic Guard") {
			eotText.push("toxic damage");
			toxicCounter = defender.toxicCounter;
		}
	} else if (defender.status === "Burned") {
		if (defender.ability === "Heatproof") {
			eot -= Math.floor(defender.maxHP / (defender.isDynamax ? 32 : 16));
			eotText.push("reduced burn damage");
		} else if (defender.ability !== "Magic Guard") {
			eot -= Math.floor(defender.maxHP / (defender.isDynamax ? 16 : 8));
			eotText.push("burn damage");
		}
	} else if (defender.status === "Asleep" && attacker.ability === "Bad Dreams" && defender.ability !== "Magic Guard") {
		eot -= Math.floor(defender.maxHP / (defender.isDynamax ? 16 : 8));
		eotText.push("Bad Dreams");
	}

	// multi-hit moves have too many possibilities for brute-forcing to work, so reduce it to an approximate distribution
	var qualifier = "";
	if (move.hits > 1) {
		qualifier = "approx. ";
		damage = squashMultihit(damage, move.hits);
	}

	var multihit = damage.length === 256 || move.hits > 1;
	var c = getKOChance(damage, multihit, defender.curHP - hazards, 0, 1, defender.maxHP, toxicCounter, hasSitrus, hasFIWAM, gluttony);
	result.afterText = hazardText.length > 0 ? " after " + serializeText(hazardText) : "";
	if (c === 1) {
		result.koChanceText = "guaranteed OHKO";
		result.afterAccText = move.acc ? " (" + (100 * (moveAccuracy / 100)).toFixed(2) + "% after accuracy)" : "";
		return;
	} else if (c > 0) {
		result.koChanceText = qualifier + Math.round(c * 1000) / 10 + "% chance to OHKO";
		result.afterAccText = move.acc ? " (" + (Math.round(c * 1000) / 10 * moveAccuracy).toFixed(2) / 100 + "% chance to OHKO after accuracy)" : "";
		return;
	}

	if (hasSitrus && move.name !== "Knock Off") {
		eotText.push("Sitrus Berry recovery");
	}

	if (hasFIWAM && move.name !== "Knock Off") {
		eotText.push((gluttony ? "Gluttony " : "") + defender.item + " recovery");
	}

	result.afterText = hazardText.length > 0 || eotText.length > 0 ? " after " + serializeText(hazardText.concat(eotText)) : "";
	var i;
	for (i = 2; i <= 4; i++) {
		c = getKOChance(damage, multihit, defender.curHP - hazards, eot, i, defender.maxHP, toxicCounter, hasSitrus, hasFIWAM, gluttony);
		if (c === 1) {
			result.koChanceText = "guaranteed " + i + "HKO";
			result.afterAccText = move.acc ? " (" + (Math.pow(moveAccuracy / 100, i) * 100).toFixed(2) + "% chance to " + i + "HKO after accuracy)" : "";
			return;
		} else if (c > 0) {
			var pct = Math.round(c * 1000) / 10;
			var chance = pct ? qualifier + pct : "Miniscule";
			var chanceAcc = (chance * (Math.pow(moveAccuracy / 100, i) * 100) / 100);
			result.koChanceText = chance + "% chance to " + i + "HKO";
			result.afterAccText = move.acc ? " (" + (chanceAcc ? chanceAcc.toFixed(2) : "Miniscule") + "% chance to " + i + "HKO after accuracy)" : "";
			return;
		}
	}

	for (i = 5; i <= 9; i++) {
		if (predictTotal(damage[0], eot, i, toxicCounter, defender.curHP - hazards, defender.maxHP, hasSitrus, hasFIWAM, gluttony) >= defender.curHP - hazards) {
			result.koChanceText = "guaranteed " + i + "HKO";
			result.afterAccText = move.acc ? " (" + (Math.pow(moveAccuracy / 100, i) * 100).toFixed(2) + "% chance to " + i + "HKO after accuracy)" : "";
			return;
		} else if (predictTotal(damage[damage.length - 1], eot, i, toxicCounter, defender.curHP - hazards, defender.maxHP, hasSitrus, hasFIWAM, gluttony) >= defender.curHP - hazards) {
			result.koChanceText = "possible " + i + "HKO";
			return;
		}
	}

	result.koChanceText = "every bit counts";
	result.afterText = "";
}

function getKOChance(damage, multihit, hp, eot, hits, maxHP, toxicCounter, hasSitrus, hasFIWAM, gluttony) {
	var n = damage.length;
	var minDamage = damage[0];
	var maxDamage = damage[n - 1];
	var i;
	if (hits === 1) {
		if ((!multihit || !hasSitrus) && maxDamage < hp) {
			return 0;
		} else if (multihit && hasSitrus && maxDamage < hp + Math.floor(maxHP / 4)) {
			return 0;
		} else if (multihit && hasFIWAM && maxDamage < hp + Math.floor(maxHP / (gen < 7 ? 8 : gen == 7 ? 2 : 3))) {
			return 0;
		}
		for (i = 0; i < n; i++) {
			if ((!multihit || !hasSitrus && !hasFIWAM) && damage[i] >= hp) {
				return (n - i) / n;
			} else if (multihit && hasSitrus && damage[i] >= hp + Math.floor(maxHP / 4)) {
				return (n - i) / n;
			} else if (multihit && hasFIWAM && damage[i] >= hp + Math.floor(maxHP / 2)) {
				return (n - i) / n;
			}
		}
	}
	/*
    if (predictTotal(maxDamage, eot, hits, toxicCounter, hp, maxHP, hasSitrus, hasFigy, hasIapapa, hasWiki, hasAguav, hasMago, gluttony) < hp) {
        return 0;
    } else if (predictTotal(minDamage, eot, hits, toxicCounter, hp, maxHP, hasSitrus, hasFigy, hasIapapa, hasWiki, hasAguav, hasMago, gluttony) >= hp) {
        return 1;
    }*/
	var toxicDamage = 0;
	if (toxicCounter > 0) {
		toxicDamage = Math.floor(toxicCounter * maxHP / 16);
		toxicCounter++;
	}
	var sum = 0;
	var lastC = 0;
	for (i = 0; i < n; i++) {
		if (hp - damage[i] <= maxHP / 2 && hasSitrus) {
			hp += Math.floor(maxHP / 4);
			hasSitrus = false;
		} else if (hp - damage[i] <= maxHP / 4 && hasFIWAM && !gluttony || hp - damage[i] <= maxHP / 2 && hasFIWAM && gluttony) {
			hp += Math.floor(maxHP / (gen < 7 ? 8 : gen == 7 ? 2 : 3));
			hasFIWAM = false;
		}
		var c;
		if (i === 0 || damage[i] !== damage[i - 1]) {
			c = getKOChance(damage, multihit, hp - damage[i] + eot - toxicDamage, eot, hits - 1, maxHP, toxicCounter, hasSitrus, hasFIWAM, gluttony);
		} else {
			c = lastC;
		}
		if (c === 1) {
			sum += n - i;
			break;
		} else {
			sum += c;
		}
		lastC = c;
	}
	return sum / n;
}

function predictTotal(damage, eot, hits, toxicCounter, hp, maxHP, hasSitrus, hasFIWAM, gluttony) {
	var total = 0;
	for (var i = 0; i < hits; i++) {
		total += damage;
		if (hp - total <= maxHP / 2 && hasSitrus) {
			total -= Math.floor(maxHP / 4);
			hasSitrus = false;
		} else if (((hp - total <= maxHP / 4) && hasFIWAM && !gluttony) || ((hp - total <= maxHP / 2) && hasFIWAM && gluttony)) {
			hp += Math.floor(maxHP / (gen < 7 ? 8 : gen == 7 ? 2 : 3));
			hasFIWAM = false;
		}
		if (i < hits - 1) {
			total -= eot;
			if (toxicCounter > 0) {
				total += Math.floor((toxicCounter + i) * maxHP / 16);
			}
		}
	}
	return total;
}

function squashMultihit(d, hits) {
	if (d.length === 1) {
		return [d[0] * hits];
	} else if (gen === 1) {
		var r = [];
		for (var i = 0; i < d.length; i++) {
			r[i] = d[i] * hits;
		}
		return r;
	} else if (d.length === 16) {
		switch (hits) {
		case 2:
			return [
				2 * d[0], d[2] + d[3], d[4] + d[4], d[4] + d[5],
				d[5] + d[6], d[6] + d[6], d[6] + d[7], d[7] + d[7],
				d[8] + d[8], d[8] + d[9], d[9] + d[9], d[9] + d[10],
				d[10] + d[11], d[11] + d[11], d[12] + d[13], 2 * d[15]
			];
		case 3:
			return [
				3 * d[0], d[3] + d[3] + d[4], d[4] + d[4] + d[5], d[5] + d[5] + d[6],
				d[5] + d[6] + d[6], d[6] + d[6] + d[7], d[6] + d[7] + d[7], d[7] + d[7] + d[8],
				d[7] + d[8] + d[8], d[8] + d[8] + d[9], d[8] + d[9] + d[9], d[9] + d[9] + d[10],
				d[9] + d[10] + d[10], d[10] + d[11] + d[11], d[11] + d[12] + d[12], 3 * d[15]
			];
		case 4:
			return [
				4 * d[0], 4 * d[4], d[4] + d[5] + d[5] + d[5], d[5] + d[5] + d[6] + d[6],
				4 * d[6], d[6] + d[6] + d[7] + d[7], 4 * d[7], d[7] + d[7] + d[7] + d[8],
				d[7] + d[8] + d[8] + d[8], 4 * d[8], d[8] + d[8] + d[9] + d[9], 4 * d[9],
				d[9] + d[9] + d[10] + d[10], d[10] + d[10] + d[10] + d[11], 4 * d[11], 4 * d[15]
			];
		case 5:
			return [
				5 * d[0], d[4] + d[4] + d[4] + d[5] + d[5], d[5] + d[5] + d[5] + d[5] + d[6], d[5] + d[6] + d[6] + d[6] + d[6],
				d[6] + d[6] + d[6] + d[6] + d[7], d[6] + d[6] + d[7] + d[7] + d[7], 5 * d[7], d[7] + d[7] + d[7] + d[8] + d[8],
				d[7] + d[7] + d[8] + d[8] + d[8], 5 * d[8], d[8] + d[8] + d[8] + d[9] + d[9], d[8] + d[9] + d[9] + d[9] + d[9],
				d[9] + d[9] + d[9] + d[9] + d[10], d[9] + d[10] + d[10] + d[10] + d[10], d[10] + d[10] + d[11] + d[11] + d[11], 5 * d[15]
			];
		// I'm being really lazy and not including the others at the moment because Population Bomb is an absolute meme sent by GF to mess with calculators
		case 9:
			return [
				9 * d[0], 9 * d[5], 4 * d[5] + 5 * d[6], 3 * d[5] + 6 * d[6],
				9 * d[6], 5 * d[6] + 4 * d[7], 9 * d[7], 7 * d[7] + 2 * d[8],
				2 * d[7] + 7 * d[8], 9 * d[8], 4 * d[8] + 5 * d[9], 9 * d[9], 
				6 * d[9] + 3 * d[10], 5 * d[9] + 4 * d[10], 9 * d[10], 9 * d[15]
			];
		case 10:
			return [
				10 * d[0], 10 * d[5], 5 * d[5] + 5 * d[6], 3 * d[5] + 7 * d[6],
				10 * d[6], 6 * d[6] + 4 * d[7], 10 * d[7], 8 * d[7] + 2 * d[8],
				2 * d[7] + 8 * d[8], 10 * d[8], 4 * d[8] + 6 * d[9], 10 * d[9], 
				7 * d[9] + 3 * d[10], 5 * d[9] + 5 * d[10], 10 * d[10], 10 * d[15]
			];
		default:
			console.log("Unexpected # of hits: " + hits);
			return d;
		}
	} else if (d.length === 39) {
		switch (hits) {
		case 2:
			return [
				2 * d[0], 2 * d[7], 2 * d[10], 2 * d[12],
				2 * d[14], d[15] + d[16], 2 * d[17], d[18] + d[19],
				d[19] + d[20], 2 * d[21], d[22] + d[23], 2 * d[24],
				2 * d[26], 2 * d[28], 2 * d[31], 2 * d[38]
			];
		case 3:
			return [
				3 * d[0], 3 * d[9], 3 * d[12], 3 * d[13],
				3 * d[15], 3 * d[16], 3 * d[17], 3 * d[18],
				3 * d[20], 3 * d[21], 3 * d[22], 3 * d[23],
				3 * d[25], 3 * d[26], 3 * d[29], 3 * d[38]
			];
		case 4:
			return [
				4 * d[0], 2 * d[10] + 2 * d[11], 4 * d[13], 4 * d[14],
				2 * d[15] + 2 * d[16], 2 * d[16] + 2 * d[17], 2 * d[17] + 2 * d[18], 2 * d[18] + 2 * d[19],
				2 * d[19] + 2 * d[20], 2 * d[20] + 2 * d[21], 2 * d[21] + 2 * d[22], 2 * d[22] + 2 * d[23],
				4 * d[24], 4 * d[25], 2 * d[27] + 2 * d[28], 4 * d[38]
			];
		case 5:
			return [
				5 * d[0], 5 * d[11], 5 * d[13], 5 * d[15],
				5 * d[16], 5 * d[17], 5 * d[18], 5 * d[19],
				5 * d[19], 5 * d[20], 5 * d[21], 5 * d[22],
				5 * d[23], 5 * d[25], 5 * d[27], 5 * d[38]
			];
		default:
			console.log("Unexpected # of hits: " + hits);
			return d;
		}
	} else {
		console.log("Unexpected # of possible damage values: " + d.length);
		return d;
	}
}

function serializeText(arr) {
	if (arr.length === 0) {
		return "";
	} else if (arr.length === 1) {
		return arr[0];
	} else if (arr.length === 2) {
		return arr[0] + " and " + arr[1];
	} else {
		var text = "";
		for (var i = 0; i < arr.length - 1; i++) {
			text += arr[i] + ", ";
		}
		return text + "and " + arr[arr.length - 1];
	}
}

function getStages(stages) {
	if (stages > 6) stages = 6;
	if (stages < -6) stages = -6;
	if (stages >= 0) stages = (parseInt(stages) + 3) / 3;
	if (stages < 0) stages = 3 / (parseInt(stages * -1) + 3);
	return stages;
}

function getOtherAccMods(move, attacker, defender, field) {
	var mods = 1;
	var weather = field.weather;
	var gravity = field.isGravity;

	if (attacker.isVictoryStar) {
		mods *= 1.1;
	}
	if (attacker.item === "Wide Lens") {
		mods *= 1.1;
	}
	if (attacker.item === "Zoom Lens" && attacker.stats.sp < defender.stats.sp) {
		mods *= 1.2;
	}
	if (defender.item === "Bright Powder" || defender.item === "Lax Insence") {
		mods *= 0.9;
	}
	if (attacker.ability === "Compound Eyes") {
		mods *= 1.3;
	}
	if (attacker.ability === "Hustle" && move.category === "Physical") {
		mods *= 0.8;
	}
	if ((weather === "Sand" && defender.ability === "Sand Veil") || ((weather === "Hail" || weather === "Snow") && defender.ability === "Snow Cloak")) {
		mods *= 0.8;
	}
	if (defender.ability === "Tangled Feet" && defener.status === "Confused") {
		mods *= 0.5;
	}
	if (gravity) {
		mods *= 5 / 3;
	}

	return mods;
}
