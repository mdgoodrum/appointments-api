const db = require('../models');

const Appointment = db.appointments;

exports.create = async (req, res) => {
  if (!req.body.provider) {
    res.status(400).send({
      message: 'Provider can not be empty!',
    });
    return;
  }

  if (!req.body.start) {
    res.status(400).send({
      message: 'Start can not be empty!',
    });
    return;
  }

  if (!req.body.end) {
    res.status(400).send({
      message: 'End can not be empty!',
    });
    return;
  }

  const appointment = {
    provider: req.body.provider,
    timeslotStart: req.body.start,
    timeslotEnd: req.body.end,
    status: 'available',
  };

  try {
    const data = await Appointment.create(appointment);
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message:
          err.message || 'Some error occurred while creating the Appointment.',
    });
  }
};

exports.findAll = async (req, res) => {
  try {
    const data = await Appointment.findAll(
      {
        where:
        { status: 'available' },
      },
    );
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message:
          err.message || 'Some error occurred while retrieving appointments.',
    });
  }
};

exports.reserve = async (req, res) => {
  if (!req.params.id) {
    res.status(400).send({
      message: 'Id can not be empty!',
    });
    return;
  }
  const { id } = req.params;

  try {
    const appointment = await Appointment.findOne(
      {
        where: { id },
      },
    );
    if (appointment.status !== 'available') { // add time check here
      res.status(400).send({
        message: 'Cant reserve unavailable appointment',
      });
      return;
    }

    appointment.status = 'reserved';
    appointment.reservedAt = new Date();
    appointment.save();

    res.send({
      message: 'Appointment was reserved successfully.',
    });
  } catch (err) {
    res.status(500).send({
      message: `Error reserving appointment with id=${id}`,
    });
  }
};

exports.confirm = async (req, res) => {
  if (!req.params.id) {
    res.status(400).send({
      message: 'Id can not be empty!',
    });
    return;
  }
  const { id } = req.params;

  try {
    const appointment = await Appointment.findOne(
      {
        where: { id },
      },
    );
    if (appointment.status !== 'reserved') { // add time check here
      res.status(400).send({
        message: 'Cant confirm unreserved appointment',
      });
      return;
    }

    appointment.status = 'confirmed';
    appointment.reservedAt = null;
    appointment.save();

    res.send({
      message: 'Appointment was confirmed successfully.',
    });
  } catch (err) {
    res.status(500).send({
      message: `Error confirming appointment with id=${id}`,
    });
  }
};
