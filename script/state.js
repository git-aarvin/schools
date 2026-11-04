const table = entries => Object.assign(Object.create(null), entries);
export const types = table({ T: "#185fa5", R: "#a32d2d", S: "#0f6e56" });
export const limit = 100;
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
		school("UW Seattle", 3, 0, "T"),
		school("Georgia Tech", 3, 1, "R"),
		school("Virginia Tech", 2, 1, "T", 1),
		school("UC Berkeley", 3, 2, "R"),
		school("Michigan Ann Arbor", 3, 2, "R", 1),
		school("Texas A&M", 1, 1, "S"),
		school("Arizona State", 1, 1, "S"),
	],
};
export const state = clone(base);
const text = (value, max) => typeof value === "string" && value.length <= max;
export const valid = data =>
	!!data &&
	(data.match == null || typeof data.match === "boolean") &&
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
			Number.isInteger(row.quality) &&
			row.quality >= 1 &&
			row.quality <= 3 &&
			Number.isInteger(row.price) &&
			row.price >= 0 &&
			row.price <= 2 &&
			!!types[row.type]
	);
export const apply = data => {
	state.headings = data.headings.slice(0, 4).map(value => String(value).slice(0, 100));
	state.rows = data.rows
		.slice(0, limit)
		.map(row =>
			school(String(row.name).slice(0, 40), row.quality, row.price, row.type, row.gap)
		);
	state.title = String(data.title ?? "").slice(0, 100);
	state.note = String(data.note ?? "").slice(0, 100);
	state.numbers = data.numbers !== false;
	state.match = data.match === true;
	state.scheme = data.scheme === "dark" ? "dark" : "light";
};
export const history = [JSON.stringify(state)];
export let cursor = 0;
let field = null;
const listeners = new Set();
export const watch = listener => listeners.add(listener);
const notify = saved => listeners.forEach(listener => listener(saved));
export const load = data => {
	apply(data);
	history.length = 0;
	history.push(JSON.stringify(state));
	cursor = 0;
	field = null;
	notify(false);
};
export const refresh = () => notify(false);
const commit = key => {
	const text = JSON.stringify(state);
	if (text === history[cursor]) return false;
	history.length = cursor + 1;
	if (key && key === field) history[cursor] = text;
	else {
		history.push(text);
		cursor++;
		if (history.length > 300) {
			history.shift();
			cursor--;
		}
	}
	field = key || null;
	return true;
};
export const change = key => notify(commit(key));
export const jump = step => {
	const target = cursor + step;
	if (target < 0 || target >= history.length) return;
	cursor = target;
	field = null;
	apply(JSON.parse(history[cursor]));
	notify(true);
};
export const reset = () => {
	const data = clone(base);
	data.rows = [school("", 1, 0, "T")];
	apply(data);
	change();
};
addEventListener("focusout", () => (field = null));
