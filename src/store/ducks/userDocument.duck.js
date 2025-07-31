import { Map } from 'immutable';
import { createActions, handleActions } from 'redux-actions';

const defaultState = Map({
  userDocument: null,
  userCommune: null,
});

export const { setDocument, setCommune } = createActions({
  SET_DOCUMENT: (doc) => ({ doc }),
  SET_COMMUNE: (doc) => ({ doc }),
});

const userDocument = handleActions(
  {
    [setDocument]: (draft, { payload: { doc } }) =>
      draft.withMutations((state) => {
        state.set('userDocument', doc);
      }),
    [setCommune]: (draft, { payload: { doc } }) =>
      draft.withMutations((state) => {
        state.set('userCommune', doc);
      }),
  },
  defaultState
);

export default userDocument;
