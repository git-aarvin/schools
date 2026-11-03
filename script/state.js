export const types = { T: "#185fa5", R: "#a32d2d", S: "#0f6e56" };
export let preview = false;
export const togglePreview = () => (preview = !preview);
export const next = { S: "T", T: "R", R: "S" };
export const columns = [394, 474, 554];
export const school = (name, quality, price, type, gap) => ({
	name,
	quality,
	price,
	type,
	gap: !!gap,
});
const base = {
	title: "Schools",
	note: "",
	numbers: true,
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
export const state = structuredClone(base);
export const valid = data =>
	data &&
	Array.isArray(data.headings) &&
	data.headings.length === 4 &&
	Array.isArray(data.rows) &&
	data.rows.length &&
	data.rows.every(
		row =>
			row &&
			typeof row.name === "string" &&
			row.quality >= 1 &&
			row.quality <= 3 &&
			row.price >= 0 &&
			row.price <= 2 &&
			types[row.type]
	);
export const apply = data => {
	state.headings = data.headings;
	state.rows = data.rows;
	state.title = data.title ?? "";
	state.note = data.note ?? "";
	state.numbers = data.numbers !== false;
	state.scheme = data.scheme === "dark" ? "dark" : "light";
};
export const history = [JSON.stringify(state)];
export let cursor = 0;
let field = null;
const listeners = new Set();
export const watch = listener => listeners.add(listener);
const notify = saved => listeners.forEach(listener => listener(saved));
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
	const data = structuredClone(base);
	data.rows = [school("", 1, 0, "T")];
	apply(data);
	change();
};
addEventListener("focusout", () => (field = null));
