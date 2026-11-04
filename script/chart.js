import { vector } from "./view.js";
import { state, types, next, columns, school, change, refresh, limit, max, strip } from "./state.js";
import { family, fits } from "./font.js";
import { suggest, navigate } from "./autocomplete.js";
import { toast } from "./notice.js";
export const width = 620;
export const crop = 34;
export const bounds = width - crop;
const margin = 12;
const kinds = { T: "Target", R: "Reach", S: "Safety" };
const targetLabel = () => (state.match ? "Match" : "Target");
const toggleMatch = () => {
	state.match = !state.match;
	change();
};
const who = entry => entry.name || "school";
const palette = () =>
	state.scheme === "dark"
		? {
				background: "#1a1a1a",
				band: "#292929",
				stripe: "#353535",
				heading: "#ccc",
				separator: "#777",
				grid: "#555",
				number: "#aaa",
				text: "#f2f2f2",
				quality: "#f2f2f2",
				note: "#bbb",
			}
		: {
				background: "#fff",
				band: "#f2f2f2",
				stripe: "#e4e4e4",
				heading: "#555",
				separator: "#8f8f8f",
				grid: "#c8c8c8",
				number: "#6b6b6b",
				text: "#1a1a1a",
				quality: "#222",
				note: "#666",
			};
const layout = () => {
	let offset = 64;
	return state.rows.map((entry, index, rows) => {
		const item = { school: entry, index, offset };
		offset += entry.gap && index < rows.length - 1 ? 48 : 24;
		return item;
	});
};
const squares = (count, from = 0) =>
	Array.from(
		{ length: count - from },
		(item, index) => `M${284 + 12 * (index + from)}-4.5h9v9h-9z`
	).join("");
