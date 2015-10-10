const _ = require('lodash');

const locals = {
  // App configuration
  appName: 'Fight or Flight',
  primaryColor: 'indigo',
  accentColor: 'pink',

  // Confirmation  errors
  regEmailError: 'The email was not valid or is already taken',
  regUserError: 'The username was not valid or was already taken',
  regPasswordError: 'The password was not long enough',
  regConfirmError: 'The two passwords did not match',
};
const setLocals = app => _.assign(app.locals, locals);
export default setLocals;
