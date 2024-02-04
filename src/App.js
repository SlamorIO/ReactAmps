import { useState, useEffect } from "react";
import { Client, DefaultServerChooser, DefaultSubscriptionManager } from "amps";
import Grid from "./components/Grid";
import "./App.css";
import { curCol } from "./scripts/helpers";

// constants
const HOST = "ec2-3-104-35-12.ap-southeast-2.compute.amazonaws.com";
const PORT = "9008";

const App = () => {
  // the state of the component will be an AMPS Client object
  const [client, setClient] = useState();

  useEffect(() => {
    // create the server chooser
    const chooser = new DefaultServerChooser();
    chooser.add(`ws://${HOST}:${PORT}/amps/json`);

    // create the AMPS HA client object
    const client = new Client("view-server");
    client.serverChooser(chooser);
    client.subscriptionManager(new DefaultSubscriptionManager());
    client.errorHandler((err) => console.error("Error: ", err));

    // now we can establish connection and update the state
    client.connect().then(() => setClient(client));

    // disconnect the client from AMPS when the component is destructed
    return () => {
      client.disconnect();
    };
  }, []);

  // client is not ready yet, render "Loading..." label only
  if (!client) {
    return <div>Loading...</div>;
  }

  return (
    <div
      style={{ display: "flex", justifyContent: "center", flexWrap: "wrap" }}
    >
      <Grid
        title="Top 20 Symbols by BID"
        client={client}
        columnDefs={[
          { headerName: "Symbol", field: "symbol" },
          curCol({ headerName: "Bid", field: "bid", sort: "desc" }),
          curCol({ headerName: "Ask", field: "ask" }),
        ]}
        topic="market_data"
        options="oof,conflation=3000ms,top_n=20,skip_n=0"
        orderBy="/bid DESC"
      />

      <Grid
        title="Top 20 Symbols by ASK"
        client={client}
        columnDefs={[
          { headerName: "Symbol", field: "symbol" },
          curCol({ headerName: "Bid", field: "bid", sort: "desc" }),
          curCol({ headerName: "Ask", field: "ask" }),
        ]}
        topic="market_data"
        options="oof,conflation=500ms,top_n=50,skip_n=10"
        orderBy="/ask ASC"
      />
    </div>
  );
};

export default App;
