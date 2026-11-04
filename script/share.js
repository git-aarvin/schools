import { state, base, load, valid } from "./state.js";
import { detach } from "./file.js";
import { toast } from "./notice.js";
const prefix = "s1";
const kinds = "TRS";
const binary = bytes => {
	let text = "";
	for (let index = 0; index < bytes.length; index += 0x8000)
		text += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
	return btoa(text);
};
const encode = bytes =>
	binary(bytes).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
const decode = text => {
	const value = atob(
		text.replaceAll("-", "+").replaceAll("_", "/") +
			"=".repeat((4 - (text.length % 4)) % 4)
	);
	return Uint8Array.from(value, char => char.charCodeAt(0));
};
const bound = 24000;
const capacity = 1 << 20;
const deflate = async bytes => {
	const stream = new Blob([bytes])
		.stream()
		.pipeThrough(new CompressionStream("deflate-raw"));
	return new Uint8Array(await new Response(stream).arrayBuffer());
};
const inflate = async bytes => {
	const reader = new Blob([bytes])
		.stream()
		.pipeThrough(new DecompressionStream("deflate-raw"))
		.getReader();
	const chunks = [];
	let total = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		total += value.length;
		if (total > capacity) {
			reader.cancel();
			throw 0;
		}
		chunks.push(value);
	}
	const output = new Uint8Array(total);
	let at = 0;
	for (const chunk of chunks) {
		output.set(chunk, at);
		at += chunk.length;
	}
	return output;
};
const pack = row =>
	(row.quality - 1) * 9 + row.price * 3 + kinds.indexOf(row.type);
const unpack = code => ({
	quality: Math.floor(code / 9) + 1,
	price: Math.floor(code / 3) % 3,
	type: kinds[code % 3],
});
const flatten = data => {
	const result = {};
	if (data.title !== base.title) result.t = data.title;
	if (data.note !== base.note) result.n = data.note;
	if (data.numbers !== base.numbers) result.b = data.numbers ? 1 : 0;
	if (data.scheme !== base.scheme) result.d = 1;
	if (data.headings.some((value, index) => value !== base.headings[index]))
		result.h = data.headings;
	result.r = data.rows.map(row => {
		const item = [row.name, pack(row)];
		if (row.gap) item.push(1);
		return item;
	});
	return result;
};
const expand = data => {
	if (!data || !Array.isArray(data.r) || !data.r.length) throw 0;
	const rows = data.r.map(item => {
		if (!Array.isArray(item) || typeof item[0] !== "string") throw 0;
		const code = item[1];
		if (!Number.isInteger(code) || code < 0 || code > 26) throw 0;
		return { name: item[0], ...unpack(code), gap: item[2] === 1 };
	});
	const headings =
		Array.isArray(data.h) &&
		data.h.length === 4 &&
		data.h.every(value => typeof value === "string")
			? data.h
			: [...base.headings];
	const result = {
		title: typeof data.t === "string" ? data.t : base.title,
		note: typeof data.n === "string" ? data.n : base.note,
		numbers: data.b == null ? base.numbers : !!data.b,
		scheme: data.d ? "dark" : base.scheme,
		headings,
		rows,
	};
	if (!valid(result)) throw 0;
	return result;
};
const save = async () => {
	const raw = new TextEncoder().encode(JSON.stringify(flatten(state)));
	let value = "j" + encode(raw);
	if (typeof CompressionStream === "function") {
		try {
			const compressed = await deflate(raw);
			if (compressed.length < raw.length) value = "z" + encode(compressed);
		} catch {}
	}
	return value;
};
const copy = async value => {
	if (navigator.clipboard?.writeText) {
		try {
			await navigator.clipboard.writeText(value);
			return;
		} catch {}
	}
	const input = document.createElement("textarea");
	input.value = value;
	input.setAttribute("readonly", "");
	input.setAttribute("aria-hidden", "true");
	input.style.position = "fixed";
	input.style.left = "-9999px";
	input.style.fontSize = "16px";
	document.body.append(input);
	input.select();
	input.setSelectionRange(0, value.length);
	const copied = document.execCommand("copy");
	input.remove();
	if (!copied) throw 0;
};
export const share = async () => {
	try {
		const url = new URL(location.href);
		url.hash = prefix + (await save());
		try {
			history.replaceState(null, "", url);
		} catch {}
		await copy(url.href);
		toast("Link copied");
	} catch {
		toast("Failed");
	}
};
export const restore = async () => {
	const hash = location.hash.slice(1);
	if (!hash.startsWith(prefix) || hash.length > bound) return;
	try {
		const value = hash.slice(prefix.length);
		const mode = value[0];
		const bytes = decode(value.slice(1));
		let raw;
		if (mode === "j") {
			if (bytes.length > capacity) return;
			raw = bytes;
		}
		else if (mode === "z") {
			if (typeof DecompressionStream !== "function") return;
			raw = await inflate(bytes);
		} else return;
		const data = expand(JSON.parse(new TextDecoder().decode(raw)));
		detach();
		load(data);
	} catch {}
};
