import { schools } from "./schools.js";
import { fits } from "./font.js";
const limit = 8;
const seen = new WeakSet();
let list = null;
let active = null;
let options = [];
let matches = [];
let index = -1;
let picking = false;
let tracking = false;
const clean = text => text.toLowerCase().replace(/\s+/g, " ").trim();
const rank = (name, query) => {
	const text = name.toLowerCase();
	if (text.startsWith(query)) return 1;
	const words = text.split(/[\s&]+/);
	if (words.some(word => word.startsWith(query))) return 2;
	const initials = words.map(word => word[0]).join("");
	if (initials.startsWith(query)) return 2;
	if (text.includes(query)) return 3;
	return 0;
};
const search = query =>
	schools
		.filter(name => clean(name) !== query && fits(name))
		.map(name => ({ name, score: rank(name, query) }))
		.filter(item => item.score)
		.sort(
			(a, b) =>
				a.score - b.score ||
				a.name.length - b.name.length ||
				a.name.localeCompare(b.name)
		)
		.slice(0, limit)
		.map(item => item.name);
const place = () => {
	if (!active || !list || list.hidden) return;
	if (!active.isConnected) return close();
	const box = active.getBoundingClientRect();
	const width = list.offsetWidth;
	const left = Math.max(
		8,
		Math.min(box.left, innerWidth - width - 8)
	);
	const below = box.bottom + 2;
	const above = box.top - list.offsetHeight - 2;
	const top =
		below + list.offsetHeight <= innerHeight - 8 || above < 8
			? below
			: above;
	list.style.left = `${left}px`;
	list.style.top = `${Math.max(
		8,
		Math.min(top, innerHeight - list.offsetHeight - 8)
	)}px`;
};
const track = () => {
	if (tracking) return;
	tracking = true;
	addEventListener("scroll", place, true);
	addEventListener("resize", place);
};
const untrack = () => {
	if (!tracking) return;
	tracking = false;
	removeEventListener("scroll", place, true);
	removeEventListener("resize", place);
};
const highlight = () => {
	options.forEach((option, at) => {
		const on = at === index;
		option.classList.toggle("active", on);
		option.setAttribute("aria-selected", on ? "true" : "false");
	});
	const option = options[index];
	if (!option || !active) return;
	active.setAttribute("aria-activedescendant", option.id);
	const top = option.offsetTop;
	const bottom = top + option.offsetHeight;
	if (top < list.scrollTop) list.scrollTop = top;
	else if (bottom > list.scrollTop + list.clientHeight)
		list.scrollTop = bottom - list.clientHeight;
};
const choose = at => {
	const input = active;
	const name = matches[at];
	if (!input || !name) return;
	picking = true;
	close();
	input.value = name;
	input.dispatchEvent(new Event("input", { bubbles: true }));
	input.setSelectionRange?.(name.length, name.length);
	picking = false;
};
const close = () => {
	if (active) {
		active.setAttribute("aria-expanded", "false");
		active.removeAttribute("aria-activedescendant");
	}
	active = null;
	options = [];
	matches = [];
	index = -1;
	if (list) {
		list.hidden = true;
		list.replaceChildren();
	}
	untrack();
};
const create = () => {
	if (list) return list;
	list = document.createElement("div");
	list.id = "autocomplete";
	list.className = "autocomplete";
	list.setAttribute("role", "listbox");
	list.setAttribute("aria-label", "School names");
	list.hidden = true;
	list.addEventListener("pointerdown", event => {
		const option = event.target.closest(".option");
		if (!option) return;
		event.preventDefault();
		choose(options.indexOf(option));
	});
	list.addEventListener("pointerover", event => {
		const option = event.target.closest(".option");
		if (!option) return;
		const at = options.indexOf(option);
		if (at >= 0 && at !== index) {
			index = at;
			highlight();
		}
	});
	document.body.append(list);
	return list;
};
const init = input => {
	if (seen.has(input)) return;
	seen.add(input);
	input.addEventListener("blur", () => {
		if (active === input) close();
	});
};
const show = (input, names) => {
	const node = create();
	active = input;
	matches = names;
	index = 0;
	node.replaceChildren(
		...names.map((name, at) => {
			const option = document.createElement("div");
			option.id = `autocomplete-${at}`;
			option.className = at ? "option" : "option active";
			option.dataset.index = at;
			option.setAttribute("role", "option");
			option.setAttribute("aria-selected", at ? "false" : "true");
			option.title = name;
			option.textContent = name;
			return option;
		})
	);
	options = [...node.children];
	node.hidden = false;
	node.style.minWidth = `${Math.max(
		input.getBoundingClientRect().width,
		160
	)}px`;
	input.setAttribute("aria-expanded", "true");
	input.setAttribute("aria-activedescendant", options[0].id);
	place();
	track();
};
export const suggest = input => {
	if (picking) return;
	init(input);
	if (active && active !== input) close();
	const query = clean(input.value);
	if (!query) {
		close();
		return;
	}
	const names = search(query);
	if (!names.length) {
		close();
		return;
	}
	show(input, names);
};
export const navigate = event => {
	if (!active || !list || list.hidden || event.target !== active) return false;
	if (event.key === "Escape") {
		event.preventDefault();
		close();
		return true;
	}
	if (event.key === "ArrowDown" || event.key === "ArrowUp") {
		event.preventDefault();
		if (!options.length) return true;
		const step = event.key === "ArrowDown" ? 1 : -1;
		index = (index + step + options.length) % options.length;
		highlight();
		return true;
	}
	if (event.key === "Enter") {
		if (index < 0) return false;
		event.preventDefault();
		choose(index);
		return true;
	}
	return false;
};
