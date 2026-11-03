export const toast = message => {
	const element = document.getElementById("toast");
	element.textContent = message;
	element.classList.add("show");
	clearTimeout(toast.timer);
	toast.timer = setTimeout(() => element.classList.remove("show"), 2200);
};
