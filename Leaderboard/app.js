import express from 'express';
import * as path from 'path';
import favicon from 'serve-favicon';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import hbs from 'hbs';
import _ from 'lodash';
import * as crypto from 'crypto';

import routes from './routes';
import setupLocals from './locals';
import secret from './secret';
import setupSession from './session';
import {User, Score} from './database';
import {calculateSaltHash} from './cryptography';

const app = express();
hbs.localsAsTemplateData(app);
import './handlebars_helpers';

// view engine setup
app.set('trust proxy', 1);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.set('json spaces');

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
setupSession(app);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser(secret));
app.use(express.static(path.join(__dirname, 'public')));

// Ensure user details are in rendering context
app.use((req, res, next) => {
  if (req.session.user) {
    res.locals.ownUsername = req.session.user.username;
  }
  next();
});

app.use(setupLocals);
app.use('/', routes);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error(`Not Found: ${req.originalUrl}`);
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err,
    });
    console.error(err.stack);
  });
  // Setup test user and password
  (async () => {
    const testUser = await User.create({
      username: 'test',
      email: 'example@example.com',
      password: calculateSaltHash('test'),
      biography: `
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis pharetra ex
consequat velit finibus dapibus. Morbi vulputate sapien et purus placerat,
eget tristique urna hendrerit. Mauris et orci ullamcorper, porta enim
quis, consectetur dolor. Sed ullamcorper, ligula vel maximus feugiat, ex
turpis facilisis risus, eu commodo lacus risus id ante. Curabitur bibendum
ante lorem, nec ullamcorper nisi placerat ac. Aliquam erat volutpat.
Praesent facilisis, lorem eget accumsan convallis, tortor diam cursus
orci, eu semper tortor odio id arcu. Pellentesque non nibh elit. Vivamus
eget arcu lorem. Sed sit amet interdum sapien.
`.trim(),

    });
    const testUser2 = await User.create({
      username: 'testy',
      email: 'example2@example.com',
      password: calculateSaltHash('testy'),
      biography: `
Lorm ipsum dolor sit amet, consectetur adipiscing elit. Duis pharetra ex
consequat velit finibus dapibus. Morbi vulputate sapien et purus placerat,
eget tristique urna hendrerit. Mauris et orci ullamcorper, porta enim
quis, consectetur dolor. Sed ullamcorper, ligula vel maximus feugiat, ex
turpis facilisis risus, eu commodo lacus risus id ante. Curabitur bibendum
ante lorem, nec ullamcorper nisi placerat ac. Aliquam erat volutpat.
Praesent facilisis, lorem eget accumsan convallis, tortor diam cursus
orci, eu semper tortor odio id arcu. Pellentesque non nibh elit. Vivamus
eget arcu lorem. Sed sit amet interdum sapien.
`.trim(),
    });
    const scores = [];
    for (let i = 0; i < 100; i++) {
      scores.push({score: _.random(9000)});
    }
    await Score.bulkCreate(scores);
    testUser.addScores(await Score.findAll());
    await Score.bulkCreate(scores);
    testUser2.addScores(await Score.findAll({where: {userId: null}}));
  })();
} else {
  // populate data for production
  (async () => {
    let names = `
Kenyatta
Lucas
Luana
Jacques
Linette
Major
Kai
Joslyn
Nella
Shawn
Leonila
Janel
Kira
Eddie
Maribel
Neda
Dia
Wai
Joaquin
Eleni
    `.trim().split('\n');
    for (let x = 0; x < 20; x++) {
      const [name, score] = [names[x], _.random(12) * 10];
      const sampleUser = await User.create({
        username: name,
        email: crypto.randomBytes(10)
                           .toString('hex') + '@example.com',
        password: calculateSaltHash(crypto.randomBytes(10)
                           .toString('hex')),
        biography: `
Lorm ipsum dolor sit amet, consectetur adipiscing elit. Duis pharetra ex
consequat velit finibus dapibus. Morbi vulputate sapien et purus placerat,
eget tristique urna hendrerit. Mauris et orci ullamcorper, porta enim
quis, consectetur dolor. Sed ullamcorper, ligula vel maximus feugiat, ex
turpis facilisis risus, eu commodo lacus risus id ante. Curabitur bibendum
ante lorem, nec ullamcorper nisi placerat ac. Aliquam erat volutpat.
Praesent facilisis, lorem eget accumsan convallis, tortor diam cursus
orci, eu semper tortor odio id arcu. Pellentesque non nibh elit. Vivamus
eget arcu lorem. Sed sit amet interdum sapien.
`.trim(),
      });
      await sampleUser.createScore({score});
    }
  })();
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {},
  });
});

export default app;
