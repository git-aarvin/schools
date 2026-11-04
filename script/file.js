import { load, clean, refresh, valid, columns, school } from "./state.js";
import { serialize, download } from "./output.js";
import { toast } from "./notice.js";
let handle = null;
let armed = false;
export let label = "";
export const detach = () => {
	handle = null;
	label = "";
	armed = false;
};
let timer;
let writing = Promise.resolve();
const colors = Object.assign(Object.create(null), {
	"#185fa5": "T",
	"#a32d2d": "R",
	"#0f6e56": "S",
});
const capacity = 2 * 1024 * 1024;
const read = async file => {
	if (file.size > capacity) throw new Error("Too large");
	return file.text();
};
const detectMatch = root =>
	[...root.querySelectorAll("text")].some(node => {
		const value = node.textContent.trim();
		const x = node.getAttribute("x");
		return (x === "137" && value === "Match") ||
			(["394", "474", "554"].includes(x) && value === "M" && !node.hasAttribute("y"));
	});
const theme = root => {
	const fill = [...root.children]
		.find(node => node.localName === "path" && node.getAttribute("d")?.startsWith("M0 0h"))
		?.getAttribute("fill");
	if (!fill) return "light";
	const hex = fill.match(/^#([\da-f]{3}|[\da-f]{6})$/i)?.[1];
	if (!hex) return fill.toLowerCase() === "black" ? "dark" : "light";
	const expanded = hex.length === 3 ? [...hex].map(value => value + value).join("") : hex;
	const channels = expanded.match(/../g).map(value => parseInt(value, 16));
	return channels.reduce(
		(sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index],
		0
	) < 128
		? "dark"
		: "light";
};
const parse = text => {
	const document = new DOMParser().parseFromString(text, "image/svg+xml");
	const root = document.documentElement;
	const detected = theme(root);
	try {
		const metadata = root.getElementsByTagName("metadata")[0].textContent;
		const data = JSON.parse(metadata);
		if (valid(data))
			return {
				...data,
				match: typeof data.match === "boolean" ? data.match : detectMatch(root),
				scheme: data.scheme === "dark" || data.scheme === "light" ? data.scheme : detected,
			};
	} catch {}
	const headings = [...root.querySelectorAll("text")]
		.filter(node => node.getAttribute("y") === "28")
		.map(node => node.textContent)
		.slice(0, 4);
	const groups = [...root.querySelectorAll("g")].filter(node => {
		if (!node.getAttribute("transform")) return false;
		return [...node.children].some(
			child => child.localName === "text" && child.getAttribute("x") === "84"
		);
	});
	if (root.localName !== "svg" || headings.length < 4 || !groups.length) throw 0;
	const offsets = groups.map(
		node =>
			+node
				.getAttribute("transform")
				.match(/translate\(\s*[-\d.]+[\s,]+([-\d.]+)/)[1]
	);
	return {
		imported: true,
		scheme: detected,
		match: detectMatch(root),
		headings,
		rows: groups.map((node, index) => {
			const name = node.querySelector('text[x="84"]').textContent;
			const circle = [...node.querySelectorAll("circle")].find(
				item => colors[item.getAttribute("fill")]
			);
			const center = circle ? +circle.getAttribute("cx") : columns[0];
			const price = columns.reduce(
				(best, value, at) =>
					Math.abs(value - center) < Math.abs(columns[best] - center)
						? at
						: best,
				0
			);
			const type = circle ? colors[circle.getAttribute("fill")] || "T" : "T";
			const path = [...node.querySelectorAll("path")].find(
				item =>
					item.getAttribute("fill") ===
						(detected === "dark" ? "#f2f2f2" : "#222") &&
					!item.hasAttribute("opacity")
			);
			const quality = Math.min(
				3,
				Math.max(1, (path?.getAttribute("d")?.match(/z/gi) || []).length)
			);
			return school(
				name,
				quality,
				price,
				type,
				offsets[index + 1] - offsets[index] > 24
			);
		}),
	};
};
export const persist = () => {
	clearTimeout(timer);
	if (!handle || !armed) return;
	timer = setTimeout(() => {
		const target = handle;
		if (!target) return;
		writing = writing.then(async () => {
			try {
				const writable = await target.createWritable();
				try {
					await writable.write(await serialize());
				} finally {
					await writable.close();
				}
				clean();
			} catch {
				if (handle === target) {
					detach();
					refresh();
				}
				toast("Failed");
			}
		});
	}, 300);
};
export const save = async () => {
	try {
		if (window.showSaveFilePicker) {
			if (!handle)
				handle = await showSaveFilePicker({
					suggestedName: label || "Schools.svg",
					types: [
						{
							description: "SVG graphic",
							accept: { "image/svg+xml": [".svg"] },
						},
					],
				});
			const permission = await handle.queryPermission?.({
				mode: "readwrite",
			});
			if (
				permission !== "granted" &&
				(await handle.requestPermission({ mode: "readwrite" })) !==
					"granted"
			) {
				detach();
				refresh();
				toast("Denied");
				return;
			}
			const writable = await handle.createWritable();
			try {
				await writable.write(await serialize());
			} finally {
				await writable.close();
			}
			armed = true;
			clean();
			label = handle.name || "Schools.svg";
			refresh();
			toast("Saved");
		} else {
			download(
				new Blob([await serialize()], { type: "image/svg+xml" }),
				"Schools.svg"
			);
			clean();
			toast("Saved");
		}
	} catch (error) {
		if (error?.name !== "AbortError") toast("Failed");
	}
};
export const open = async () => {
	try {
		let choice = null;
		let text;
		if (window.showOpenFilePicker) {
			[choice] = await showOpenFilePicker({
				mode: "read",
				types: [
					{
						description: "SVG graphic",
						accept: { "image/svg+xml": [".svg"] },
					},
				],
			});
			text = await read(await choice.getFile());
		} else {
			const file = await new Promise((resolve, reject) => {
				const input = document.createElement("input");
				input.type = "file";
				input.accept = ".svg,image/svg+xml";
				input.onchange = () =>
					input.files[0]
						? resolve(input.files[0])
						: reject({ name: "AbortError" });
				input.oncancel = () => reject({ name: "AbortError" });
				input.click();
			});
			text = await read(file);
		}
		const data = parse(text);
		if (!data.rows?.length) throw new Error("Empty");
		handle = data.imported ? null : choice;
		armed = false;
		label = handle ? handle.name : "";
		load(data);
		toast("Opened");
	} catch (error) {
		if (error?.name !== "AbortError")
			toast(error?.message === "Too large" ? "File too large" : "Not a Schools file");
	}
};
