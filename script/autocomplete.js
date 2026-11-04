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
const entries = schools.map(({ name, aliases }) => {
	const terms = [name, ...aliases].map(value => {
		const text = value.toLowerCase();
		const words = text.split(/[\s&]+/).filter(Boolean);
		return {
			text,
			words,
			initials: words.map(word => word[0]).join(""),
			key: clean(value),
		};
	});
	return { name, terms, key: clean(name) };
});
const rank = (term, query) => {
	if (term.text.startsWith(query)) return 1;
	if (term.words.some(word => word.startsWith(query))) return 2;
	if (term.initials.startsWith(query)) return 2;
	if (term.text.includes(query)) return 3;
	return 0;
};
const search = query => {
	const found = [];
	for (const entry of entries) {
		if (entry.key === query) continue;
		const score = Math.min(...entry.terms.map(term => rank(term, query)).filter(Boolean));
		if (score) found.push({ name: entry.name, score });
	}
	found.sort(
		(a, b) =>
			a.score - b.score ||
			a.name.length - b.name.length ||
			a.name.localeCompare(b.name)
	);
	const names = [];
	for (const item of found) {
		if (!fits(item.name)) continue;
		names.push(item.name);
		if (names.length >= limit) break;
	}
	return names;
};
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
	addEventListener("scroll", place, { capture: true, passive: true });
	addEventListener("resize", place);
};
const untrack = () => {
	if (!tracking) return;
	tracking = false;
	removeEventListener("scroll", place, { capture: true });
	removeEventListener("resize", place);
};
const highlight = () => {
	options.forEach((option, at) => {
		const on = at === index;
		option.classList.toggle("active", on);
		option.setAttribute("aria-selected", on ? "true" : "false");
	});
	const option = options[index];
	if (!option || !active) {
		active?.removeAttribute("aria-activedescendant");
		return;
	}
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
	index = -1;
	node.replaceChildren(
		...names.map((name, at) => {
			const option = document.createElement("div");
			option.id = `autocomplete-${at}`;
			option.className = "option";
			option.dataset.index = at;
			option.setAttribute("role", "option");
			option.setAttribute("aria-selected", "false");
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
	if (event.altKey) return false;
	if (event.key === "Escape") {
		event.preventDefault();
		close();
		return true;
	}
	if (event.key === "ArrowDown" || event.key === "ArrowUp") {
		event.preventDefault();
		if (!options.length) return true;
		const step = event.key === "ArrowDown" ? 1 : -1;
		index = index < 0
			? (step > 0 ? 0 : options.length - 1)
			: (index + step + options.length) % options.length;
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
create();
