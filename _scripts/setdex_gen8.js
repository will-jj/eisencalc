var reloadSSScript = function () {
	components = [
		SETDEX_GEN8_SETS,
		SETDEX_CUSTOM
	];

	for (var i = 0; i < components.length; i++) {
		sourceDex = components[i];
		if (sourceDex) {
			for (var p in sourceDex) {
				if (sourceDex.hasOwnProperty(p)) {
					SETDEX_GEN8[p] = $.extend(SETDEX_GEN8[p], sourceDex[p]);
				}
			}
		}
	}
};