const press = action => event => {
	if (event.key === "Enter" || event.key === " ") {
		event.preventDefault();
		action();
	}
};
const add = index => {
	if (state.rows.length >= limit) {
		toast("Too many");
		return;
	}
	const entry = state.rows[index];
	const item = school(
		"College",
		entry.quality,
		entry.price,
		entry.type,
		entry.gap
	);
	entry.gap = false;
	state.rows.splice(index + 1, 0, item);
	change();
	document.querySelectorAll("input.name")[index + 1]?.select();
};
const remove = index => {
	if (state.rows.length < 2) return;
	const [entry] = state.rows.splice(index, 1);
	if (entry.gap && state.rows[index - 1]) state.rows[index - 1].gap = true;
	change();
};
const drag = (event, index) => {
	if (event.pointerType === "mouse" && event.button !== 0) return;
	event.preventDefault();
	const chart = document.getElementById("chart");
	let from = index;
	const track = current => {
		const box = chart.getBoundingClientRect();
		const offset = (width * (current.clientY - box.top)) / box.width - margin;
		let to = 0;
		let best = Infinity;
		layout().forEach((item, at) => {
			const distance = Math.abs(item.offset - offset);
			if (distance < best) {
				best = distance;
				to = at;
			}
		});
		if (to === from) return;
		const rows = state.rows;
		const gaps = rows.map(row => row.gap);
		const [entry] = rows.splice(from, 1);
		rows.splice(to, 0, entry);
		rows.forEach((row, at) => (row.gap = gaps[at]));
		from = to;
		refresh();
	};
	const stop = () => {
		removeEventListener("pointermove", track);
		removeEventListener("pointerup", stop);
		removeEventListener("pointercancel", stop);
		document.body.style.cursor = "";
		change();
	};
	addEventListener("pointermove", track, { passive: true });
	addEventListener("pointerup", stop);
	addEventListener("pointercancel", stop);
	document.body.style.cursor = "grabbing";
};
const move = index => event => {
	if (event.isComposing) return;
	if (navigate(event)) return;
	const key = event.key;
	const step = key === "ArrowDown" ? 1 : key === "ArrowUp" ? -1 : 0;
	if (key === "Enter") {
		event.preventDefault();
		add(index);
		return;
	}
	if (!step) return;
	event.preventDefault();
	const fields = [...document.querySelectorAll("input.name")];
	if (event.altKey) {
		const rows = state.rows;
		const target = index + step;
		if (target < 0 || target >= rows.length) return;
		const gaps = rows.map(row => row.gap);
		[rows[index], rows[target]] = [rows[target], rows[index]];
		rows.forEach((row, at) => (row.gap = gaps[at]));
		change();
		fields[target]?.focus();
	} else fields[index + step]?.focus();
};
const Header = (index, left, colors) =>
	vector`<text x="${left}" y="28" text-anchor="middle" font-size="11" fill="${colors.heading}" font-family="${family}">${state.headings[index]}</text><foreignObject class="edit" x="${left - 45}" y="14" width="90" height="20"><input class="middle" aria-label="Column heading ${index + 1}" maxlength="${max.heading}" value="${state.headings[index]}" style="font-size:11px" oninput="${function() {
	this.value = strip(this.value);
	state.headings[index] = this.value;
	change("heading" + index);
}}"></foreignObject>`;
const Row = ({ school: entry, index, offset }, last, colors) =>
	vector`<g class="row" transform="translate(0 ${offset})"><path fill="${colors.background}" d="M58-10h255v20H58z"/><text x="76" text-anchor="end" dy=".35em" font-size="12" fill="${colors.number}" font-family="${family}">${state.numbers && index + 1}</text><text x="84" dy=".35em" font-size="14" fill="${colors.text}" font-family="${family}">${entry.name}</text><path fill="${colors.quality}" d="${squares(entry.quality)}"/>${entry.quality < 3 && vector`<path fill="${colors.quality}" opacity=".15" d="${squares(3, entry.quality)}"/>`}<circle cx="${columns[entry.price]}" r="9" fill="${types[entry.type]}"/><text x="${columns[entry.price]}" text-anchor="middle" dy=".35em" font-size="11" font-weight="bold" fill="#fff" font-family="${family}">${state.match && entry.type === "T" ? "M" : entry.type}</text><g class="edit"><g class="grip"><circle cx="53" cy="-3.5" r=".9"/><circle cx="56.5" cy="-3.5" r=".9"/><circle cx="53" cy="0" r=".9"/><circle cx="56.5" cy="0" r=".9"/><circle cx="53" cy="3.5" r=".9"/><circle cx="56.5" cy="3.5" r=".9"/></g><path class="ghost" d="M284-4.5h9v9h-9zm12 0h9v9h-9zm12 0h9v9h-9z"/>${columns.map(left => vector`<circle class="ghost" cx="${left}" r="9"/>`)}${[0, 1, 2].map(at => vector`<rect class="target" tabindex="0" role="button" aria-label="Quality ${at + 1} of 3 for ${who(entry)}" aria-pressed="${String(at < entry.quality)}" onkeydown="${press(() => {
	entry.quality = at + 1;
	change();
})}" x="${282 + 12 * at}" y="-10" width="12" height="20" onclick="${() => {
	entry.quality = at + 1;
	change();
}}"/>`)}${columns.map((left, at) => vector`<circle class="target" tabindex="0" role="button" aria-label="${(state.headings[at + 1] || "Price " + (at + 1)) + " for " + who(entry) + (entry.price === at ? ", " + (entry.type === "T" ? targetLabel() : kinds[entry.type]) + ", activate to change type" : "")}" aria-pressed="${String(entry.price === at)}" onkeydown="${press(() => {
	if (entry.price === at) entry.type = next[entry.type];
	else entry.price = at;
	change();
})}" cx="${left}" r="10" onclick="${() => {
	if (entry.price === at) entry.type = next[entry.type];
	else entry.price = at;
	change();
}}"/>`)}<foreignObject x="82" y="-10" width="196" height="20"><input class="name" maxlength="${max.name}" autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="list" aria-controls="autocomplete" aria-expanded="false" aria-label="School name, row ${index + 1}" aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown" onfocus="${function() {
	suggest(this);
}}" onkeydown="${move(index)}" value="${entry.name}" oninput="${function() {
	this.value = strip(this.value);
	if (fits(this.value)) {
		entry.name = this.value;
		change(entry);
		suggest(this);
	} else {
		this.value = entry.name;
		toast("Too long");
	}
}}"></foreignObject><rect class="target grab" x="46" y="-10" width="34" height="20" onpointerdown="${event =>
	drag(event, index)}"/><g class="control" tabindex="0" role="button" aria-label="Add school after ${who(entry)}" onkeydown="${press(() => add(index))}" onclick="${() =>
	add(index)}"><title>Add</title><circle cx="9" r="5.5"/><text x="9" dy=".35em">+</text></g><g class="control" tabindex="0" role="button" aria-label="Delete ${who(entry)}" aria-disabled="${state.rows.length < 2 ? "true" : null}" onkeydown="${press(() => remove(index))}" onclick="${() => remove(index)}"><title>Delete</title><circle cx="23" r="5.5"/><text x="23" dy=".35em">×</text></g>${last && vector`<g class="${entry.gap ? "control on" : "control"}" tabindex="0" role="button" aria-label="Divider after ${who(entry)}" aria-pressed="${String(!!entry.gap)}" onkeydown="${press(() => {
	entry.gap = !entry.gap;
	change();
})}" onclick="${() => {
	entry.gap = !entry.gap;
	change();
}}"><title>Divider</title><circle cx="37" r="5.5"/><text x="37" dy=".35em">–</text></g>`}</g></g>`;
const offsets = { start: 0, middle: 0.5, end: 1 };
const aligns = { start: "left", middle: "center", end: "right" };
const Text = (
	key,
	left,
	top,
	width,
	size,
	bold,
	placeholder,
	color,
	italic,
	align = "middle"
) =>
	vector`<text x="${left}" y="${top}" text-anchor="${align}" font-size="${size}" font-weight="${bold ? "bold" : "normal"}" font-style="${italic ? "italic" : "normal"}" fill="${color}" font-family="${family}">${state[key]}</text><foreignObject class="edit" x="${left - width * offsets[align]}" y="${top - 14}" width="${width}" height="20"><input class="middle" aria-label="${placeholder}" maxlength="${max[key]}" placeholder="${placeholder}" value="${state[key]}" style="${`font-size:${size}px;font-weight:${bold ? 700 : 400};font-style:${italic ? "italic" : "normal"};text-align:${aligns[align]}`}" oninput="${function() {
	const font = `${italic ? "italic " : ""}${bold ? "bold " : ""}${size}px`;
	this.value = strip(this.value);
	if (!fits(this.value, font, width - 4)) {
		this.value = state[key];
		toast("Too long");
		return;
	}
	state[key] = this.value;
	change(key);
}}"></foreignObject>`;
const Legend = bottom =>
	vector`<g transform="translate(0 ${bottom + 36})" font-family="${family}" font-size="11" fill="${palette().heading}">${[["S", "Safety"], [state.match ? "M" : "T", targetLabel()], ["R", "Reach"]].map(([key, label], index) => index === 1 ? vector`<g class="target" role="button" tabindex="0" aria-label="${label} category name. Activate to switch to ${state.match ? "Target" : "Match"}." aria-pressed="${String(!!state.match)}" onkeydown="${press(toggleMatch)}" onclick="${toggleMatch}"><circle cx="${67 + 60 * index}" r="7" fill="${types.T}"/><text x="${67 + 60 * index}" text-anchor="middle" dy=".35em" font-size="9" font-weight="bold" fill="#fff">${key}</text><text x="${77 + 60 * index}" dy=".35em" fill="${palette().heading}">${label}</text></g>` : vector`<circle cx="${67 + 60 * index}" r="7" fill="${types[key]}"/><text x="${67 + 60 * index}" text-anchor="middle" dy=".35em" font-size="9" font-weight="bold" fill="#fff">${key}</text><text x="${77 + 60 * index}" dy=".35em">${label}</text>`)}</g>`;
