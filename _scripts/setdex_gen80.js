var reloadBDSPScript = function () {
	console.log(SETDEX_CUSTOM);
	components = [
		SETDEX_GEN80_SETS,
		SETDEX_CUSTOM
	];

	for (var i = 0; i < components.length; i++) {
		sourceDex = components[i];
		if (sourceDex) {
			for (var p in sourceDex) {
				if (sourceDex.hasOwnProperty(p)) {
					SETDEX_GEN80[p] = $.extend(SETDEX_GEN80[p], sourceDex[p]);
				}
			}
		}
	}
};
