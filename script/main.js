import { watch } from "./state.js";
import { draw } from "./page.js";
import { persist } from "./file.js";
import { listen } from "./key.js";
watch(saved => {
	draw();
	if (saved) persist();
});
listen();
draw();
