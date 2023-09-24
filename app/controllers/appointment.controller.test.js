const {
  expire, confirm, reserve, create,
} = require('./appointment.controller');

jest.mock('../models');
const db = require('../models');

const Appointment = db.appointments;

const res = {
  status: jest.fn(() => res),
  send: jest.fn(() => res),
};

describe('expire', () => {
  it('should set expired appointments to "available"', async () => {
    const fakeAppointments = [
      {
        id: 1,
        reservedAt: new Date('2021-09-24T12:00:00'),
        status: 'reserved',
        save: jest.fn(),
      },
      {
        id: 2,
        reservedAt: new Date('2021-09-24T10:00:00'),
        status: 'reserved',
        save: jest.fn(),
      },
    ];

    Appointment.findAll.mockResolvedValue(fakeAppointments);

    await expire();

    expect(fakeAppointments[0].save).toHaveBeenCalled();
    expect(fakeAppointments[1].save).toHaveBeenCalled();

    expect(fakeAppointments[0].status).toBe('available');
    expect(fakeAppointments[0].reservedAt).toBe(null);
    expect(fakeAppointments[1].status).toBe('available');
    expect(fakeAppointments[1].reservedAt).toBe(null);
  });

  it('should not update non-expired appointments', async () => {
    const fakeAppointments = [
      {
        id: 1,
        reservedAt: new Date('2020-09-24T12:00:00'),
        status: 'reserved',
        save: jest.fn(),
      },
      {
        id: 2,
        reservedAt: new Date('2030-09-24T14:00:00'), // Future date, not expired
        status: 'reserved',
        save: jest.fn(),
      },
    ];

    Appointment.findAll.mockResolvedValue(fakeAppointments);

    await expire();

    // Assert that the save method was called only for the expired appointment
    expect(fakeAppointments[0].save).toHaveBeenCalled();
    expect(fakeAppointments[1].save).not.toHaveBeenCalled();

    // Assert that the status and reservedAt properties were updated for the expired appointment
    expect(fakeAppointments[0].status).toBe('available');
    expect(fakeAppointments[0].reservedAt).toBe(null);
  });

  it('should handle errors gracefully', async () => {
    Appointment.findAll.mockRejectedValue(new Error('error'));

    console.log = jest.fn();

    await expire();

    expect(console.log).toHaveBeenCalled();
  });
});

describe('confirm', () => {
  it('should respond with a 400 status and an error message when id is not provided', async () => {
    const req = {
      params: {},
    };

    await confirm(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: 'Id can not be empty!',
    });
  });

  it('should respond with a 500 status and an error message for unreserved appointments', async () => {
    const req = {
      params: {
        id: 1,
      },
    };

    const unreservedAppointment = {
      status: 'unreserved',
    };

    Appointment.findOne.mockResolvedValue(unreservedAppointment);

    await confirm(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      message: 'Cant confirm unreserved appointment',
    });
  });

  it('should respond with a 500 status and an error message for appointments within 24 hours', async () => {
    const req = {
      params: {
        id: 1,
      },
    };

    const appointmentWithin24Hours = {
      status: 'reserved',
      timeslotStart: new Date(new Date().getTime() + 1000), // 1 second in the future
    };

    Appointment.findOne.mockResolvedValue(appointmentWithin24Hours);

    await confirm(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      message: 'Cant confirm appointment under 24h of the selected time.',
    });
  });

  it('should confirm the appointment and respond with a success message', async () => {
    const req = {
      params: {
        id: 1,
      },
    };

    const validAppointment = {
      status: 'reserved',
      timeslotStart: new Date('2030-09-24T14:00:00'),
      save: jest.fn(),
    };

    Appointment.findOne.mockResolvedValue(validAppointment);

    await confirm(req, res);

    expect(validAppointment.status).toBe('confirmed');
    expect(validAppointment.reservedAt).toBe(null);
    expect(validAppointment.save).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith({
      message: 'Appointment was confirmed successfully.',
    });
  });

  it('should handle errors gracefully', async () => {
    const req = {
      params: {
        id: 1,
      },
    };

    Appointment.findOne.mockRejectedValue(new Error('error'));

    await confirm(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      message: `Error confirming appointment with id=${req.params.id}`,
    });
  });
});

