import { markup, mount } from "./view.js";
import { state, history, cursor, reset, change, jump } from "./state.js";
import { Chart } from "./chart.js";
import { label, open, save } from "./file.js";
import { image, table } from "./output.js";
import { modifier } from "./key.js";
import { toast } from "./notice.js";
import { share } from "./share.js";
import { Icon } from "./icons.js";
const Editor = () =>
	markup`<div class="toolbar" role="toolbar" aria-label="Chart tools"><button type="button" title="Undo (${modifier}+Z)" aria-label="Undo" disabled="${cursor < 1}" onclick="${() =>
		jump(-1)}">${Icon("undo")}</button><button type="button" title="Redo (${modifier}+Y)" aria-label="Redo" disabled="${cursor >= history.length - 1}" onclick="${() =>
		jump(1)}">${Icon("redo")}</button><button type="button" title="Clear" aria-label="Clear" onclick="${() => {
		reset();
		toast("Cleared");
	}}">${Icon("clear")}</button><button type="button" class="${state.numbers ? "" : "muted"}" title="Numbers" aria-label="Numbers" aria-pressed="${String(!!state.numbers)}" onclick="${() => {
		state.numbers = !state.numbers;
		change();
	}}">${Icon("numbers")}</button><button type="button" title="Switch to ${state.scheme === "dark" ? "light" : "dark"} chart colors" aria-label="Switch to ${state.scheme === "dark" ? "light" : "dark"} chart colors" onclick="${() => {
		state.scheme = state.scheme === "dark" ? "light" : "dark";
		change();
	}}">${Icon(state.scheme === "dark" ? "sun" : "moon")}</button><span class="status" title="File" role="status">${label || ""}</span><button type="button" title="Open (${modifier}+O)" aria-label="Open" onclick="${() =>
		open()}">${Icon("open")}</button><button type="button" title="Save (${modifier}+S)" aria-label="Save" onclick="${() =>
		save()}">${Icon("save")}</button><button type="button" title="Export CSV" aria-label="Export CSV" onclick="${() =>
		table()}">${Icon("csv")}</button><button type="button" title="Export PNG (${modifier}+E)" aria-label="Export PNG" onclick="${() =>
		image()}">${Icon("png")}</button><button type="button" title="Share" aria-label="Share" onclick="${() =>
		share()}">${Icon("share")}</button></div>${Chart()}`;
export const draw = () => mount(document.getElementById("host"), Editor());
