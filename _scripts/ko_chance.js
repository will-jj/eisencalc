var eotWeather = 0;
var eotTotal = 0;
var berryRecovery = 0;
var berryThreshold = 0;
var toxicCounter = 0;
function setKOChanceText(result, move, moveHits, attacker, defender, field, damageInfo, firstHitDamageInfo) {
	// damageInfo contains a damageMap, which maps damage values to # of instances of that damage value.
	// For multihit moves, the damageMap is the sum of however many hits were defined, and does not represent an individual strike.
	// damageInfo also contains a property mapCombinations, which represents the total number of combinations of damage values.
	// firstHitDamageInfo is the same as damageInfo, but accounts for one-time mods like resist berries. If there are none of these mods, firstHitMap is simply set to damageMap

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
			let modStages = getStages(accMods - evaMods);
			let otherAccMods = getOtherAccMods(move, attacker, defender, field);
			moveAccuracy = Math.min(moveAccuracy * modStages * otherAccMods, 100);
		}
	}

	// Set up berry values
	let berryText = setUpBerryValues(attacker, defender);

	// Set up eot (end-of-turn) and hazard damage, and text
	let eotText = [];
	let eotHealingText = [];
	let hazardText = [];
	let effectiveDefenderItem = defenderHasItem(move.name, attacker.item) ? defender.item : "";
	eotWeather = calcWeatherEOT(defender, effectiveDefenderItem, field, eotText, eotHealingText);
	eotTotal = eotWeather + calcOtherEOT(attacker, defender, effectiveDefenderItem, field, eotText, eotHealingText);

	let targetHP = defender.curHP + calcHazards(defender, field, hazardText);

	// Check if a multihit can OHKO.
	let multiResult = checkMultiHitOHKO(moveHits, result, targetHP, attacker, defender, move, damageInfo, firstHitDamageInfo);
	if (multiResult && multiResult.hitCount <= moveHits && multiResult.koCombinations) {
		// checkMultiHitOHKO() uses the base damage of each strike to calculate, so the mapCombinations need to be based on that too.
		let temp = damageInfo.mapCombinations;
		damageInfo.mapCombinations = result.damage.length ** multiResult.hitCount;
		setResultText(result, move, 1, moveAccuracy, multiResult.koCombinations, damageInfo, multiResult.printEOTText ? hazardText.concat(eotText) : hazardText, multiResult.berryKO ? berryText : "");
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

	// Check for OHKO chance
	if (firstHitDamageInfo.min >= targetHP) {
		setResultText(result, move, 1, moveAccuracy, GUARANTEED, damageInfo, hazardText, "");
		return;
	} else if (checkHPThreshold(targetHP + berryRecovery, 0, firstHitDamageInfo.min, defender.maxHP)) {
		// since there was not a KO from the first condition, this OHKO could only be guaranteed by eot damage
		setResultText(result, move, 1, moveAccuracy, GUARANTEED, damageInfo, hazardText.concat(eotText), "");
		return;
	} else if (firstHitDamageInfo.max >= targetHP || checkHPThreshold(targetHP + berryRecovery, 0, firstHitDamageInfo.max, defender.maxHP)) {
		let koCombinations = 0;
		for (const [damageValue, combinations] of firstHitDamageInfo.damageMap.entries()) {
			if (damageValue >= targetHP || checkHPThreshold(targetHP + berryRecovery, 0, damageValue, defender.maxHP)) {
				koCombinations += combinations;
			}
		}
		// if the defender holds a berry, then eot can't contribute to any OHKOs, so don't print eot
		// this is checking hits that bypass berry recovery, so no berryText. Triple Axel could print berryText but that isn't accounted for
		setResultText(result, move, 1, moveAccuracy, koCombinations, damageInfo, berryRecovery ? hazardText : hazardText.concat(eotText), "");
		return;
	}

	// apply all eot text
	hazardText = hazardText.concat(eotText, eotHealingText);

	// Calc 2-4HKO
	let nhkoResult = calculateNHKO(4, targetHP, defender.maxHP, damageInfo, firstHitDamageInfo);
	if (nhkoResult) {
		setResultText(result, move, nhkoResult.hitCount, moveAccuracy, nhkoResult.koCombinations, damageInfo, hazardText, nhkoResult.berryKO ? berryText : "");
		return;
	}

	// 5+HKO. Assume that any held berry will be/has been eaten.
	for (let hitCount = 5; hitCount <= 9; hitCount++) {
		let nonAttackedHP = targetHP + berryRecovery + (hitCount - 1) * eotTotal;
		// even though it's easy to give an accurate chance of a 5+HKO with damage maps, keep the output text simple.
		if (checkHPThreshold(nonAttackedHP, 0, firstHitDamageInfo.min + damageInfo.min * (hitCount - 1), defender.maxHP)) {
			setResultText(result, move, hitCount, moveAccuracy, GUARANTEED, false, hazardText, berryText);
			return;
		} else if (checkHPThreshold(nonAttackedHP, 0, firstHitDamageInfo.max + damageInfo.max * (hitCount - 1), defender.maxHP)) {
			setResultText(result, move, hitCount, moveAccuracy, 0, false, hazardText, berryText);
			return;
		}
		if (toxicCounter > 0) {
			toxicCounter = Math.min(toxicCounter + 1, 16);
		}
	}

	result.koChanceText = "every bit counts";
	result.afterText = "";
}

