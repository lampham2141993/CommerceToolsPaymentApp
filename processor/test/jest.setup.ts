import { jest } from "@jest/globals";

// Silences the excessive and repetitive logs from node_modules/winston/lib/winston/transports/console.js:79:23
// @ts-ignore
if (console._stdout?.write) {
	// @ts-ignore
	console._stdout.write = jest.fn();
}