describe('reserve', () => {
  it('should respond with a 400 status and an error message when id is not provided', async () => {
    const req = {
      params: {},
    };

    await reserve(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: 'Id can not be empty!',
    });
  });

  it('should respond with a 500 status and an error message for unavailable appointments', async () => {
    const req = {
      params: {
        id: 1,
      },
    };

    const unavailableAppointment = {
      status: 'unavailable',
    };

    Appointment.findOne.mockResolvedValue(unavailableAppointment);

    await reserve(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      message: 'Cant reserve unavailable appointment',
    });
  });

  it('should respond with a 500 status and an error message for appointments within 24 hours', async () => {
    const req = {
      params: {
        id: 1,
      },
    };

    const appointmentWithin24Hours = {
      status: 'available',
      timeslotStart: new Date(new Date().getTime() + 1000), // 1 second in the future
    };

    Appointment.findOne.mockResolvedValue(appointmentWithin24Hours);

    await reserve(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      message: 'Cant reserve appointment under 24h of the selected time.',
    });
  });

  it('should reserve the appointment and respond with a success message', async () => {
    const req = {
      params: {
        id: 1,
      },
    };

    const validAppointment = {
      status: 'available',
      timeslotStart: new Date('2030-09-24T14:00:00'),
      save: jest.fn(),
    };

    Appointment.findOne.mockResolvedValue(validAppointment);

    await reserve(req, res);

    expect(validAppointment.status).toBe('reserved');
    expect(validAppointment.reservedAt instanceof Date).toBe(true);
    expect(validAppointment.save).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith({
      message: 'Appointment was reserved successfully.',
    });
  });

  it('should handle errors gracefully', async () => {
    const req = {
      params: {
        id: 1,
      },
    };

    Appointment.findOne.mockRejectedValue(new Error('error'));

    await reserve(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      message: `Error reserving appointment with id=${req.params.id}`,
    });
  });
});

describe('create', () => {
  it('should respond with a 400 status and an error message when provider is not provided', async () => {
    const req = {
      body: {},
    };

    await create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: 'Provider can not be empty!',
    });
  });

  it('should respond with a 400 status and an error message when start is not provided', async () => {
    const req = {
      body: {
        provider: 'Provider Name',
      },
    };

    await create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: 'Start can not be empty!',
    });
  });

  it('should respond with a 400 status and an error message when end is not provided', async () => {
    const req = {
      body: {
        provider: 'Provider Name',
        start: '2023-09-24T12:00:00',
      },
    };

    await create(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith({
      message: 'End can not be empty!',
    });
  });

  it('should create appointment slots and respond with a success message', async () => {
    const req = {
      body: {
        provider: 'Provider Name',
        start: '2023-09-24T12:00:00',
        end: '2023-09-24T12:30:00',
      },
    };

    const createdSlots = [
      {
        provider: 'Provider Name A',
        timeslotStart: new Date('2023-09-24T12:00:00'),
        timeslotEnd: new Date('2023-09-24T12:15:00'),
        status: 'available',
      },
      {
        provider: 'Provider Name B',
        timeslotStart: new Date('2023-09-24T12:15:00'),
        timeslotEnd: new Date('2023-09-24T12:30:00'),
        status: 'available',
      },
    ];

    Appointment.bulkCreate.mockResolvedValue(createdSlots);

    await create(req, res);

    expect(Appointment.bulkCreate).toHaveBeenCalled();
    expect(res.send).toHaveBeenCalledWith(createdSlots);
  });

  it('should handle errors gracefully', async () => {
    const req = {
      body: {
        provider: 'Provider Name',
        start: '2023-09-24T12:00:00',
        end: '2023-09-24T14:00:00',
      },
    };

    Appointment.bulkCreate.mockRejectedValue(new Error('error'));

    await create(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith({
      message: 'error',
    });
  });
});
