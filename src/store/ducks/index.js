import { combineReducers } from "redux-immutable";
import authentication from "./authentication.duck";
import userDocument from "./userDocument.duck";

const reducers = combineReducers({ authentication, userDocument });

export default reducers;
