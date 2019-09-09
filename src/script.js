monsterRate = class {
	constructor (monsterId, monsterName, monsterLv, chance, minAmount, maxAmount, sweep) {
		this.monsterId = monsterId;
		this.url = "http://www.l2-firebird.com/module/database/npc/npc.php?input=" + this.monsterId;
		this.monsterName = monsterName;
		this.monsterLv = monsterLv;
		this.chance = chance / 100;
		this.minAmount = minAmount;
		this.maxAmount = maxAmount;
		this.avgAmount = (this.minAmount + this.maxAmount) / 2 * this.chance;
		this.sweep = sweep;
	}

    static extractMonsterId (rowNode) {
	    let UrlString = rowNode.cells[0].childNodes[0].href;
        return UrlString.slice(UrlString.indexOf("input=") + "input=".length);
    }

    static extractMonsterName (rowNode) {
	    let linkText = rowNode.cells[0].innerText;
        return linkText.substring(0, linkText.indexOf(" ("))
    }

    static extractMonsterLevel (rowNode) {
        let linkText = rowNode.cells[0].innerText;
        return parseInt(linkText.substring(linkText.indexOf(" (") + 2, linkText.length - 1));
    }

    static extractChance (rowNode) {
	    let cellText = rowNode.cells[1].innerText;
        return cellText.substr(0, cellText.length - 1);
    }

    static extractAmounts (rowNode) {
	    let cellText = rowNode.cells[2].innerText;
        let amounts = cellText.split(" - ");
        if (amounts.length === 1) {
            amounts[1] = amounts[0];
        }
        amounts = amounts.map(Number);
        return amounts;
    }

    static extractSweep (rowNode) {
	    let cellText = rowNode.cells[3].innerText;
        return cellText === "yes";
    }

    static createMonsterRateFromRow (rowNode, index) {
        if (index === 0) {
            return;
        }

        let monsterId = monsterRate.extractMonsterId(rowNode);
        let monsterName = monsterRate.extractMonsterName(rowNode);
        let monsterLv = monsterRate.extractMonsterLevel(rowNode);
        let chance = monsterRate.extractChance(rowNode);
        let amounts = monsterRate.extractAmounts(rowNode);
        let sweep = monsterRate.extractSweep(rowNode);

        return new monsterRate(
            monsterId,
            monsterName,
            monsterLv,
            chance,
            amounts[0],
            amounts[1],
            sweep
        );
    }
};

