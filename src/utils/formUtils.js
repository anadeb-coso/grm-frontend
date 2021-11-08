export const passwordRegex = new RegExp(
  '^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$'
);
export const emailRegex = new RegExp(
  /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
);

export const chargeRegex = new RegExp(/^\d+(\.|\.\d{1,2})?$/);

export const currencyRegex = new RegExp(/^\d+(\.|\.\d{1,2})?$/);

export const alphabeticRegex = /^[a-zA-Z]+$/;

export const alphabeticSpaceRegex = /^[a-z]+( |[a-z])*$/i;

const alphabeticWithAccentStr =
  '[A-Za-z\\u00C0-\\u00D6\\u00D8-\\u00f6\\u00f8-\\u00ff\\s]';

export const alphabeticWithAccentsRegex = new RegExp(
  `^${alphabeticWithAccentStr}*$`
);

export const alphanumericWithAccentsRegex = new RegExp(
  `^(${alphabeticWithAccentStr}|[0-9])*$`
);
