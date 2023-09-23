const router = require('express').Router();
const appointments = require('../controllers/appointment.controller');

module.exports = (app) => {
  router.post('/', appointments.create);

  router.get('/', appointments.findAll);

  router.post('/reserve/:id', appointments.reserve);

  router.post('/confirm/:id', appointments.confirm);

  app.use('/api/appointments', router);
};
