import React from 'react';
import { Alert } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import axios from 'axios';
import { login as jwtLogin } from '../../../../api/client';
import FirstLoginPassword from '../FirstLoginPassword';

jest.mock('axios', () => ({ post: jest.fn() }));
jest.mock('../../../../api/client', () => ({ login: jest.fn() }));
jest.mock('../../../../services/env', () => ({ cddBaseURL: 'http://dcc.test' }));
jest.mock('../../../../store/ducks/authentication.duck', () => ({ login: (payload) => ({ type: 'LOGIN', payload }) }));
const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({ useDispatch: () => mockDispatch }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key, i18n: { language: 'fr' } }),
}));
jest.mock('react-native-paper', () => {
  const { Text, TextInput: NativeTextInput, TouchableOpacity, View } = require('react-native');
  const TextInput = (props) => <NativeTextInput {...props} />;
  TextInput.Icon = () => null;
  return {
    ActivityIndicator: () => <View />,
    Button: ({ onPress, children }) => (
      <TouchableOpacity onPress={onPress}><Text>{children}</Text></TouchableOpacity>
    ),
    TextInput,
  };
});

const navigation = { navigate: jest.fn() };
const route = { params: { email: 'nouveau.fc@example.org', password: 'Initial234' } };

function render() {
  let tree;
  act(() => {
    tree = renderer.create(<FirstLoginPassword route={route} navigation={navigation} />);
  });
  return tree;
}

async function submit(tree, password, confirmation) {
  const field = (label) => tree.root.findAll((node) => node.props.label === label && typeof node.props.onChangeText === 'function')[0];
  act(() => field('first_login_password_new').props.onChangeText(password));
  act(() => field('first_login_password_confirm').props.onChangeText(confirmation));
  const button = tree.root.findAll((node) => typeof node.props.onPress === 'function' && node.props.children)
    .find((node) => JSON.stringify(node.props.children).includes('first_login_password_submit'));
  await act(async () => { await button.props.onPress(); });
}

const texts = (tree) => tree.root.findAll((node) => typeof node.props.children === 'string').map((node) => node.props.children);

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

it('change le mot de passe auprès du DCC puis se connecte avec le nouveau', async () => {
  axios.post.mockResolvedValue({ data: { ok: true, message: 'ok' } });
  jwtLogin.mockResolvedValue({ access: 'a', refresh: 'r' });
  const tree = render();
  await submit(tree, 'NewPass123', 'NewPass123');
  expect(axios.post).toHaveBeenCalledWith(
    'http://dcc.test/authentication/api/first-login-password/',
    {
      login: 'nouveau.fc@example.org', current_password: 'Initial234', new_password: 'NewPass123',
      new_password_confirm: 'NewPass123', platform: 'mgp_mobile', language: 'fr',
    },
    expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
  );
  expect(jwtLogin).toHaveBeenCalledWith('nouveau.fc@example.org', 'NewPass123');
  expect(mockDispatch).toHaveBeenCalledWith({ type: 'LOGIN', payload: { email: 'nouveau.fc@example.org' } });
});

it("contrôle la saisie avant tout appel", async () => {
  const tree = render();
  await submit(tree, 'NewPass123', 'Autre12345');
  expect(axios.post).not.toHaveBeenCalled();
  expect(texts(tree)).toContain('first_login_password_mismatch');
});

it('affiche le refus du DCC sans se connecter', async () => {
  axios.post.mockResolvedValue({ data: { ok: false, message: 'Incorrect identifiers' } });
  const tree = render();
  await submit(tree, 'NewPass123', 'NewPass123');
  expect(jwtLogin).not.toHaveBeenCalled();
  expect(texts(tree)).toContain('Incorrect identifiers');
});

it('serveur injoignable : message réseau', async () => {
  axios.post.mockRejectedValue(new Error('Network Error'));
  const tree = render();
  await submit(tree, 'NewPass123', 'NewPass123');
  expect(texts(tree)).toContain('first_login_password_network_error');
  expect(mockDispatch).not.toHaveBeenCalled();
});

it('connexion refusée après le changement : retour à la connexion', async () => {
  axios.post.mockResolvedValue({ data: { ok: true, message: 'ok' } });
  jwtLogin.mockRejectedValue({ response: { status: 401, data: {} } });
  const tree = render();
  await submit(tree, 'NewPass123', 'NewPass123');
  expect(navigation.navigate).toHaveBeenCalledWith('Login');
  expect(mockDispatch).not.toHaveBeenCalled();
});
