import { Map } from "immutable";
import { createActions, handleActions } from "redux-actions";

const defaultState = Map({
  userDocument: null,
});

export const { setDocument } = createActions({
  SET_DOCUMENT: (doc) => {
    return { doc };
  },
});

const userDocument = handleActions(
  {
    [setDocument]: (draft, { payload: { doc } }) => {
      return draft.withMutations((state) => {
        state.set("userDocument", doc);
      });
    },
  },
  defaultState
);

export default userDocument;
