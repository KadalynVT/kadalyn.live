//// SEARCHING ////
const nonAlpha = /[^a-z]/g;

function clean(text) {
	return text.toLowerCase().replace(nonAlpha, "")
}

function filter(input) {
	let text = clean(input.value ?? "");
	filterTable("backpack-printer-recipes", [0, 4], text);
	filterTable("small-printer-recipes", [0, 3, 4], text);
	filterTable("medium-printer-recipes", [0, 3, 4, 5], text);
	filterTable("large-printer-recipes", [0, 3, 4, 5, 6], text);
	filterTable("chemistry-lab-recipes", [0, 1, 2, 3], text);
	filterTable("materials", [0, 1, 2], text);
	filterTable("trades", [0, 3], text);
}

function filterTable(id, columns, query) {
	const table = document.getElementById(id);
	if (!table) return;
	let anythingMatched = false;
	for (const recipe of table.querySelectorAll("tbody > tr")) {
		const cols = recipe.querySelectorAll("td");
		let matched = false;
		for (const c of columns) {
			if (
				clean(cols[c].innerText).indexOf(query) >= 0
				|| (cols[c].attributes?.also?.value ?? "").indexOf(query) >= 0
			) {
				matched = true;
				anythingMatched = true;
				break
			}
		}
		if (matched) recipe.classList.remove("hidden");
		else recipe.classList.add("hidden");
	}
	if (anythingMatched) {
		table.parentElement.classList.remove("hidden");
	} else {
		table.parentElement.classList.add("hidden");
	}
}

//// TABLE SORTING ////
function makeTablesSortable() {
	for (const t of document.querySelectorAll("table.sortable")) {
		const ths = t.querySelectorAll("thead > tr > th");
		for (let i = 0; i < ths.length; ++i) {
			const th = ths[i];
			th.addEventListener("click", sortTable.bind(null, t, i));
			th.classList.add("sortable", "unsorted");
			th.appendChild(document.createElement("span"));
		}
	}
}

/**
 * Change sorting for a column in a sortable table
 * @param {HTMLTableElement} table
 * @param {number} col
 */
function sortTable(table, col) {
	const th = table.querySelectorAll("thead > tr > th")[col];
	let compare = compareAsc;
	if (th.classList.contains("sort-asc")) {
		compare = compareDesc;
		th.classList.remove("sort-asc");
		th.classList.add("sort-desc");
	}
	else {
		th.classList.remove("unsorted");
		th.classList.remove("sort-desc");
		th.classList.add("sort-asc");
	}

	// Extract the rows/values
	const trs = table.querySelectorAll("tbody > tr");
	const values = [];
	for (let i = 0; i < trs.length; ++i) {
		const tr = trs[i];
		const v = tr.querySelectorAll("td")[col].innerText;
		const intV = parseInt(v.replaceAll(",", ""));
		values.push([isNaN(intV) ? v : intV, i])
		tr.remove();
	}

	// Sort the values and add the rows back in
	const tbody = table.querySelector("tbody")
	for (const [_, i] of values.sort(compare)) {
		tbody.appendChild(trs[i]);
	}
}

function compareAsc(a, b) {
	const aIsNum = typeof a[0] === "number";
	const bIsNum = typeof b[0] === "number";
	if (aIsNum && bIsNum) return a[0] - b[0];
	// since dashes tend to mean 0
	else if (aIsNum) return 1;
	else if (bIsNum) return -1;
	return a[0].localeCompare(b[0]);
}

function compareDesc(a, b) {
	const aIsNum = typeof a[0] === "number";
	const bIsNum = typeof b[0] === "number";
	if (aIsNum && bIsNum) return b[0] - a[0];
	else if (aIsNum) return -1;
	else if (bIsNum) return 1;
	return b[0].localeCompare(a[0]);
}

//// UNLOCK STATUS SAVING ////
function addUnlocked() {
	const ths = document.querySelectorAll("table > thead > tr > th:last-child");
	for (const th of ths) {
		if (th.innerText.trim() == "Unlock") {
			const newTH = document.createElement("th");
			newTH.innerText = "Unlocked?";
			th.parentElement.appendChild(newTH);

			for (const tr of th.parentElement.parentElement.parentElement.querySelectorAll("tbody > tr")) {
				const unlocked = tr.querySelector("td:last-child").innerText.trim() == "-";
				const newTD = document.createElement("td");
				newTD.innerHTML = '<input type="checkbox" class="unlocked"/>';
				const cb = newTD.children[0];
				cb.addEventListener("change", updateUnlockData);
				if (unlocked) cb.checked = cb.disabled = true;
				tr.appendChild(newTD);
			}
		}
	}

	loadUnlocked();
}

let unlocked = {};
function loadUnlocked() {
	unlocked = JSON.parse(localStorage.getItem("unlocked") ?? "{}");
	for (const input of document.getElementsByClassName("unlocked")) {
		const name = input.parentElement.parentElement.querySelector("td").innerText.trim();
		if (!input.disabled) input.checked = unlocked[name] ?? false;
	}
}

function updateUnlockData() {
	const name = this.parentElement.parentElement.querySelector("td").innerText.trim();
	if (this.checked) unlocked[name] = true;
	else delete unlocked[name];
	localStorage.setItem("unlocked", JSON.stringify(unlocked))
}

// on load
makeTablesSortable();
addUnlocked();
