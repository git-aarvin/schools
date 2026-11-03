import { vector } from "./view.js";
import { state, types, next, columns, school, change, refresh } from "./state.js";
import { family, fits } from "./font.js";
import { suggest, navigate } from "./autocomplete.js";
import { toast } from "./notice.js";
export const width = 620;
export const crop = 34;
export const bounds = width - crop;
const margin = 12;
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
	const entry = state.rows[index];
	const item = school(
		"New school",
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
	addEventListener("pointermove", track);
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
const Header = (index, left) =>
	vector`<text x="${left}" y="28" text-anchor="middle" font-size="11" fill="#555" font-family="${family}">${state.headings[index]}</text><foreignObject class="edit" x="${left - 45}" y="14" width="90" height="20"><input class="middle" value="${state.headings[index]}" style="font-size:11px" oninput="${function() {
	state.headings[index] = this.value;
	change("heading" + index);
}}"></foreignObject>`;
const Row = ({ school: entry, index, offset }, last) =>
	vector`<g class="row" transform="translate(0 ${offset})"><path fill="#fff" d="M58-10h255v20H58z"/><text x="76" text-anchor="end" dominant-baseline="central" font-size="12" fill="#777" font-family="${family}">${state.numbers && index + 1}</text><text x="84" dominant-baseline="central" font-size="14" fill="#1a1a1a" font-family="${family}">${entry.name}</text><path fill="#222" d="${squares(entry.quality)}"/>${entry.quality < 3 && vector`<path fill="#222" opacity=".15" d="${squares(3, entry.quality)}"/>`}<circle cx="${columns[entry.price]}" r="9" fill="${types[entry.type]}"/><text x="${columns[entry.price]}" text-anchor="middle" dominant-baseline="central" font-size="11" font-weight="bold" fill="#fff" font-family="${family}">${entry.type}</text><g class="edit"><g class="grip"><circle cx="53" cy="-3.5" r=".9"/><circle cx="56.5" cy="-3.5" r=".9"/><circle cx="53" cy="0" r=".9"/><circle cx="56.5" cy="0" r=".9"/><circle cx="53" cy="3.5" r=".9"/><circle cx="56.5" cy="3.5" r=".9"/></g><path class="ghost" d="M284-4.5h9v9h-9zm12 0h9v9h-9zm12 0h9v9h-9z"/>${columns.map(left => vector`<circle class="ghost" cx="${left}" r="9"/>`)}${[0, 1, 2].map(at => vector`<rect class="target" tabindex="0" role="button" aria-label="Quality ${at + 1}" onkeydown="${press(() => {
	entry.quality = at + 1;
	change();
})}" x="${282 + 12 * at}" y="-10" width="12" height="20" onclick="${() => {
	entry.quality = at + 1;
	change();
}}"/>`)}${columns.map((left, at) => vector`<circle class="target" tabindex="0" role="button" aria-label="Price ${at + 1}" onkeydown="${press(() => {
	if (entry.price === at) entry.type = next[entry.type];
	else entry.price = at;
	change();
})}" cx="${left}" r="10" onclick="${() => {
	if (entry.price === at) entry.type = next[entry.type];
	else entry.price = at;
	change();
}}"/>`)}<foreignObject x="82" y="-10" width="196" height="20"><input class="name" maxlength="40" autocomplete="off" spellcheck="false" role="combobox" aria-autocomplete="list" aria-controls="autocomplete" aria-expanded="false" onfocus="${function() {
	suggest(this);
}}" onkeydown="${move(index)}" value="${entry.name}" oninput="${function() {
	if (fits(this.value)) {
		entry.name = this.value;
		change(entry);
		suggest(this);
	} else {
		this.value = entry.name;
		toast("Too long");
	}
}}"></foreignObject><rect class="target grab" x="46" y="-10" width="34" height="20" onpointerdown="${event =>
	drag(event, index)}"/><g class="control" onclick="${() =>
	add(index)}"><title>Add</title><circle cx="9" r="5.5"/><text x="9">+</text></g><g class="control" onclick="${() =>
	remove(index)}"><title>Delete</title><circle cx="23" r="5.5"/><text x="23">×</text></g>${last && vector`<g class="${entry.gap ? "control on" : "control"}" onclick="${() => {
	entry.gap = !entry.gap;
	change();
}}"><title>Divider</title><circle cx="37" r="5.5"/><text x="37">–</text></g>`}</g></g>`;
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
	vector`<text x="${left}" y="${top}" text-anchor="${align}" font-size="${size}" font-weight="${bold ? "bold" : "normal"}" font-style="${italic ? "italic" : "normal"}" fill="${color}" font-family="${family}">${state[key]}</text><foreignObject class="edit" x="${left - width * offsets[align]}" y="${top - 14}" width="${width}" height="20"><input class="middle" maxlength="${Math.floor(width / 7)}" placeholder="${placeholder}" value="${state[key]}" style="${`font-size:${size}px;font-weight:${bold ? 700 : 400};font-style:${italic ? "italic" : "normal"};text-align:${aligns[align]}`}" oninput="${function() {
	if (!fits(this.value, `${bold ? "bold " : ""}${size}px`, width - 4)) {
		this.value = state[key];
		toast("Too long");
		return;
	}
	state[key] = this.value;
	change(key);
}}"></foreignObject>`;
const Legend = bottom =>
	vector`<g transform="translate(0 ${bottom + 36})" font-family="${family}" font-size="11" fill="#555">${[["S", "Safety"], ["T", "Target"], ["R", "Reach"]].map(([key, label], index) => vector`<circle cx="${67 + 60 * index}" r="7" fill="${types[key]}"/><text x="${67 + 60 * index}" text-anchor="middle" dominant-baseline="central" font-size="9" font-weight="bold" fill="#fff">${key}</text><text x="${77 + 60 * index}" dominant-baseline="central">${label}</text>`)}</g>`;
export const Chart = () => {
	const items = layout();
	const bottom = items[items.length - 1].offset;
	const height = bottom + 105;
	const last = items.length - 1;
	const lines =
		"M60 40h534" +
		items
			.filter(item => item.school.gap && item.index < last)
			.map(item => `M60 ${item.offset + 24}h534`)
			.join("");
	return vector`<svg id="chart" xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><path fill="#fff" d="M0 0h${width}v${height}H0z"/>${Text("title", 60, margin + 28, 210, 16, 1, "Title", "#1a1a1a", 0, "start")}<g transform="translate(0 ${margin})"><path fill="#f2f2f2" d="M434 12h80v${bottom + 12}h-80z"/><path fill="#e4e4e4" d="M514 12h80v${bottom + 12}h-80z"/>${Header(0, 300)}${Header(1, 394)}${Header(2, 474)}${Header(3, 554)}<path stroke="#8f8f8f" stroke-width=".6" d="${lines}"/><path stroke="#c8c8c8" stroke-width=".6" d="${items.map(item => `M110 ${item.offset}h484`).join("")}"/>${items.map(item => Row(item, item.index < last))}${Legend(bottom)}${Text("note", 594, bottom + 40, 264, 11, 0, "Note", "#666", 1, "end")}</g></svg>`;
};
