// Mot de passe initial (compte créé dans le DCC) à changer à la première connexion : le MGP refuse le jeton
// (`/api/auth/token/`, statut 403, `code: password_change_required`) tant qu'il n'a été changé sur aucune
// plateforme (DCC, MGP, SIG). L'écran FirstLoginPassword le change auprès du DCC
// (`authentication/api/first-login-password/`), qui l'applique à toutes les plateformes, ce compte MGP compris.

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 16;

export const isPasswordChangeRequiredError = (error) =>
  error?.response?.status === 403 && error?.response?.data?.code === 'password_change_required';

// Mêmes règles que le serveur (DCC authentication/accounts.py::validate_new_password) ; clés de traduction.
export function newPasswordErrorKeys(newPassword, confirmation, currentPassword) {
  const errors = [];
  const password = newPassword || '';
  if (!password) {
    return ['first_login_password_required'];
  }
  if (password !== (confirmation || '')) {
    errors.push('first_login_password_mismatch');
  }
  if (!/^[A-Za-z0-9]+$/.test(password)) {
    errors.push('first_login_password_letters_digits_only');
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.push('first_login_password_min_length');
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    errors.push('first_login_password_max_length');
  }
  if (!/[A-Za-z]/.test(password)) {
    errors.push('first_login_password_needs_letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('first_login_password_needs_digit');
  }
  if (currentPassword && password === currentPassword) {
    errors.push('first_login_password_same_as_current');
  }
  return errors;
}

export const firstLoginPasswordPayload = (login, currentPassword, newPassword, confirmation, language) => ({
  login,
  current_password: currentPassword,
  new_password: newPassword,
  new_password_confirm: confirmation,
  platform: 'mgp_mobile',
  language: language || 'fr',
});
