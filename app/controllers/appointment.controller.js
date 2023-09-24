const { Op } = require('sequelize');
const db = require('../models');

const Appointment = db.appointments;
const THIRTY_MINUTES = 60000 * 30;
const FIFTEEN_MINUTES = 60000 * 15;
const ONE_MINUTES = 60000;

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

  const parsedStart = Date.parse(req.body.start);
  const parsedEnd = Date.parse(req.body.end);

  if (!Number.isInteger(parsedStart)) {
    res.status(400).send({
      message: 'Start needs to be a date!',
    });
    return;
  }

  if (!Number.isInteger(parsedEnd)) {
    res.status(400).send({
      message: 'End needs to be a date!',
    });
    return;
  }

  if (parsedStart > parsedEnd) {
    res.status(400).send({
      message: 'Start needs to be before End!',
    });
    return;
  }

  const startAsDate = new Date(parsedStart);
  const endAsDate = new Date(parsedEnd);

  if (startAsDate.toDateString() !== endAsDate.toDateString()) {
    res.status(400).send({
      message: 'Start and End need to be on the same day!',
    });
    return;
  }

  const startMinutes = startAsDate.getMinutes();

  if (startMinutes % 15 !== 0) {
    res.status(400).send({
      message: 'Start needs to be in 15 minute increments!',
    });
    return;
  }

  const endMinutes = endAsDate.getMinutes();

  if (endMinutes % 15 !== 0) {
    res.status(400).send({
      message: 'End needs to be in 15 minute increments',
    });
  }

  const differenceInMinutes = (endAsDate.getTime() - startAsDate.getTime())
    / (ONE_MINUTES);

  const numberOfSlots = differenceInMinutes / 15;

  const slots = [];

  let currentSlot = startAsDate;

  for (let i = 0; i < numberOfSlots; i += 1) {
    const nextSlot = new Date(currentSlot.getTime() + (FIFTEEN_MINUTES));
    slots.push({
      provider: req.body.provider,
      timeslotStart: currentSlot,
      timeslotEnd: nextSlot,
      status: 'available',
    });
    currentSlot = nextSlot;
  }

  try {
    const data = await Appointment.bulkCreate(slots);
    res.send(data);
  } catch (err) {
    res.status(500).send({
      message:
          err.message || 'Some error occurred while creating the Appointments.',
    });
  }
};

exports.findAll = async (req, res) => {
  const validWindow = new Date(new Date().setDate(new Date().getDate() + 1));

  try {
    const data = await Appointment.findAll(
      {
        where: {
          status: 'available',
          timeslotStart: { [Op.gte]: validWindow },
        },
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
    if (appointment.status !== 'available') {
      res.status(500).send({
        message: 'Cant reserve unavailable appointment',
      });
      return;
    }

    const validWindow = new Date(new Date().setDate(new Date().getDate() + 1));

    if (Date.parse(appointment.timeslotStart) < validWindow) {
      res.status(500).send({
        message: 'Cant reserve appointment under 24h of the selected time.',
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
    if (appointment.status !== 'reserved') {
      res.status(500).send({
        message: 'Cant confirm unreserved appointment',
      });
      return;
    }

    const validWindow = new Date(new Date().setDate(new Date().getDate() + 1));

    if (Date.parse(appointment.timeslotStart) < validWindow) {
      res.status(500).send({
        message: 'Cant confirm appointment under 24h of the selected time.',
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

exports.expire = async () => {
  try {
    const results = await Appointment.findAll(
      {
        where: {
          reservedAt: { [Op.ne]: null },
        },
      },
    );
    for (let i = 0; i < results.length; i += 1) {
      const validWindow = new Date(new Date(results[i].reservedAt).getTime() + (THIRTY_MINUTES));
      if (validWindow < new Date()) {
        results[i].reservedAt = null;
        results[i].status = 'available';
        results[i].save();
      }
    }
  } catch (err) {
    console.log('Some error occurred while processing expirations.', err);
  }
};
