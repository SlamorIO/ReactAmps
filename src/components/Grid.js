import { AgGridReact } from "ag-grid-react";
import { Command } from "amps";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";
import { useEffect, useRef, useState } from "react";

const Grid = ({
  client,
  width,
  height,
  columnDefs,
  topic,
  orderBy,
  options,
  title,
}) => {
  // the state of the component is the a list of row objects
  const [rowData, setRowData] = useState([]);
  const [error, setError] = useState();

  // create and keep a reference to the subscription id
  const subIdRef = useRef();

  const matcher =
    ({ header }) =>
    ({ key }) =>
      key === header.sowKey();

  const processOOF = (message, rowData) => {
    const rowIndex = rowData.findIndex(matcher(message));

    if (rowIndex >= 0) {
      const rows = rowData.filter(({ key }) => key !== message.header.sowKey());
      return rows;
    }

    return rowData;
  };

  const processPublish = (message, rowData) => {
    const rowIndex = rowData.findIndex(matcher(message));
    const rows = rowData.slice();

    if (rowIndex >= 0) {
      rows[rowIndex] = { ...rows[rowIndex], ...message.data };
    } else {
      message.data.key = message.header.sowKey();
      rows.push(message.data);
    }

    return rows;
  };

  const handleGridReady = async ({ api }) => {
    // resize columns to fit the width of the grid
    api.sizeColumnsToFit();

    // create a command object
    const command = new Command("sow_and_subscribe");
    command.topic(topic);
    command.orderBy(orderBy);
    command.options(options);

    try {
      // subscribe to the topic data and atomic updates
      let rows;

      // store the subscription id
      subIdRef.current = await client.execute(command, (message) => {
        switch (message.header.command()) {
          case "group_begin": // Begin receiving the initial dataset
            rows = [];
            break;
          case "sow": // This message is a part of the initial dataset
            message.data.key = message.header.sowKey();
            rows.push(message.data);
            break;
          case "group_end": // Initial Dataset has been delivered
            setRowData(rows);
            break;
          case "oof": // Out-of-Focus -- a message should no longer be in the grid
            rows = processOOF(message, rows);
            setRowData(rows);
            break;
          default: // Publish -- either a new message or an update
            rows = processPublish(message, rows);
            setRowData(rows);
        }
      });
    } catch (err) {
      setRowData([]);
      setError(`Error: ${err.message}`);
    }
  };

  return (
    <div
      className="ag-theme-alpine-dark"
      style={{ height: height ?? 600, width: width ?? 600 }}
    >
      <div className="grid-header">{title}</div>
      <AgGridReact
        animateRows
        columnDefs={columnDefs}
        // we now use state to track row data changes
        rowData={rowData}
        // unique identification of the row based on the SowKey
        getRowId={({ data: { key } }) => key}
        // resize columns on grid resize
        onGridSizeChanged={({ api }) => api.sizeColumnsToFit()}
        // the provided callback is invoked once the grid is initialized
        onGridReady={handleGridReady}
      />
    </div>
  );
};

export default Grid;