monsterRates = class {
    static containerId = "monsterRatesContainer";
    static tableId = "monsterRatesTable";

    constructor (monsterRateArray) {
        this.sortBy = "";
        this.filters = [];
        this.monsterRates = monsterRateArray;
    }

    add (monsterRate) {
        this.monsterRates[this.monsterRates.length] = monsterRate;
    }

    sortEventHandler = function (event) {
        let sort = event.target.dataset.sortProperty;
        this.sortBy = (
            sort === this.sortBy
                ? "-"
                : ""
        ) + sort;
        this.renderTable();
    };

    getContainerNode () {
        return document.getElementById(monsterRates.containerId);
    }

    getTableNode () {
        return document.getElementById(monsterRates.tableId);
    }

    createColMonsterLevel() {
        let columnMonsterLevel = document.createElement("th");
        columnMonsterLevel.id = "colMonsterLevel";
        columnMonsterLevel.title = "Monster level";
        columnMonsterLevel.innerText = "Lv";
        columnMonsterLevel.dataset.sortProperty = "monsterLv";
        columnMonsterLevel.addEventListener("click", this.sortEventHandler.bind(this), false);
        return columnMonsterLevel;
    }

    createColMonsterName() {
        let columnMonsterName = document.createElement("th");
        columnMonsterName.id = "colMonsterName";
        columnMonsterName.title = "Monster name";
        columnMonsterName.innerText = "Monster";
        columnMonsterName.dataset.sortProperty = "monsterName";
        columnMonsterName.addEventListener("click", this.sortEventHandler.bind(this), false);
        return columnMonsterName;
    }

    createColChance() {
        let columnChance = document.createElement("th");
        columnChance.id = "colChance";
        columnChance.title = "The probability of drop the item when killed the monster";
        columnChance.innerText = "Chance";
        columnChance.dataset.sortProperty = "chance";
        columnChance.addEventListener("click", this.sortEventHandler.bind(this), false);
        return columnChance;
    }

    createColMinAmount() {
        let columnMinAmount = document.createElement("th");
        columnMinAmount.id = "colMinAmount";
        columnMinAmount.title = "If the monster is dropping because the chance then drop the item in minimum amount of this";
        columnMinAmount.innerText = "Min";
        columnMinAmount.dataset.sortProperty = "minAmount";
        columnMinAmount.addEventListener("click", this.sortEventHandler.bind(this), false);
        return columnMinAmount;
    }

    createColMaxAmount() {
        let columnMaxAmount = document.createElement("th");
        columnMaxAmount.id = "colMaxAmount";
        columnMaxAmount.title = "If the monster is dropping because the chance then drop the item in maximum amount of this";
        columnMaxAmount.innerText = "Max";
        columnMaxAmount.dataset.sortProperty = "maxAmount";
        columnMaxAmount.addEventListener("click", this.sortEventHandler.bind(this), false);
        return columnMaxAmount;
    }

    createColAvgAmount() {
        let columnAvgAmount = document.createElement("th");
        columnAvgAmount.id = "colAvgAmount";
        columnAvgAmount.title = "Average drop when the monster killed = (Min + Max) / 2 * Chance";
        columnAvgAmount.innerText = "Avg";
        columnAvgAmount.dataset.sortProperty = "avgAmount";
        columnAvgAmount.addEventListener("click", this.sortEventHandler.bind(this), false);
        return columnAvgAmount;
    }

    createColSweep() {
        let columnSweep = document.createElement("th");
        columnSweep.id = "colSweep";
        columnSweep.title = "Spoil-sweep / drop";
        columnSweep.innerText = "Sweep / Drop";
        columnSweep.dataset.sortProperty = "sweep";
        columnSweep.addEventListener("click", this.sortEventHandler.bind(this), false);
        return columnSweep;
    }

    filterSweepEventHandler = function (event) {
        let sweepFilterValue = event.target.options[event.target.selectedIndex].value;
        for (let i = 0; i < this.filters.length; i++) {
            if (this.filters[i] instanceof SweepFilter) {
                this.filters.splice(i, 1);
                break;
            }
        }
        if (sweepFilterValue !== "") {
            this.filters.push(new SweepFilter(sweepFilterValue));
        }
        this.renderTable();
    };

    filterSweep() {
        let filterSweep = document.createElement("th");
        let select = document.createElement("select");
        let all = document.createElement("option");
        all.value = "";
        all.append(document.createTextNode("all"));
        let sweep = document.createElement("option");
        sweep.value = "sweep";
        sweep.append(document.createTextNode("Sweep"));
        let drop = document.createElement("option");
        drop.value = "drop";
        drop.append(document.createTextNode("Drop"));
        let defaultSelected = false;
        for (let i = 0; i < this.filters.length; i++) {
            if (this.filters[i] instanceof SweepFilter) {
                switch (this.filters[i].filterValue) {
                    case "sweep":
                        sweep.selected = true;
                        defaultSelected = true;
                        break;
                    case "drop":
                        drop.selected = true;
                        defaultSelected = true;
                        break;
                }
            }
        }
        if (!defaultSelected) {
            all.selected = true;
        }
        select.append(all);
        select.append(sweep);
        select.append(drop);
        select.addEventListener("change", this.filterSweepEventHandler.bind(this), false);
        filterSweep.append(select);
        return filterSweep;
    }

    createHeader() {
        let filterRow = document.createElement("tr");
        filterRow.append(document.createElement("th"));
        filterRow.append(document.createElement("th"));
        filterRow.append(document.createElement("th"));
        filterRow.append(document.createElement("th"));
        filterRow.append(document.createElement("th"));
        filterRow.append(document.createElement("th"));
        filterRow.append(this.filterSweep());

        let headerRow = document.createElement("tr");
        headerRow.append(this.createColMonsterLevel());
        headerRow.append(this.createColMonsterName());
        headerRow.append(this.createColChance());
        headerRow.append(this.createColMinAmount());
        headerRow.append(this.createColMaxAmount());
        headerRow.append(this.createColAvgAmount());
        headerRow.append(this.createColSweep());

        let header = document.createElement("thead");
        header.append(filterRow);
        header.append(headerRow);

        return header;
    }

    numberFormat (x) {
        return Number.parseFloat(x).toFixed(2);
    }

    createRow (monsterRate) {
        let m = monsterRate;
        let row = document.createElement("tr");
        row.id = "monster_" + m.monsterId;

        let monsterLv = row.insertCell(-1);
            monsterLv.setAttribute("align", "right");
            monsterLv.innerText = m.monsterLv;
        row.insertCell(-1).innerHTML = "<a href='" + m.url + "'>" + m.monsterName + "</a>";
        let chance = row.insertCell(-1);
            chance.setAttribute("align", "right");
            chance.innerText = this.numberFormat(m.chance * 100) + " %";
        let min = row.insertCell(-1);
            min.setAttribute("align", "right");
            min.innerText = m.minAmount;
        let max = row.insertCell(-1);
            max.setAttribute("align", "right");
            max.innerText = m.maxAmount;
        let avg = row.insertCell(-1);
            avg.setAttribute("align", "right");
            avg.innerText = this.numberFormat(m.avgAmount);
        let sweep = row.insertCell(-1);
            sweep.setAttribute("align", "center");
            sweep.innerText = m.sweep ? "Sweep" : "Drop";
        return row;
    }

    fillTable(bodyNode) {
        for(let i = 0; i < this.monsterRates.length; i++) {
            let show = true;
            for (let j = 0; j < this.filters.length; j++) {
                if (show && this.filters[j].test(this.monsterRates[i])) {
                    show = false;
                    break;
                }
            }
            show && bodyNode.append(this.createRow(this.monsterRates[i]));
        }
    }

    dynamicSort (property) {
        let sortOrder = 1;

        if(property[0] === "-") {
            sortOrder = -1;
            property = property.substr(1);
        }

        return function (a, b) {
            let result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
            return result * sortOrder;
        }
    }

    removeOldTable () {
        let table = this.getTableNode();
        if (!!table) {
            table.remove();
        }
    }

    sort () {
        if (this.sortBy !== "") {
            this.monsterRates.sort(this.dynamicSort(this.sortBy));
        }
    }

    renderTable () {
        this.sort();
        let container = this.getContainerNode();
        this.removeOldTable();

        let table = document.createElement("table");
        table.id = monsterRates.tableId;
        table.style.width = "100%";
        table.append(this.createHeader());
        let body = document.createElement("tbody");
        this.fillTable(body);
        table.append(body);
        container.append(table);
    }
};

class Filter {
    constructor (filterValue) {
        this.filterValue = filterValue;
        this.test = function(monsterRate) {
            return true
        }
    }
}

class SweepFilter extends Filter {
    constructor (filterValue) {
        super(filterValue);
        this.test = function (monsterRate) {
            switch (this.filterValue) {
                case "sweep":
                    return !monsterRate.sweep;
                case "drop":
                    return monsterRate.sweep;
                default:
                    console.error("Invalid filter option: " + this.filterValue);
            }
        }
    }
}

let listTable = document.querySelector(".table_main_center > div:nth-child(3) > table");
let container = document.createElement("div");
container.id = monsterRates.containerId;
container.append("Click on the table head to reorder.");
listTable.parentNode.insertBefore(container, listTable);

let rates = new monsterRates([]);

for (let i = 1, row; i < listTable.rows.length; i++) {
    row = listTable.rows[i];
	rates.add(monsterRate.createMonsterRateFromRow(row, i));
}

listTable.remove();

rates.sortBy = "monsterLv";
rates.renderTable();
