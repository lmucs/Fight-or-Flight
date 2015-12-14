import express from 'express';
import _ from 'lodash';
import js2xmlparser from 'js2xmlparser';
import auth from 'basic-auth';

import v1 from './v1';
import {User, Score} from '../../database';
import {asyncWrap} from '../../helper';
import {UserNotFoundError} from '../../errors';
import {calculateHash} from '../../cryptography';

const router = express.Router();

const getUser = async (req, res, next) => {
  const user = await User.findOne({
    where: {
      username: req.params.username.toLowerCase(),
    },
  });
  if (user === null) {
    return next(new UserNotFoundError());
  }
  const sanitizedUser = _.pick(user.get(), ['username', 'biography']);

  res.set('Content-Type', 'text/xml');
  return res.send(js2xmlparser('user', sanitizedUser));
};

const getAuthToken = async (req, res, next) => {
  const user = auth(req);
  const userModel = await User.findOne({
    where: {
      username: user.name.toLowerCase(),
    }
  });
  if (userModel === null) {
    console.log('Error finding user');
    res.status(401);
    return res.send();
  }
  let [iterations, salt, hash] = userModel.password.split('$');
  iterations = parseInt(iterations, 10);
  if (hash !== calculateHash(user.pass, salt, iterations)) {
    console.log('Error confirming password');
    return res.status(401).send();
  } else {
    console.log('User is valid!!!!!!!!!!!');
    res.send();
  }
};

router.get('/auth', asyncWrap(getAuthToken));

router.get('/user/:username', asyncWrap(getUser));

const getScores = async (req, res, next) => {
  let scores;
  if (req.params.username) {
    const user = await User.findOne({
      where: {
        username: req.params.username.toLowerCase(),
      },
    });
    if (user === null) {
      return next(new UserNotFoundError());
    }
    scores = await user.getScores({
      order: [['score', 'DESC']],
    }).map(score => ({
      username: user.get('username'),
      score: score.get('score')
    }));
  } else {
    const topScoresRaw = await Score.findAll({
      include: [{model: User, required: true}],
      order: [['score', 'DESC']],
    });
    scores = topScoresRaw.map(obj => ({
      score: obj.get('score'),
      username: obj.get('user').get('username'),
    }));
  }
  res.set('Content-Type', 'text/xml');
  return res.send(js2xmlparser('scores', {scores}));
};

router.get('/scores/:username?', asyncWrap(getScores));

const postScore = async (req, res, next) => {
  const user = auth(req);
  const userModel = await User.findOne({
    where: {
      username: user.name.toLowerCase(),
    }
  });
  if (userModel === null) {
    console.log('Error finding user');
    res.status(401);
    return res.send();
  }
  let [iterations, salt, hash] = userModel.password.split('$');
  iterations = parseInt(iterations, 10);
  if (hash !== calculateHash(user.pass, salt, iterations)) {
    console.log('Error confirming password');
    return res.status(401).send();
  } else {
    console.log('SCORE POSTING SUCCESS!!!!!!!!!!!');
    res.send();
  }
};

router.post('/scores/:username', asyncWrap(postScore));

export default router;
