import seedrandom from "seedrandom";

const colours = [
	"E5446D",
	"FF8966",
	"F0A202",
	"F18805",
	"D95D39",
	"202C59",
	"581F18",
	"DEADED",
	"1FFFFF"
];

export async function scrollToBottom(node: HTMLElement) {
	if (!node) return;
	await node.scrollTo(20, node.scrollHeight);
}

export function randomColour(seed: string): string {
	const random = seedrandom(seed);
	const colour = colours[Math.floor(random() * colours.length)];
	return "#" + colour;
}
