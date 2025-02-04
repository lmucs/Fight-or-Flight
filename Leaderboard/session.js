import session from 'express-session';
import connectSessionSequelize from 'connect-session-sequelize';
import moment from 'moment';
import _ from 'lodash';

import {sequelize as db} from './database';
import secret from './secret';

const SequelizeStore = connectSessionSequelize(session.Store);
const store = new SequelizeStore({db,});
store.sync({force: true});
moment().format();

export default app => {

  app.use(session({
    secret,
    resave: false,
    saveUninitialized: false,
    cookie: {secure: true},
    store,
  }));
  app.use((req, res, next) => {
    // // Session timeout for inactivity
    // const now = moment();
    // req.session.age = req.session.age || now;
    // const difference = now.diff(req.session.age, 'minutes');
    // if (difference > 30) {
    //   return req.session.destroy(next);
    // } else if (difference > 15) {
    //   const session = _.clone(req.session);
    //   return req.session.regenerate((err) => {
    //     _.merge(req.session, session);
    //     return next(err);
    //   });
    // } else {
    //   return next();
    // }
    return next();
  });

  app.use((req, res, next) => {
    res.locals.session = req.session;
    return next();
  });
};
