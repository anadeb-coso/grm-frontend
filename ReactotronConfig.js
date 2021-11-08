import Reactotron, { asyncStorage } from "reactotron-react-native";
import { reactotronRedux } from "reactotron-redux";
const reactotron = Reactotron.configure()
  .use(reactotronRedux())
  .use(asyncStorage())
  .useReactNative()
  .connect();
export default reactotron;
