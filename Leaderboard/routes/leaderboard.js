import express from 'express';
import _ from 'lodash';

import {User, Score} from '../database';
import {asyncWrap} from '../helper';
const router = express.Router();

const handleLeaderboard = async (req, res, next) => {
  const topScoresRaw = await Score.findAll({
    include: [{model: User, required: true}],
    order: [['score', 'DESC']],
    limit: 10,
  });

  // Sequelize is dumb and doesn't have an obvious way to select ONLY the data
  // that you're interested in in a query. So we have to do some ugly
  // functional programming on the raw query result to fix it.
  const scores = topScoresRaw.map(obj => ({
    score: obj.dataValues.score,
    username: obj.dataValues.user.dataValues.username,
  }));
  res.render('leaderboard', {scores});
};

router.get('/', asyncWrap(handleLeaderboard));

const handleUserId = async (req, res, next) => {
  const user = await User.findOne({username: req.params.username});
  if (user === null) {
    let err = new Error(req.app.locals.userNotFound);
    err.status = 404;
    return next(err);
  }
  const scores = await user.getScores({scope: {
    order: [['score', 'DESC']],
  }}).map(score => score.get());
  const userView = user.get();
  userView.scores = scores;
  res.render('user', userView);
};

router.get('/user/:username', asyncWrap(handleUserId));

export default router;
