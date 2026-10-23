import {
  firstLoginPasswordPayload,
  isPasswordChangeRequiredError,
  newPasswordErrorKeys,
} from '../firstLoginPassword';

// Refus du jeton (`/api/auth/token/`) pour un mot de passe initial jamais changé : 403 + code.
describe('isPasswordChangeRequiredError', () => {
  it('reconnaît le refus du MGP', () => {
    const error = { response: { status: 403, data: { code: 'password_change_required', detail: '...' } } };
    expect(isPasswordChangeRequiredError(error)).toBe(true);
  });

  it.each([
    [{ response: { status: 401, data: { detail: 'No active account' } } }],
    [{ response: { status: 403, data: { detail: 'Forbidden' } } }],
    [{ request: {} }],
    [undefined],
  ])('ignore les autres erreurs %#', (error) => {
    expect(isPasswordChangeRequiredError(error)).toBe(false);
  });
});

// Mêmes règles que le DCC (authentication/accounts.py::validate_new_password).
describe('newPasswordErrorKeys', () => {
  it('accepte un mot de passe valide', () => {
    expect(newPasswordErrorKeys('NewPass123', 'NewPass123', 'Initial234')).toEqual([]);
  });

  it.each([
    ['', '', null, ['first_login_password_required']],
    ['NewPass123', 'NewPass124', null, ['first_login_password_mismatch']],
    ['New-Pass123', 'New-Pass123', null, ['first_login_password_letters_digits_only']],
    ['Abc123', 'Abc123', null, ['first_login_password_min_length']],
    ['Abcdefghijklmno12', 'Abcdefghijklmno12', null, ['first_login_password_max_length']],
    ['Abcdefghi', 'Abcdefghi', null, ['first_login_password_needs_digit']],
    ['123456789', '123456789', null, ['first_login_password_needs_letter']],
    ['Initial234', 'Initial234', 'Initial234', ['first_login_password_same_as_current']],
  ])('%p / %p -> %p', (password, confirmation, current, expected) => {
    expect(newPasswordErrorKeys(password, confirmation, current)).toEqual(expected);
  });
});

it('corps envoyé au DCC', () => {
  expect(firstLoginPasswordPayload('a@b.org', 'Initial234', 'NewPass123', 'NewPass123', 'en')).toEqual({
    login: 'a@b.org',
    current_password: 'Initial234',
    new_password: 'NewPass123',
    new_password_confirm: 'NewPass123',
    platform: 'mgp_mobile',
    language: 'en',
  });
  expect(firstLoginPasswordPayload('a@b.org', 'x', 'y', 'y').language).toBe('fr');
});
