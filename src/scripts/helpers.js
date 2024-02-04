function numberValueParser(params) {
  return Number(params.newValue);
}

function numberCellFormatter(params) {
  if (!params || !params.value) {
    return "";
  }

  return params.value.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}

function currencyCellFormatter(params) {
  return "$" + numberCellFormatter(params);
}

export function numCol(column, currency = false) {
  column.resizable = true;
  column.valueParser = numberValueParser;
  column.cellClass = "right";
  column.valueFormatter = currency
    ? currencyCellFormatter
    : numberCellFormatter;
  column.cellRenderer = "agAnimateShowChangeCellRenderer";
  return column;
}

export function curCol(column) {
  return numCol(column, true);
}
