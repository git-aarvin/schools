import { jump, preview } from "./state.js";
import { open, save } from "./file.js";
import { image } from "./output.js";
export const modifier = /Mac|iP(hone|ad)/.test(navigator.platform)
	? "⌘"
	: "Ctrl";
export const listen = () => {
	document.querySelectorAll("kbd").forEach(node => {
		node.textContent = node.textContent.replaceAll("Ctrl", modifier);
	});
	addEventListener("keydown", event => {
		if (
			(!event.ctrlKey && !event.metaKey) ||
			event.altKey ||
			event.shiftKey
		)
			return;
		const key = event.key.toLowerCase();
		if (key === "z" || key === "y") {
			if (!preview) jump(key === "z" ? -1 : 1);
		} else if (key === "o") open();
		else if (key === "s") save();
		else if (key === "e") image();
		else if (key === "p") print();
		else return;
		event.preventDefault();
	});
};
