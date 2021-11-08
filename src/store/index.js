import { createStore, compose } from "redux";
import { composeWithDevTools } from "redux-devtools-extension";
import reducers from "./ducks";
import Reactotron from "../../ReactotronConfig";
let enhancerCompose = compose;

// eslint-disable-next-line no-undef
if (__DEV__) {
  enhancerCompose = composeWithDevTools;
}
const middleWare = enhancerCompose(Reactotron.createEnhancer());

const store = createStore(reducers, middleWare);

export default store;
