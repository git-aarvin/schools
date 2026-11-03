import { state } from "./state.js";
import { crop, bounds } from "./chart.js";
import { embed } from "./font.js";
import { toast } from "./notice.js";
const resolution = 1200;
export const download = (blob, name) => {
	const link = document.createElement("a");
	const url = URL.createObjectURL(blob);
	link.href = url;
	link.download = name;
	link.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
};
export const serialize = async () => {
	const chart = document.getElementById("chart").cloneNode(true);
	chart.querySelectorAll(".edit").forEach(node => node.remove());
	chart.querySelectorAll("[class],[style],[id]").forEach(node => {
		node.removeAttribute("class");
		node.removeAttribute("style");
		node.removeAttribute("id");
	});
	chart.setAttribute("width", bounds);
	chart.setAttribute(
		"viewBox",
		`${crop} 0 ${bounds} ${chart.getAttribute("height")}`
	);
	const walker = document.createTreeWalker(chart, 128);
	const comments = [];
	while (walker.nextNode()) comments.push(walker.currentNode);
	comments.forEach(node => node.remove());
	const space = "http://www.w3.org/2000/svg";
	const prepend = (tag, text) => {
		const node = document.createElementNS(space, tag);
		node.textContent = text;
		chart.prepend(node);
	};
	chart.setAttribute("role", "img");
	prepend("metadata", JSON.stringify(state));
	prepend(
		"desc",
		state.rows
			.map(
				row =>
					`${row.name}: quality ${row.quality}, ${
						state.headings[row.price + 1]
					}, ${row.type}`
			)
			.join("; ")
	);
	prepend("title", state.title || "Schools");
	const rules = await embed();
	if (rules) {
		const style = document.createElementNS(space, "style");
		style.textContent = rules;
		chart.prepend(style);
	}
	return new XMLSerializer().serializeToString(chart);
};
const checksum = bytes => {
	let value = 0xffffffff;
	for (const byte of bytes) {
		value ^= byte;
		for (let bit = 0; bit < 8; bit++)
			value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
	}
	return (value ^ 0xffffffff) >>> 0;
};
const adjust = async blob => {
	const bytes = new Uint8Array(await blob.arrayBuffer());
	if (
		bytes.length < 33 ||
		bytes[0] !== 137 ||
		bytes[1] !== 80 ||
		bytes[2] !== 78 ||
		bytes[3] !== 71
	)
		throw new Error("Invalid PNG data");
	const chunk = new Uint8Array(13);
	chunk.set([112, 72, 89, 115], 0);
	const data = new Uint8Array(9);
	const reader = new DataView(data.buffer);
	reader.setUint32(0, Math.round(resolution / 0.0254));
	reader.setUint32(4, Math.round(resolution / 0.0254));
	data[8] = 1;
	chunk.set(data, 4);
	const sum = checksum(chunk);
	const output = new Uint8Array(bytes.length + 21);
	const writer = new DataView(output.buffer);
	output.set(bytes.subarray(0, 33), 0);
	writer.setUint32(33, 9);
	output.set([112, 72, 89, 115], 37);
	output.set(data, 41);
	writer.setUint32(50, sum);
	output.set(bytes.subarray(33), 54);
	return new Blob([output], { type: "image/png" });
};
export const image = async () => {
	const height = parseFloat(
		document.getElementById("chart").getAttribute("height")
	);
	let source;
	try {
		source = URL.createObjectURL(
			new Blob([await serialize()], {
				type: "image/svg+xml;charset=utf-8",
			})
		);
		const svg = new Image();
		svg.src = source;
		await svg.decode();
		const scale = resolution / 96;
		const canvas = document.createElement("canvas");
		canvas.width = Math.round(bounds * scale);
		canvas.height = Math.round(height * scale);
		const context = canvas.getContext("2d");
		if (!context) throw new Error("Canvas unavailable");
		context.fillStyle = "#fff";
		context.fillRect(0, 0, canvas.width, canvas.height);
		context.drawImage(svg, 0, 0, canvas.width, canvas.height);
		const blob = await new Promise((resolve, reject) =>
			canvas.toBlob(
				item =>
					item
						? resolve(item)
						: reject(new Error("PNG export failed")),
				"image/png"
			)
		);
		download(await adjust(blob), "Schools.png");
		toast("Exported");
	} catch {
		toast("Failed");
	} finally {
		if (source) URL.revokeObjectURL(source);
	}
};
export const table = () =>
	download(
		new Blob(
			[
				"name,quality,price,type\n" +
					state.rows
						.map(row =>
							[
								`"${row.name.replaceAll('"', '""')}"`,
								row.quality,
								row.price + 1,
								row.type,
							].join()
						)
						.join("\n"),
			],
			{ type: "text/csv" }
		),
		"Schools.csv"
	);
