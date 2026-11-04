import { jump } from "./state.js";
import { open, save } from "./file.js";
import { image } from "./output.js";
const platform = navigator.userAgentData?.platform || navigator.platform || "";
export const modifier = /Mac|iP(hone|ad|od)/.test(platform) ? "⌘" : "Ctrl";
export const listen = () => {
	document.querySelectorAll("kbd").forEach(node => {
		node.textContent = node.textContent.replaceAll("Ctrl", modifier);
	});
	addEventListener("keydown", event => {
		if (
			(!event.ctrlKey && !event.metaKey) ||
			event.altKey ||
			event.isComposing ||
			typeof event.key !== "string"
		)
			return;
		const key = event.key.toLowerCase();
		if (key === "z" || key === "y") {
			if (key === "y" && event.shiftKey) return;
			jump(key === "y" || event.shiftKey ? 1 : -1);
		} else if (event.shiftKey) return;
		else if (key === "o" || key === "s" || key === "e" || key === "p") {
			if (!event.repeat) {
				if (key === "o") open();
				else if (key === "s") save();
				else if (key === "e") image();
				else print();
			}
		} else return;
		event.preventDefault();
	});
};
