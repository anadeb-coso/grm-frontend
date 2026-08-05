import React from "react";
import { Provider as ReduxProvider } from "react-redux";
import { Provider as PaperProvider } from 'react-native-paper';
import { ToastProvider } from 'react-native-toast-notifications';
import Router from "./src/router/";
import store from "./src/store";
import SyncProgressBar from "./src/components/SyncProgressBar/SyncProgressBar";
import "./src/translations/i18n";
// import { SyncStatusProvider } from "./src/components/SyncStatus/SyncStatusContext";
// import SyncStatusInitializer from "./src/components/SyncStatus/SyncStatusInitializer";

if (__DEV__) {
  // eslint-disable-next-line no-console
  import("./ReactotronConfig").then(() => console.log("Reactotron Configured"));
}

const App = () => {
  return (
    <ReduxProvider store={store}>
      <ToastProvider>
        <PaperProvider>
          <SyncProgressBar />
          <Router />
        </PaperProvider>
      </ToastProvider>
    </ReduxProvider>
  );
};
// const App = () => {
//   return (
//     <SyncStatusProvider>
//       <SyncStatusInitializer />
//       <ReduxProvider store={store}>
//         <ToastProvider>
//           <PaperProvider>
//             <Router />
//           </PaperProvider>
//         </ToastProvider>
//       </ReduxProvider>
//     </SyncStatusProvider>
//   );
// };

export default App;
