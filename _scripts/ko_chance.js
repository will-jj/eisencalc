var eotWeather = 0;
var eotTotal = 0;
var berryRecovery = 0;
var berryThreshold = 0;
var toxicCounter = 0;
function setKOChanceText(result, move, moveHits, attacker, defender, field, damageInfo, firstHitDamageInfo) {
	// damageMap is a Map from damage values to # of instances of that damage value. This is for hits without any held resist berry
	// mapCombinations is the sum of the values in damageMap
	// firstHitMap is the damageMap of the first hit to account for resist berries. If it is not supplied, firstHitMap is simply set to damageMap
	// firstHitSortedKeys is a sorted array of the keys in firstHitMap
	if (isNaN(firstHitDamageInfo.max)) {
		result.koChanceText = "something broke; please tell Silver or Eisen";
		return;
	}
	if (firstHitDamageInfo.max === 0) {
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

	// Set up move accuracy
	let moveAccuracy = "";
	if (move.isZ || move.isMax) {
		moveAccuracy = 100;
	} else if (move.acc) {
		// all genie sig moves have perfect acc in rain, except the pink one's.
		if (move.acc === 101 || (move.name === "Blizzard" && (field.weather === "Hail" || field.weather === "Snow")) ||
			(["Thunder", "Hurricane", "Bleakwind Storm", "Sandsear Storm", "Wildbolt Storm"].includes(move.name) && field.weather.includes("Rain")) ||
			(["Astonish", "Body Slam", "Dragon Rush", "Extrasensory", "Flying Press", "Heat Crash", "Heavy Slam",
				"Malicious Moonsault", "Needle Arm", "Phantom Force", "Shadow Force", "Steamroller", "Stomp"].includes(move.name) && defender.isMinimized)) {
			moveAccuracy = 100;
		} else if (move.isMLG) {
			if (move.name === "Sheer Cold" && !attacker.hasType("Ice")) {
				moveAccuracy = 20;
			} else {
				moveAccuracy = 30;
			}
		// if a move is not captured by an above condition, it is subject to accuracy mods.
		} else {
			moveAccuracy = move.acc;
			if ((move.name === "Thunder" || move.name === "Hurricane") && field.weather.includes("Sun")) {
				moveAccuracy = 50;
			}
			let accMods = attacker.boosts.ac;
			let evaMods = defender.boosts.es;
			if (move.name === "Chip Away" || move.name === "Sacred Sword" || attacker.curAbility === "Unaware") {
				evaMods = 0;
				if (attacker.curAbility === "Unaware") {
					accMods = 1;
				}
			}
			let modStages = getStages(accMods + (evaMods * -1));
			let otherAccMods = getOtherAccMods(move, attacker, defender, field);
			moveAccuracy = Math.min(moveAccuracy * modStages * otherAccMods, 100);
		}
	}

	// Set up berry values
	let berryText = setUpBerryValues(attacker, defender);

	// Calculate KO chances
	let eotText = [];
	let eotHealingText = [];
	let hazardText = [];
	eotWeather = calcWeatherEOT(defender, field, eotText, eotHealingText);
	eotTotal = eotWeather + calcOtherEOT(attacker, defender, field, eotText, eotHealingText);
	let targetHP = defender.curHP + calcHazards(defender, field, hazardText);

	// check if a multihit can OHKO.
	let multiResult = checkMultiHitKO(moveHits, result, targetHP, defender, damageInfo, firstHitDamageInfo);
	if (multiResult && multiResult.hitCount <= moveHits &&
		(!multiResult.koCombinations || multiResult.koCombinations >= damageInfo.mapCombinations)) {
		// likely temporary fix: checkMultiHitKO() uses the base damage of each strike to calculate, so the mapCombinations need to be based on that too.
		let temp = damageInfo.mapCombinations;
		damageInfo.mapCombinations = result.damage.length ** multiResult.hitCount;
		setResultText(result, 1, moveAccuracy, multiResult.koCombinations, damageInfo, hazardText, multiResult.berryKO ? berryText : "");
		damageInfo.mapCombinations = temp;
		return;
	} else if (moveHits > 1 && berryRecovery) {
		// no multihit OHKO found, so currently treating this as though a berry must have been eaten
		eotHealingText.push(berryText);
		berryText = "";
		targetHP += berryRecovery;
		berryRecovery = 0;
		berryThreshold = 0;
	}

	let maxHP = defender.maxHP;
	// Check for OHKO chance
	if (firstHitDamageInfo.min >= targetHP) {
		setResultText(result, 1, moveAccuracy, false, damageInfo, hazardText, "");
		return;
	} else if (checkHPThreshold(targetHP + berryRecovery, 0, firstHitDamageInfo.min, maxHP)) {
		// since there was not a KO from the first condition, this OHKO could only guaranteed by eot damage
		setResultText(result, 1, moveAccuracy, false, damageInfo, hazardText.concat(eotText), "");
		return;
	} else if (firstHitDamageInfo.max >= targetHP || checkHPThreshold(targetHP + berryRecovery, 0, firstHitDamageInfo.max, maxHP)) {
		// can start with the count of the max damage value
		let koCombinations = firstHitDamageInfo.damageMap.get(firstHitDamageInfo.max);
		// iterate backwards because as soon as there is a value that cannot KO, exit the loop.
		for (let i = firstHitDamageInfo.sortedDamageValues.length - 2; i >= 0; i--) {
			let damageValue = firstHitDamageInfo.sortedDamageValues[i];
			if (damageValue >= targetHP || checkHPThreshold(targetHP + berryRecovery, 0, damageValue, maxHP)) {
				koCombinations += firstHitDamageInfo.damageMap.get(damageValue);
			} else {
				break;
			}
		}
		// this is checking hits that bypass berry recovery, so no berryText
		setResultText(result, 1, moveAccuracy, koCombinations, damageInfo, hazardText.concat(eotText), "");
		return;
	}
	// since no OHKO occured, set up nHitDamageMap and berryDamageMap
	let nHitDamageMap;
	let berryDamageMap = new Map();
	if (berryRecovery == 0) {
		nHitDamageMap = new Map(firstHitDamageInfo.damageMap);
	} else {
		nHitDamageMap = new Map();
		for (let [damageValue, count] of firstHitDamageInfo.damageMap) {
			if (checkHPThreshold(targetHP, berryThreshold, damageValue, maxHP)) {
				berryDamageMap.set(damageValue, count);
			} else {
				nHitDamageMap.set(damageValue, count);
			}
		}
	}

	// add clarifying text for 2+HKOs that a resist berry is only being calculated for the first hit. This is duplicated in checkMultiHitKO
	if (result.firstHitDamage && moveHits == 1) {
		if (getBerryResistType(defender.item) && result.description.includes(defender.item)) {
			insertFirstHitOnly(result, defender.item);
		}
		if (result.description.includes("Multiscale") || result.description.includes("Shadow Shield")) {
			insertFirstHitOnly(result, defender.ability);
		}
	}

	// calc 2-4HKO
	let nhkoResult = calculateNHKO(4, targetHP, maxHP, nHitDamageMap, berryDamageMap, damageInfo, firstHitDamageInfo);
	if (nhkoResult) {
		setResultText(result, nhkoResult.hitCount, moveAccuracy, nhkoResult.koCombinations, damageInfo, hazardText.concat(eotText, eotHealingText), nhkoResult.berryKO ? berryText : "");
		return;
	}

	// 5+HKO. Assume that any held berry will be/has been eaten.
	for (let hitCount = 5; hitCount <= 9; hitCount++) {
		let previousTurnsEot = (hitCount - 1) * eotTotal;
		// even though it's easy to give an accurate chance of a 5+HKO with damage maps, keep the output text simple.
		if (checkHPThreshold(targetHP + berryRecovery + previousTurnsEot, 0, firstHitDamageInfo.min + damageInfo.min * (hitCount - 1), maxHP)) {
			setResultText(result, hitCount, moveAccuracy, false, false, hazardText.concat(eotText, eotHealingText), berryText);
			return;
		} else if (checkHPThreshold(targetHP + berryRecovery + previousTurnsEot, 0, firstHitDamageInfo.min + damageInfo.max * (hitCount - 1), maxHP)) {
			setResultText(result, hitCount, moveAccuracy, true, false, hazardText.concat(eotText, eotHealingText), berryText);
			return;
		}
		if (toxicCounter > 0) {
			toxicCounter = Math.min(toxicCounter + 1, 16);
		}
	}

	result.koChanceText = "every bit counts";
	result.afterText = "";
}

function insertFirstHitOnly(result, effectString, hitText = "hit") {
	let index = result.description.indexOf(effectString) + effectString.length;
	result.description = result.description.substring(0, index) + " (first " + hitText + " only)" + result.description.substring(index);
}

function setResultText(result, hitCount, moveAccuracy, koCombinations, damageInfo, afterTextArr, berryText) {
	// both ap_calc (primary calc) and honk_calc (mass calc) use koChanceText
	// honk: honk's output table only uses koChanceText; not afterText nor afterAccText
	// ap: the main result displayed uses koChanceText + afterText + afterAccText
	// ap: click-to-copy uses koChanceText + afterText and not afterAccText

	let hko = (hitCount == 1 ? "O" : hitCount) + "HKO";
	let finalAcc = (moveAccuracy / 100) ** hitCount;
	if (hitCount >= 5) {
		result.koChanceText = (koCombinations ? "possible" : "guaranteed") + " " + hko;
	} else if (koCombinations) {
		let koChance = powerDivision(koCombinations, damageInfo.mapCombinations, hitCount);
		if (koChance == 1) {
			result.koChanceText = "guaranteed " + hko;
		} else {
			let printedKOChance = Math.round(koChance * 1000) / 10;
			if (printedKOChance == 0) {
				printedKOChance = "Miniscule";
			}
			result.koChanceText = printedKOChance + "% chance to " + hko;
			finalAcc *= koChance;
		}
	} else {
		result.koChanceText = "guaranteed " + hko;
	}

	if (moveAccuracy < 100 && !result.tripleAxelDamage) {
		let printedAfterAcc = (100 * finalAcc).toFixed(1);
		if (printedAfterAcc == 0) {
			printedAfterAcc = "~0";
		}
		result.afterAccText = " (" + printedAfterAcc + "% chance";
		if (hitCount > 1 || koCombinations) {
			result.afterAccText += " to " + hko;
		}
		result.afterAccText += " after accuracy)";
	}

	result.afterText = writeAfterText(afterTextArr, berryText);
}

function setUpBerryValues(attacker, defender) {
	// Berries are still consumed if Knock Off is used. As One cannot be neutralized.
	berryRecovery = 0;
	berryThreshold = 0;
	if (attacker.curAbility === "Unnerve" || attacker.ability === "As One") {
		return "";
	}
	let maxHP = defender.maxHP;
	if (defender.item === "Sitrus Berry") {
		berryRecovery = Math.floor(maxHP / 4);
		berryThreshold = Math.floor(maxHP / 2);
	} else if (["Figy Berry", "Iapapa Berry", "Wiki Berry", "Aguav Berry", "Mago Berry"].includes(defender.item)) {
		berryRecovery = Math.floor(maxHP / (gen <= 6 ? 8 : (gen == 7 ? 2 : 3)));
		berryThreshold = Math.floor(maxHP / (defender.curAbility === "Gluttony" ? 2 : 4));
	} else {
		return "";
	}

	let berryText = defender.item + " recovery";
	if (defender.curAbility === "Cheek Pouch") {
		// suppose a hit damages a Cheek Pouch Sitrus user to 49%. Then it is healed to 100%, not 107% like this code is doing.
		// this is difficult to accomodate with ranges across multiple hits, so I'm ignoring it right now.
		berryRecovery += Math.floor(maxHP / 3);
		berryText = defender.curAbility + " " + berryText;
	} else if (defender.curAbility === "Ripen") {
		berryRecovery *= 2;
		berryText = defender.curAbility + " " + berryText;
	}
	return berryText;
}

// this function does a check on whether a multihit move can OHKO and bypass a healing berry.
function checkMultiHitKO(moveHits, result, targetHP, defender, damageInfo, firstHitDamageInfo) {
	// still need to accomodate 2HKOs of multihits that bypass non-gluttony FIWAM berries
	if (moveHits == 1) {
		return; // return nothing
	}

	if (result.firstHitDamage) {
		if (getBerryResistType(defender.item) && result.description.includes(defender.item)) {
			insertFirstHitOnly(result, defender.item, "strike");
		}
		if (result.description.includes("Multiscale") || result.description.includes("Shadow Shield")) {
			insertFirstHitOnly(result, defender.ability, "strike");
		}
	}
	if (result.childDamage || result.tripleAxelDamage) {
		return; // easier to not deal with these types of damage in here right now. still apply the above text
	}

	let baseHitDamage = result.firstHitDamage ? result.firstHitDamage : result.damage;

	if (checkHPThreshold(targetHP + berryRecovery, 0, baseHitDamage[0] + result.damage[0] * (moveHits - 1), defender.maxHP)) {
		return {"hitCount": moveHits, "berryKO": true};
	}

	let multiResult = {};
	// use the base damage of each strike
	let baseHitMap = mapFromArray(baseHitDamage);
	let accumulatedHitsMap = mapFromArray(result.damage);
	let berryDamageMap = new Map();
	let nextDamageMap, nextBerryDamageMap;
	let koCombinations = 0;
	// already checked just one strike, start checking strikes starting with 2
	for (let hitCount = 2; hitCount <= moveHits; hitCount++) {
		nextDamageMap = new Map();
		nextBerryDamageMap = new Map();

		if (baseHitDamage[0] + result.damage[0] * (hitCount - 1) >= targetHP + berryRecovery) {
			multiResult.hitCount = hitCount;
			return multiResult;
		}

		for (let [baseValue, baseCount] of baseHitMap) {
			for (let [hitValue, hitCount] of accumulatedHitsMap) {
				let damageTotal = baseValue + hitValue;
				let countTotal = baseCount * hitCount;
				if (targetHP <= damageTotal) {
					// a KO occurs
					koCombinations += countTotal;
				} else if (checkHPThreshold(targetHP + berryRecovery, 0, damageTotal, defender.maxHP)) {
					// a KO occurs
					koCombinations += countTotal;
					multiResult.berryKO = true;
				} else if (berryRecovery > 0 && checkHPThreshold(targetHP, berryThreshold, damageTotal, defender.maxHP)) {
					// no KO occurs and a berry was eaten
					mapAddKey(nextBerryDamageMap, damageTotal, countTotal);
				} else {
					// no KO occured, but a berry wasn't eaten (either it wasn't eaten or no berry is held)
					mapAddKey(nextDamageMap, damageTotal, countTotal);
				}
			}
			if (berryDamageMap.size > 0) {
				for (let [berryValue, berryCount] of berryDamageMap) {
					let damageTotal = baseValue + berryValue;
					let countTotal = baseCount * berryCount;
					if (checkHPThreshold(targetHP + berryRecovery, 0, damageTotal, defender.maxHP)) {
						// a KO occurs
						koCombinations += countTotal;
						multiResult.berryKO = true;
					} else {
						// since a berry was already eaten, add this to the berry damageMap
						mapAddKey(nextBerryDamageMap, damageTotal, countTotal);
					}
				}
			}
		}

		if (koCombinations > 0) {
			multiResult.hitCount = hitCount;
			multiResult.koCombinations = koCombinations;
			return multiResult;
		}

		accumulatedHitsMap = nextDamageMap;
		berryDamageMap = nextBerryDamageMap;
	}
	// return nothing
}

function calculateNHKO(upperHitCount, targetHP, maxHP, nHitDamageMap, berryDamageMap, damageInfo, firstHitDamageInfo) {
	// nHitDamageMap is the combined map of previous hits. when checking the 3HKO, it contains all damage possibilities from 2 hits.
	// It does not include any hits that proc'd berry nor accumulated eot. berryDamageMap is the same as this map but it only contains hits that proc'd a berry (but did not KO)
	let result = {};
	let nextDamageMap, nextBerryDamageMap;
	let koCombinations = 0;
	for (let hitCount = 2; hitCount <= upperHitCount; hitCount++) {
		nextDamageMap = new Map();
		nextBerryDamageMap = new Map();
		let previousTurnsEot = (hitCount - 1) * eotTotal;

		if (checkHPThreshold(targetHP + berryRecovery + previousTurnsEot, 0, firstHitDamageInfo.min + damageInfo.min * (hitCount - 1), maxHP)) {
			result.hitCount = hitCount;
			// if there is any chance of berry activating, print berry text
			result.berryKO = berryDamageMap.size > 0;
			return result;
		}

		// nHitDamageMap and berryDamageMap are constructed from the first hit damage.
		for (let [baseValue, baseCount] of damageInfo.damageMap) {
			for (let [nHitValue, nHitCount] of nHitDamageMap) { // nHitValue is the accumulated hits from earlier turns. For checking the 3HKO, it's the sum of 2 hits of damage.
				let damageTotal = baseValue + nHitValue;
				let countTotal = baseCount * nHitCount;
				// (targetHP + previousTurnsEot <= damageTotal) is needed because it checks if a KO can occur that didn't proc a berry, but doesn't include this turn's eot.
				// if it can only get the KO with eot, then berry would proc instead. nHitDamageMap only contains damages that didn't activate berry.
				if (targetHP + previousTurnsEot <= damageTotal) {
					// a KO occurs
					koCombinations += countTotal;
				} else if (checkHPThreshold(targetHP + berryRecovery + previousTurnsEot, 0, damageTotal, maxHP)) {
					// a KO occurs
					koCombinations += countTotal;
					result.berryKO = true;
				} else if (berryRecovery > 0 && checkHPThreshold(targetHP + previousTurnsEot, berryThreshold, damageTotal, maxHP)) {
					// no KO occurs and a berry was eaten
					mapAddKey(nextBerryDamageMap, damageTotal, countTotal);
				} else {
					// no KO occured, but a berry wasn't eaten (either it wasn't eaten or no berry is held)
					mapAddKey(nextDamageMap, damageTotal, countTotal);
				}
			}
			if (berryDamageMap.size > 0) {
				for (let [berryValue, berryCount] of berryDamageMap) {
					let damageTotal = baseValue + berryValue;
					let countTotal = baseCount * berryCount;
					if (checkHPThreshold(targetHP + berryRecovery + previousTurnsEot, 0, damageTotal, maxHP)) {
						// a KO occurs
						koCombinations += countTotal;
						result.berryKO = true;
					} else if (hitCount < 4) {
						// since a berry was already consumed, add this to the berry damageMap
						mapAddKey(nextBerryDamageMap, damageTotal, countTotal);
					}
				}
			}
		}

		if (koCombinations > 0) {
			result.hitCount = hitCount;
			result.koCombinations = koCombinations;
			return result;
		}

		nHitDamageMap = nextDamageMap;
		berryDamageMap = nextBerryDamageMap;
		if (toxicCounter > 0) {
			toxicCounter = Math.min(toxicCounter + 1, 16);
		}
	}
	// return nothing if no KO was found.
}

function toxicSum(counter, maxHP) {
	let sum = 0;
	for (let i = counter; i > 0; i--) {
		sum += Math.floor(maxHP * counter / 16);
	}
	return sum;
}

function powerDivision(numerator, divisor, power) {
	// naive implementation of calculation of something of the form: numerator / (divisor ** power)
	// This is done this way to avoid issues with large numbers. This algorithm is fine since power will always be less than 10.
	while (power > 0) {
		power--;
		numerator /= divisor;
	}
	return numerator;
}

// This is used to check if a damage value will cause the current HP to meet a threshold, factoring in eot.
// This is used to either check KOs or berry activations.
function checkHPThreshold(currentHP, threshold, damageValue, maxHP) {
	// this function assumes that currentHP includes any berry recovery and all accumulated eot of prior turns*. This turn's eot is accounted for here.
	// *except for toxic damage.
	// weather and weather abilities activate first, so check if the weather causes a KO.
	// otherwise for simplicity, assume all the eot occurs at one time and check against that.
	let damagedHP = currentHP - damageValue - toxicSum(toxicCounter - 1, maxHP);
	return damagedHP <= threshold ||
		damagedHP + eotWeather <= threshold ||
		damagedHP + eotTotal - Math.floor(maxHP * toxicCounter / 16) <= threshold;
}

function calcHazards(defender, field, hazardText) {
	let hazards = 0;
	if (field.isBusted8) {
		hazards -= Math.floor(defender.maxHP / 8);
		hazardText.push("1/8th Disguise damage");
	}
	if (field.isBusted16) {
		hazards -= Math.floor(defender.maxHP / 16);
		hazardText.push("1/16th Disguise damage");
	}
	// Exit early if the defender isn't affected by SR/Spikes
	if ("Magic Guard" === defender.curAbility || "Heavy-Duty Boots" === defender.item) {
		return hazards;
	}
	if (field.isSR) {
		let effectiveness = typeChart["Rock"][defender.type1] * (defender.type2 ? typeChart["Rock"][defender.type2] : 1);
		hazards -= Math.floor(effectiveness * defender.maxHP / 8);
		hazardText.push("Stealth Rock");
	}
	// Exit early if the defender isn't grounded
	if (!isGrounded(defender, field)) {
		return hazards;
	}
	if (field.spikes === 1) {
		hazards -= Math.floor(defender.maxHP / 8);
		if (gen === 2) {
			hazardText.push("Spikes");
		} else {
			hazardText.push("1 layer of Spikes");
		}
	} else if (field.spikes === 2) {
		hazards -= Math.floor(defender.maxHP / 6);
		hazardText.push("2 layers of Spikes");
	} else if (field.spikes === 3) {
		hazards -= Math.floor(defender.maxHP / 4);
		hazardText.push("3 layers of Spikes");
	}
	if (isNaN(hazards)) {
		console.log("calcHazards() encountered NaN and returned 0.");
		hazards = 0;
	}
	return hazards;
}

// eot = end of turn
function calcWeatherEOT(defender, field, eotText, eotHealingText) {
	if (defender.curAbility === "Magic Guard") {
		return 0;
	}
	let eot = 0;
	if (field.weather.includes("Sun") && ["Dry Skin", "Solar Power"].includes(defender.curAbility)) {
		eot -= Math.floor(defender.maxHP / (defender.isDynamax ? 16 : 8));
		eotText.push(defender.curAbility + " damage");
	} else if (field.weather.includes("Rain")) {
		if (defender.curAbility === "Dry Skin") {
			eot += Math.floor(defender.maxHP / (defender.isDynamax ? 16 : 8));
			eotHealingText.push("Dry Skin recovery");
		} else if (defender.curAbility === "Rain Dish") {
			eot += Math.floor(defender.maxHP / (defender.isDynamax ? 32 : 16));
			eotHealingText.push("Rain Dish recovery");
		}
	} else if (field.weather === "Sand" && !defender.hasType("Rock") && !defender.hasType("Ground") && !defender.hasType("Steel") &&
		!["Overcoat", "Sand Force", "Sand Rush", "Sand Veil"].includes(defender.curAbility) &&
		defender.item !== "Safety Goggles") {
		eot -= Math.floor(defender.maxHP / (defender.isDynamax ? 32 : 16));
		eotText.push("sandstorm damage");
	} else if (defender.curAbility === "Ice Body" && (field.weather === "Hail" || field.weather === "Snow")) {
		eot += Math.floor(defender.maxHP / (defender.isDynamax ? 32 : 16));
		eotHealingText.push("Ice Body recovery");
	} else if (field.weather === "Hail" && !defender.hasType("Ice") && !["Overcoat", "Snow Cloak"].includes(defender.curAbility) &&
		defender.item !== "Safety Goggles") {
		eot -= Math.floor(defender.maxHP / (defender.isDynamax ? 32 : 16));
		eotText.push("hail damage");
	}

	return eot;
}

function calcOtherEOT(attacker, defender, field, eotText, eotHealingText) {
	let eot = 0;
	if (defender.item === "Leftovers") {
		eot += Math.floor(defender.maxHP / (defender.isDynamax ? 32 : 16));
		eotHealingText.push("Leftovers recovery");
	} else if (defender.item === "Black Sludge") {
		if (defender.hasType("Poison")) {
			eot += Math.floor(defender.maxHP / (defender.isDynamax ? 32 : 16));
			eotHealingText.push("Black Sludge recovery");
		} else if (defender.curAbility !== "Magic Guard") {
			eot -= Math.floor(defender.maxHP / (defender.isDynamax ? 16 : 8));
			eotText.push("Black Sludge damage");
		}
	}

	if (field.isSeeded && defender.curAbility !== "Magic Guard") {
		eot -= Math.floor(defender.maxHP / (defender.isDynamax ? 16 : 8));
		eotText.push("Leech Seed damage");
	}

	if (field.terrain === "Grassy" && isGrounded(defender, field)) {
		eot += Math.floor(defender.maxHP / (defender.isDynamax ? 32 : 16));
		eotHealingText.push("Grassy Terrain recovery");
	}

	var toxicCounter = 0;
	if (defender.status === "Poisoned") {
		if (defender.curAbility === "Poison Heal") {
			eot += Math.floor(defender.maxHP / (defender.isDynamax ? 16 : 8));
			eotHealingText.push("Poison Heal");
		} else if (defender.curAbility !== "Magic Guard") {
			eot -= Math.floor(defender.maxHP / (defender.isDynamax ? 16 : 8));
			eotText.push("poison damage");
		}
	} else if (defender.status === "Badly Poisoned") {
		if (defender.curAbility === "Poison Heal") {
			eot += Math.floor(defender.maxHP / (defender.isDynamax ? 16 : 8));
			eotHealingText.push("Poison Heal");
		} else if (defender.curAbility !== "Magic Guard") {
			eotText.push("toxic damage");
			toxicCounter = defender.toxicCounter;
		}
	} else if (defender.status === "Burned" && defender.curAbility !== "Magic Guard") {
		let text = "burn damage";
		let divisor = gen >= 7 ? 16 : 8;
		if (defender.curAbility === "Heatproof") {
			divisor *= 2;
			text = defender.curAbility + " " + text;
		}
		if (defender.isDynamax) {
			divisor *= 2;
		}
		eot -= Math.floor(defender.maxHP / divisor);
		eotText.push(text);
	} else if (defender.status === "Asleep" && attacker.curAbility === "Bad Dreams" && defender.curAbility !== "Magic Guard") {
		eot -= Math.floor(defender.maxHP / (defender.isDynamax ? 16 : 8));
		eotText.push("Bad Dreams");
	}

	return eot;
}

function writeAfterText(afterTextArr, berryText) {
	if ((!afterTextArr || !afterTextArr.length) && !berryText) {
		return "";
	}
	if (berryText) {
		if (!afterTextArr) {
			afterTextArr = [berryText];
		} else {
			afterTextArr.push(berryText);
		}
	}
	return " after " + serializeText(afterTextArr);
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
