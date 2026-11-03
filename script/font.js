export const family = "Charter, Georgia, serif";
const canvas = document.createElement("canvas").getContext("2d");
export const fits = (text, font = "14px", limit = 190) => {
	canvas.font = font + " " + family;
	return canvas.measureText(text).width <= limit;
};
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
	return rules.join("");
};
export const embed = () => (cache ??= load().catch(() => ""));