const GUARANTEED = "guaranteed";
function setResultText(result, move, hitCount, moveAccuracy, koCombinations, damageInfo, afterTextArr, berryText) {
	// both ap_calc (primary calc) and honk_calc (mass calc) use koChanceText
	// honk: honk's output table only uses koChanceText; not afterText nor afterAccText
	// ap: the main result displayed uses koChanceText + afterText + afterAccText
	// ap: click-to-copy uses koChanceText + afterText and not afterAccText

	let hko = (hitCount == 1 ? "O" : hitCount) + "HKO";
	let finalAcc = (moveAccuracy / 100) ** hitCount;
	if (koCombinations === GUARANTEED) {
		result.koChanceText = GUARANTEED + " " + hko;
	} else if (hitCount >= 5) {
		result.koChanceText = "possible " + hko;
	} else if (typeof koCombinations == "number") {
		let koChance = powerDivision(koCombinations, damageInfo.mapCombinations, hitCount);
		if (koChance == 1) {
			result.koChanceText = GUARANTEED + " " + hko;
		} else {
			let printedKOChance = Math.round(koChance * 1000) / 10;
			result.koChanceText = (printedKOChance == 0 ? "Miniscule" : printedKOChance) + "% chance to " + hko;
			finalAcc *= koChance;
		}
	} else {
		result.koChanceText = "unknown% chance to " + hko;
	}

	if (moveAccuracy < 100 && !result.tripleAxelDamage && move.name !== "Population Bomb") {
		let printedAfterAcc = (100 * finalAcc).toFixed(1);
		if (printedAfterAcc == 0) {
			printedAfterAcc = "~0";
		}
		result.afterAccText = " (" + printedAfterAcc + "% chance";
		if (hitCount > 1 || typeof koCombinations == "number") {
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
	if (defender.item === "Sitrus Berry") {
		berryRecovery = Math.floor(defender.maxHP / 4);
		berryThreshold = Math.floor(defender.maxHP / 2);
	} else if (["Figy Berry", "Iapapa Berry", "Wiki Berry", "Aguav Berry", "Mago Berry"].includes(defender.item)) {
		berryRecovery = Math.floor(defender.maxHP / (gen <= 6 ? 8 : (gen == 7 ? 2 : 3)));
		berryThreshold = Math.floor(defender.maxHP / (defender.curAbility === "Gluttony" ? 2 : 4));
	} else {
		return "";
	}

	let berryText = defender.item + " recovery";
	if (defender.curAbility === "Cheek Pouch") {
		// suppose a hit damages a Cheek Pouch Sitrus user to 49%. Then it is healed to 100%, not 107% like this code is doing.
		// this is difficult to accomodate with ranges across multiple hits, so I'm ignoring it right now.
		berryRecovery += Math.floor(defender.maxHP / 3);
		berryText = defender.curAbility + " " + berryText;
	} else if (defender.curAbility === "Ripen") {
		berryRecovery *= 2;
		berryText = defender.curAbility + " " + berryText;
	}
	return berryText;
}

// this function does a check on whether a multihit move can OHKO and bypass a healing berry.
function checkMultiHitOHKO(moveHits, result, targetHP, attacker, defender, move, damageInfo, firstHitDamageInfo) {
	if (moveHits == 1) {
		return; // return nothing
	}

	let baseHitDamage = result.firstHitDamage ? result.firstHitDamage : result.damage;
	if (baseHitDamage[0] >= targetHP) {
		return {
			hitCount: 1,
			koCombinations: GUARANTEED
		};
	}

	if (result.childDamage || result.tripleAxelDamage) {
		return; // easier to not deal with these types of damage in here right now. still apply first strike text
	}

	if (checkHPThreshold(targetHP + berryRecovery, 0, firstHitDamageInfo.min, defender.maxHP)) {
		return {
			hitCount: moveHits,
			koCombinations: GUARANTEED,
			berryKO: true,
			printEOTText: firstHitDamageInfo.min < targetHP + berryRecovery // only print eot text if the min damage isn't OHKOing the defender
		};
	}

	let multiDamageInfo = DamageInfo(result, 1);
	let multiFirstDamageInfo = result.firstHitDamage ? DamageInfo(result, 1, true) : multiDamageInfo;
	// pass in a maxHP of 0 so that toxic damage doesn't get applied
	let multiResult = calculateNHKO(moveHits, targetHP, 0, multiDamageInfo, multiFirstDamageInfo, true);

	if (!multiResult) {
		return;
	}

	multiResult.printEOTText = multiResult.koCombinations !== GUARANTEED;
	return multiResult;
}

function calculateNHKO(upperHitCount, targetHP, maxHP, damageInfo, firstHitDamageInfo, isCheckMultihitOHKO = false) {
	// nHitDamageMap is the combined map of previous hits. So when checking the 3HKO, it contains all damage possibilities from 2 hits.
	// It does not include any hits that proc'd berry nor accumulated eot. berryDamageMap is a counterpart that only contains hits that proc'd a berry (but did not KO)
	let nHitDamageMap;
	let berryDamageMap = new Map();
	if (berryRecovery == 0) {
		nHitDamageMap = firstHitDamageInfo.damageMap;
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

	let nextDamageMap;
	let nextBerryDamageMap;
	let koCombinations = 0;
	let berryKoCombinations = 0;
	for (let hitCount = 2; hitCount <= upperHitCount; hitCount++) {
		let isLastHit = hitCount == upperHitCount;
		let calcMaxHits = isCheckMultihitOHKO && !isLastHit;
		nextDamageMap = new Map();
		nextBerryDamageMap = new Map();
		let previousTurnsEot = isCheckMultihitOHKO ? 0 : (hitCount - 1) * eotTotal;

		if (checkHPThreshold(targetHP + berryRecovery + previousTurnsEot, 0, firstHitDamageInfo.min + damageInfo.min * (hitCount - 1), maxHP)) {
			return {
				hitCount: hitCount,
				koCombinations: GUARANTEED,
				berryKO: berryDamageMap.size > 0 // if there is any possibility of berry activating, print berry text
			};
		}

		// nHitDamageMap and berryDamageMap include the first hit damage.
		// loop through the values of "base damage", how much a single attack/turn deals
		for (let [baseValue, baseCount] of damageInfo.damageMap) {
			// loop through the values of accumulated damage from prior hits. e.g. when checking the 3HKO, it's the sum of 2 hits of damage.
			for (let [nHitValue, nHitCount] of nHitDamageMap) {
				let damageTotal = baseValue + nHitValue;
				let countTotal = baseCount * nHitCount;
				// checkHPThreshold() is not called here because it factors in eot, and this checks for KOs that did not proc a berry
				// if it can only get the KO with eot, then berry would proc instead. nHitDamageMap only contains damages that didn't activate berry.
				if (targetHP + previousTurnsEot <= damageTotal) {
					// a KO occurs
					if (calcMaxHits) {
						mapAddKey(nextDamageMap, damageTotal, countTotal);
					} else {
						koCombinations += countTotal;
					}
				} else if (checkHPThreshold(targetHP + berryRecovery + previousTurnsEot, 0, damageTotal, maxHP)) {
					// a KO occurs and a berry was eaten
					if (calcMaxHits) {
						mapAddKey(nextBerryDamageMap, damageTotal, countTotal);
					} else {
						berryKoCombinations += countTotal;
					}
				} else if (!calcMaxHits && (koCombinations || berryKoCombinations || isLastHit)) {
					// skip the following branches if the loop will be ending
				} else if (berryRecovery && checkHPThreshold(targetHP + previousTurnsEot, berryThreshold, damageTotal, maxHP)) {
					// no KO occurs and a berry was eaten
					mapAddKey(nextBerryDamageMap, damageTotal, countTotal);
				} else {
					// no KO occured, but a berry wasn't eaten (either it wasn't eaten or no berry is held)
					mapAddKey(nextDamageMap, damageTotal, countTotal);
				}
			}
			// loop through the values of accumulated damage from prior turns that activated a berry
			for (let [berryValue, berryCount] of berryDamageMap) {
				let damageTotal = baseValue + berryValue;
				let countTotal = baseCount * berryCount;
				if (checkHPThreshold(targetHP + berryRecovery + previousTurnsEot, 0, damageTotal, maxHP)) {
					// a KO occurs
					if (calcMaxHits) {
						mapAddKey(nextBerryDamageMap, damageTotal, countTotal);
					} else {
						berryKoCombinations += countTotal;
					}
				} else if (!calcMaxHits && (koCombinations || berryKoCombinations || isLastHit)) {
					// skip the following branch if the loop will be ending
				} else {
					// since a berry was already consumed, add this to the berry damageMap
					mapAddKey(nextBerryDamageMap, damageTotal, countTotal);
				}
			}
		}

		// If a KO was found, return that information
		// However if calcing a multihit OHKO, allow all strikes to be factored in
		if ((koCombinations || berryKoCombinations) && !calcMaxHits) {
			return {
				hitCount: hitCount,
				koCombinations: koCombinations + berryKoCombinations,
				berryKO: berryKoCombinations > 0
			};
		}

		nHitDamageMap = nextDamageMap;
		berryDamageMap = nextBerryDamageMap;
		if (toxicCounter) {
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
function calcWeatherEOT(defender, effectiveDefenderItem, field, eotText, eotHealingText) {
	if (defender.curAbility === "Magic Guard") {
		return 0;
	}
	// this effectively hardcodes a dynamax level of 10 and there's not enough reason to fix this
	let effectiveMaxHP = defender.isDynamax ? defender.maxHP / 2 : defender.maxHP;

	if (field.weather.includes("Sun") && ["Dry Skin", "Solar Power"].includes(defender.curAbility)) {
		eotText.push(defender.curAbility + " damage");
		return -Math.floor(effectiveMaxHP / 8);
	}
	if (field.weather.includes("Rain")) {
		if (defender.curAbility === "Dry Skin") {
			eotHealingText.push("Dry Skin recovery");
			return Math.floor(effectiveMaxHP / 8);
		} else if (defender.curAbility === "Rain Dish") {
			eotHealingText.push("Rain Dish recovery");
			return Math.floor(effectiveMaxHP / 16);
		}
		return 0;
	}
	if (field.weather === "Sand" && !defender.hasType("Rock") && !defender.hasType("Ground") && !defender.hasType("Steel") &&
		!["Overcoat", "Sand Force", "Sand Rush", "Sand Veil"].includes(defender.curAbility) &&
		effectiveDefenderItem !== "Safety Goggles") {
		eotText.push("sandstorm damage");
		return -Math.floor(effectiveMaxHP / 16);
	}
	if (defender.curAbility === "Ice Body" && ["Hail", "Snow"].includes(field.weather)) {
		eotHealingText.push("Ice Body recovery");
		return Math.floor(effectiveMaxHP / 16);
	} else if (field.weather === "Hail" && !defender.hasType("Ice") && !["Overcoat", "Snow Cloak"].includes(defender.curAbility) &&
		effectiveDefenderItem !== "Safety Goggles") {
		eotText.push("hail damage");
		return -Math.floor(effectiveMaxHP / 16);
	}

	return 0;
}

function calcOtherEOT(attacker, defender, effectiveDefenderItem, field, eotText, eotHealingText) {
	let eot = 0;
	// this effectively hardcodes a dynamax level of 10 and there's not enough reason to fix this
	let effectiveMaxHP = defender.isDynamax ? defender.maxHP / 2 : defender.maxHP;
	if (effectiveDefenderItem === "Leftovers") {
		eot += Math.floor(effectiveMaxHP / 16);
		eotHealingText.push("Leftovers recovery");
	} else if (effectiveDefenderItem === "Black Sludge") {
		if (defender.hasType("Poison")) {
			eot += Math.floor(effectiveMaxHP / 16);
			eotHealingText.push("Black Sludge recovery");
		} else if (defender.curAbility !== "Magic Guard") {
			eot -= Math.floor(effectiveMaxHP / 8);
			eotText.push("Black Sludge damage");
		}
	}

	if (field.isSeeded && defender.curAbility !== "Magic Guard") {
		eot -= Math.floor(effectiveMaxHP / 8);
		eotText.push("Leech Seed damage");
	}

	if (field.terrain === "Grassy" && isGrounded(defender, field)) {
		eot += Math.floor(effectiveMaxHP / 16);
		eotHealingText.push("Grassy Terrain recovery");
	}

	toxicCounter = 0;
	if (defender.status === "Poisoned") {
		if (defender.curAbility === "Poison Heal") {
			eot += Math.floor(effectiveMaxHP / 8);
			eotHealingText.push("Poison Heal");
		} else if (defender.curAbility !== "Magic Guard") {
			eot -= Math.floor(effectiveMaxHP / 8);
			eotText.push("poison damage");
		}
	} else if (defender.status === "Badly Poisoned") {
		if (defender.curAbility === "Poison Heal") {
			eot += Math.floor(effectiveMaxHP / 8);
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
		eot -= Math.floor(effectiveMaxHP / divisor);
		eotText.push(text);
	} else if (defender.status === "Asleep" && attacker.curAbility === "Bad Dreams" && defender.curAbility !== "Magic Guard") {
		eot -= Math.floor(effectiveMaxHP / 8);
		eotText.push("Bad Dreams");
	}

	return eot;
}

function defenderHasItem(moveName, attackerItem) {
	return moveName !== "Knock Off" && !(!attackerItem && ["Thief", "Covet"].includes(moveName));
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
	if (stages >= 0) {
		return (Math.min(stages, 6) + 3) / 3;
	}
	return 3 / (Math.max(-stages, -6) + 3);
}

function getOtherAccMods(move, attacker, defender, field) {
	let mods = 1;

	if (attacker.isVictoryStar) {
		mods *= 1.1;
	}
	if (attacker.item === "Wide Lens") {
		mods *= 1.1;
	}
	if (attacker.item === "Zoom Lens" && attacker.stats.sp < defender.stats.sp) {
		mods *= 1.2;
	}
	if (["Bright Powder", "Lax Incense"].includes(defender.item)) {
		mods *= 0.9;
	}
	if (attacker.ability === "Compound Eyes") {
		mods *= 1.3;
	}
	if (attacker.ability === "Hustle" && move.category === "Physical") {
		mods *= 0.8;
	}
	if ((field.weather === "Sand" && defender.ability === "Sand Veil") ||
		(["Hail", "Snow"].includes(field.weather) && defender.ability === "Snow Cloak")) {
		mods *= 0.8;
	}
	if (defender.curAbility === "Tangled Feet" && defender.status === "Confused") {
		mods *= 0.5;
	}
	if (field.isGravity) {
		mods *= 5 / 3;
	}

	return mods;
}
