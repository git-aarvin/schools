export const family = "Charter, Georgia, serif";
const canvas = document.createElement("canvas").getContext("2d");
const widths = new Map();
export const fits = (text, font = "14px", limit = 170) => {
	if (!canvas) return text.length * 7 <= limit;
	const key = font + "|" + text;
	let width = widths.get(key);
	if (width === undefined) {
		canvas.font = font + " " + family;
		width = canvas.measureText(text).width;
		if (widths.size > 2000) widths.clear();
		widths.set(key, width);
	}
	return width <= limit;
};
document.fonts?.ready.then(() => widths.clear());
const files = [
	["regular", 400, "normal"],
	["bold", 700, "normal"],
	["italic", 400, "italic"],
];
let cache;
const encode = bytes => {
	let text = "";
	const size = 0x8000;
	for (let index = 0; index < bytes.length; index += size)
		text += String.fromCharCode(...bytes.subarray(index, index + size));
	return btoa(text);
};
const load = async () => {
	const rules = await Promise.all(
		files.map(async ([name, weight, style]) => {
			const response = await fetch(
				new URL(`../font/${name}.woff2`, import.meta.url)
			);
			if (!response.ok) throw new Error("Font unavailable");
			const data = encode(new Uint8Array(await response.arrayBuffer()));
			return `@font-face{font-family:Charter;src:url(data:font/woff2;base64,${data}) format("woff2");font-weight:${weight};font-style:${style};font-display:block}`;
		})
	);
	return `:root{--charter-notice:"Charter (c) Bitstream Inc. See font/LICENSE"}${rules.join("")}`;
};
export const embed = () => (cache ??= load().catch(() => ""));
