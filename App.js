import React from "react";
import { Provider as ReduxProvider } from "react-redux";
import Router from "./src/router/";
import store from "./src/store";
import "./src/translations/i18n";

if (__DEV__) {
  // eslint-disable-next-line no-console
  import("./ReactotronConfig").then(() => console.log("Reactotron Configured"));
}

const App = () => {
  return (
      <ReduxProvider store={store}>
        <Router />
      </ReduxProvider>
  );
};

export default App;
