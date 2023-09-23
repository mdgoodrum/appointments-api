module.exports = (sequelize, Sequelize) => {
  const Appointment = sequelize.define('appointment', {
    provider: {
      type: Sequelize.STRING,
    },
    timeslotStart: {
      type: Sequelize.DATE,
    },
    timeslotEnd: {
      type: Sequelize.DATE,
    },
    status: {
      type: Sequelize.STRING,
    },
    reservedAt: {
      type: Sequelize.DATE,
    },
  });

  return Appointment;
};
