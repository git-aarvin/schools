import { watch } from "./state.js";
import { draw } from "./page.js";
import { persist } from "./file.js";
import { listen } from "./key.js";
import { restore } from "./share.js";
watch(saved => {
	draw();
	if (saved) persist();
});
listen();
draw();
restore();
addEventListener("hashchange", restore);
