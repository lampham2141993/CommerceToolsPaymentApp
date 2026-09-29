// NOT TO BE USED IN PRODUCTION
class Guid {
	static NewGuid = (noHyphens?: boolean) => {
		var d = new Date().getTime();
		if (typeof performance !== "undefined" && typeof performance.now === "function") {
			d += performance.now();
		}

		var shellGuid = noHyphens ? "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx" : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";

		return shellGuid.replace(/[xy]/g, function (c) {
			var r = (d + Math.random() * 16) % 16 | 0;
			d = Math.floor(d / 16);
			return (c === "x" ? r : r & (0x3 | 0x8)).toString(16);
		});
	};

	static Empty = "00000000-0000-0000-0000-000000000000";

	static IsGuid = (guid: string) => /^([0-9a-fA-F]{8})-(([0-9a-fA-f]{4}-){3})([0-9a-fA-f]{12})$/i.test(guid);
}

export { Guid };