export const Chart = () => {
	const items = layout();
	const bottom = items[items.length - 1].offset;
	const height = bottom + 81;
	const last = items.length - 1;
	const colors = palette();
	const lines =
		"M60 40h534" +
		items
			.filter(item => item.school.gap && item.index < last)
			.map(item => `M60 ${item.offset + 24}h534`)
			.join("");
	return vector`<svg id="chart" class="${state.scheme === "dark" ? "dark" : "light"}" role="group" aria-label="College list chart" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><path fill="${colors.background}" d="M0 0h${width}v${height}H0z"/>${Text("title", 60, margin + 28, 210, 16, 1, "Title", colors.text, 0, "start")}<g transform="translate(0 ${margin})"><path fill="${colors.band}" d="M434 12h80v${bottom + 12}h-80z"/><path fill="${colors.stripe}" d="M514 12h80v${bottom + 12}h-80z"/>${Header(0, 300, colors)}${Header(1, 394, colors)}${Header(2, 474, colors)}${Header(3, 554, colors)}<path stroke="${colors.separator}" stroke-width=".6" d="${lines}"/><path stroke="${colors.grid}" stroke-width=".6" d="${items.map(item => `M110 ${item.offset}h484`).join("")}"/>${items.map(item => Row(item, item.index < last, colors))}${Legend(bottom)}${Text("note", 594, bottom + 40, 264, 11, 0, "Note", colors.note, 1, "end")}</g></svg>`;
};
