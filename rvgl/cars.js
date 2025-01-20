// Search box filtering
let numerical = /([<>]=?) *([0-9.]+) *(.*)/i;

let opFunction = {
	"<": (v, n) => parseFloat(n) < v,
	"<=": (v, n) => parseFloat(n) <= v,
	">": (v, n) => parseFloat(n) > v,
	">=": (v, n) => parseFloat(n) >= v,
}

document.getElementById("search").classList.remove("js-only");
document.getElementById("search-box").addEventListener("keyup", (e) => {
	let query = e.target.value.trim().toLowerCase();
	for (let el of document.getElementsByClassName("hidden-by-search")) {
		el.classList.remove("hidden-by-search");
	}
	if (query != "") {
		let mo = numerical.exec(query), op, value, unit, isSpeed, isAcc, isWeight;
		let checkGameRating = document.getElementById("game").checked;
		let checkIoRating = document.getElementById("io").checked;
		let checkRvaRating = document.getElementById("rva").checked;
		isSpeed = isAcc = isWeight = false;
		if (mo) {
			[_, op, value, unit] = mo;
			op = opFunction[op];
			value = parseFloat(value);
			unit = unit.replace(/[^a-z2²\/]/g, "");
			if (unit == "") {
				isSpeed = isAcc = isWeight = true;
			}
			else if (unit == "mp") {
				// Special case since mps is abnormal, they are probably typing mph
				isSpeed = true;
			}
			else {
				if ("mph".startsWith(unit)) {
					isSpeed = true;
				}
				if ("m/s".startsWith(unit) || unit.startsWith("mps")) {
					isAcc = true;
				}
				if ("kph".startsWith(unit) || unit.startsWith("km")) {
					isSpeed = true;
				}
				if ("kg".startsWith(unit)) {
					isWeight = true;
				}
			}
		}

		for (let car of document.getElementsByTagName("tbody")[0].getElementsByTagName("tr")) {
			let [eName, eRating, eIO, eRVA, eSpeed, eAcc, eWeight] = car.getElementsByTagName("td");
			if (mo) {
				// Compare something
				if (!(
					isSpeed && op(value, eSpeed.innerText)
					|| isAcc && op(value, eAcc.innerText)
					|| isWeight && op(value, eWeight.innerText)
				)) {
					car.classList.add("hidden-by-search");
				}
			}
			else {
				// Compare name/rating
				if (!(
					eName.innerText.toLowerCase().includes(query)
					|| checkGameRating && eRating.innerText.toLowerCase().includes(query)
					|| checkIoRating && eIO.innerText.toLowerCase().includes(query)
					|| checkRvaRating && eRVA.innerText.toLowerCase().includes(query)
				)) {
					car.classList.add("hidden-by-search");
				}
			}
		}
	}
});


// Sorting
const rating = {
	"Rookie": 0,
	"Amateur": 1,
	"Advanced": 2,
	"Semi-Pro": 3,
	"Pro": 4,
	"Super Pro": 5,

	"Classic Clockworks": 10,
	"Modern Clockworks": 11,

	"D1GP": 20,
	"D2GP": 21,
	"DXGP": 22,
};

let colHeads = document.getElementsByTagName("th");
let [colCar, colRating, colIO, colRVA, colSpeed, colAcc, colWeight] = colHeads;

for (let colHead of colHeads) {
	let node = document.createElement("span");
	node.innerText = "↕";
	colHead.appendChild(node);
}

function sortColumn(n, cmp) {
	let sorter = document.getElementsByTagName("thead")[0].getElementsByTagName("th")[n].getElementsByTagName("span")[0];
	let mode = sorter.innerText == "↓" ? "↑" : "↓";
	let tbody = document.getElementsByTagName("tbody")[0]
	let rows = Array.from(tbody.getElementsByTagName("tr"));
	let col = [];
	for (let row of rows) {
		let td = row.getElementsByTagName("td")[n];
		let a = td.getElementsByTagName("a");
		col.push([row, a.length ? a[0].innerText : td.innerText]);
		row.remove();
	}
	if (mode == "↓") {
		col.sort((a, b) => cmp(a[1], b[1], 1));
	}
	else {
		col.sort((a, b) => cmp(a[1], b[1], -1));
	}

	for (let [row, _] of col) {
		tbody.append(row);
	}
	sorter.innerText = mode;
}

function sortString(a, b, mode) {
	return a.localeCompare(b, "en", { sensitivity: "base" }) * mode;
}

function sortRating(a, b, mode) {
	if (a == "unranked") {
		return b == "unranked" ? 0 : 1;
	}
	else if (b == "unranked") {
		return -1;
	}
	return (rating[a] - rating[b]) * mode;
}

function sortFloat(a, b, mode) {
	let af = parseFloat(a), bf = parseFloat(b);
	if (isNaN(af)) {
		return isNaN(bf) ? 0 : 1;
	}
	else if (isNaN(bf)) {
		return -1;
	}
	return (af - bf) * mode;
}

function makeSortable(col, idx, fn) {
	col.addEventListener("click", sortColumn.bind(null, idx, fn));
	col.style.cursor = "pointer";
	col.style.userSelect = "none";
}

makeSortable(colCar, 0, sortString);
makeSortable(colRating, 1, sortRating);
makeSortable(colIO, 2, sortRating);
makeSortable(colRVA, 3, sortRating);
makeSortable(colSpeed, 4, sortFloat);
makeSortable(colAcc, 5, sortFloat);
makeSortable(colWeight, 6, sortFloat);
