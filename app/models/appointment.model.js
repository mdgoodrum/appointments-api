module.exports = (sequelize, Sequelize) => {
  const Appointment = sequelize.define('appointment', {
    provider: {
      type: Sequelize.STRING,
    },
    timeslot_start: {
      type: Sequelize.DATE,
    },
    timeslot_end: {
      type: Sequelize.DATE,
    },
    status: {
      type: Sequelize.STRING,
    },
    reserved_at: {
      type: Sequelize.DATE,
    },
  });

  return Appointment;
};
