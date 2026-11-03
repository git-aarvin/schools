import { markup, mount, vector } from "./view.js";
import {
	state,
	history,
	cursor,
	preview,
	togglePreview,
	reset,
	change,
	jump,
} from "./state.js";
import { Chart } from "./chart.js";
import { label, open, save } from "./file.js";
import { image, table } from "./output.js";
import { modifier } from "./key.js";
import { toast } from "./notice.js";
import { share } from "./share.js";
const Icon = path =>
	vector`<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
const Editor = () =>
	markup`<div class="toolbar"><button type="button" title="Undo (${modifier}+Z)" disabled="${preview || cursor < 1}" onclick="${() =>
		jump(-1)}">${Icon("M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11")}</button><button type="button" title="Redo (${modifier}+Y)" disabled="${preview || cursor >= history.length - 1}" onclick="${() =>
		jump(1)}">${Icon("m15 14 5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13")}</button><button type="button" title="Reset" disabled="${preview}" onclick="${() => {
		reset();
		toast("Reset");
	}}">${Icon("M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5")}</button><button type="button" class="${state.numbers ? "" : "muted"}" title="Numbers" disabled="${preview}" onclick="${() => {
		state.numbers = !state.numbers;
		change();
	}}">${Icon("M4 9h16M4 15h16M10 3 8 21M16 3l-2 18")}</button><button type="button" title="Switch to ${state.scheme === "dark" ? "light" : "dark"} color scheme" disabled="${preview}" aria-label="Switch to ${state.scheme === "dark" ? "light" : "dark"} color scheme" onclick="${() => {
		state.scheme = state.scheme === "dark" ? "light" : "dark";
		change();
	}}">${Icon(state.scheme === "dark" ? "M12 3v2m0 14v2m9-9h-2M5 12H3m15.36-6.36-1.42 1.42M7.06 16.94l-1.42 1.42m12.72 0-1.42-1.42M7.06 7.06 5.64 5.64M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" : "M20.9 13.1A8.5 8.5 0 0 1 10.9 3.1 8.5 8.5 0 1 0 20.9 13.1z")}</button><span class="status" title="File">${label || ""}</span><button type="button" class="${preview ? "" : "muted"}" title="${preview ? "Exit preview" : "Preview"}" aria-label="${preview ? "Exit preview" : "Preview"}" aria-pressed="${preview}" onclick="${() => {
		togglePreview();
		if (preview) document.activeElement?.blur();
		draw();
	}}">${Icon("M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z")}</button><button type="button" title="Open (${modifier}+O)" onclick="${() =>
		open()}">${Icon("M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6")}</button><button type="button" title="Save (${modifier}+S)" onclick="${() =>
		save()}">${Icon("M4 3h13l3 3v15H4zM8 3v6h8V3M8 21v-7h8v7")}</button><button type="button" title="Export CSV" onclick="${() =>
		table()}">${Icon("M3 3h18v18H3zM3 9h18M9 3v18")}</button><button type="button" title="Export PNG (${modifier}+E)" onclick="${() =>
		image()}">${Icon("M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 6.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 1 1 0-3M21 15l-4-4-9 9")}</button><button type="button" title="Share" aria-label="Share" onclick="${() =>
		share()}">${Icon("M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0-6zM8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98")}</button></div>${Chart()}`;
export const draw = () => {
	const host = document.getElementById("host");
	host.classList.toggle("preview", preview);
	return mount(host, Editor());
};
