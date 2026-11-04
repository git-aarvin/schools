const table = entries => Object.assign(Object.create(null), entries);
export const types = table({ T: "#185fa5", R: "#a32d2d", S: "#0f6e56" });
export const limit = 100;
export const max = { name: 40, heading: 14, title: 30, note: 37 };
export const strip = value => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
const clone = value => JSON.parse(JSON.stringify(value));
export const next = table({ S: "T", T: "R", R: "S" });
export const columns = [394, 474, 554];
export const school = (name, quality, price, type, gap) => ({
	name,
	quality,
	price,
	type,
	gap: !!gap,
});
export const base = {
	title: "Schools",
	note: "",
	numbers: true,
	match: false,
	scheme: "light",
	headings: ["Quality", "$$", "$$$", "$$$+"],
	rows: [
		school("University of Washington", 3, 0, "T"),
		school("Georgia", 3, 1, "R"),
		school("Virginia", 2, 1, "T", 1),
		school("Berkeley", 3, 2, "R"),
		school("University of Michigan", 3, 2, "R", 1),
		school("Texas", 1, 1, "S"),
		school("Arizona", 1, 1, "S"),
	],
};
export const state = clone(base);
const text = (value, max) => typeof value === "string" && value.length <= max;
export const valid = data =>
	!!data &&
	(data.match == null || typeof data.match === "boolean") &&
	(data.title == null || text(data.title, 100)) &&
	(data.note == null || text(data.note, 100)) &&
	Array.isArray(data.headings) &&
	data.headings.length === 4 &&
	data.headings.every(value => text(value, 100)) &&
	Array.isArray(data.rows) &&
	data.rows.length > 0 &&
	data.rows.length <= limit &&
	data.rows.every(
		row =>
			!!row &&
			text(row.name, 100) &&
			(row.gap == null || typeof row.gap === "boolean") &&
			Number.isInteger(row.quality) &&
			row.quality >= 1 &&
			row.quality <= 3 &&
			Number.isInteger(row.price) &&
			row.price >= 0 &&
			row.price <= 2 &&
			!!types[row.type]
	);
export const apply = data => {
	state.headings = data.headings.slice(0, 4).map(value => strip(String(value)).slice(0, max.heading));
	state.rows = data.rows
		.slice(0, limit)
		.map(row =>
			school(strip(String(row.name)).slice(0, max.name), row.quality, row.price, row.type, row.gap)
		);
	state.title = strip(String(data.title ?? "")).slice(0, max.title);
	state.note = strip(String(data.note ?? "")).slice(0, max.note);
	state.numbers = data.numbers !== false;
	state.match = data.match === true;
	state.scheme = data.scheme === "dark" ? "dark" : "light";
};
export const stack = [JSON.stringify(state)];
export let cursor = 0;
export let dirty = false;
export const clean = () => (dirty = false);
let field = null;
const listeners = new Set();
export const watch = listener => listeners.add(listener);
const notify = saved => listeners.forEach(listener => listener(saved));
export const load = data => {
	apply(data);
	stack.length = 0;
	stack.push(JSON.stringify(state));
	cursor = 0;
	field = null;
	clean();
	notify(false);
};
export const refresh = () => notify(false);
const commit = key => {
	const text = JSON.stringify(state);
	if (text === stack[cursor]) return false;
	stack.length = cursor + 1;
	if (key && key === field) stack[cursor] = text;
	else {
		stack.push(text);
		cursor++;
		if (stack.length > 300) {
			stack.shift();
			cursor--;
		}
	}
	field = key || null;
	return true;
};
export const change = key => {
	const saved = commit(key);
	if (saved) dirty = true;
	notify(saved);
};
export const jump = step => {
	const target = cursor + step;
	if (target < 0 || target >= stack.length) return;
	cursor = target;
	field = null;
	apply(JSON.parse(stack[cursor]));
	dirty = true;
	notify(true);
};
export const reset = () => {
	const data = clone(base);
	data.rows = [school("", 1, 0, "T")];
	apply(data);
	change();
};
addEventListener("focusout", () => (field = null));
