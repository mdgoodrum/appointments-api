const router = require('express').Router();
const appointments = require('../controllers/appointment.controller');

module.exports = (app) => {
  router.post('/', appointments.create);

  router.get('/', appointments.findAll);

  app.use('/api/appointments', router);
};
