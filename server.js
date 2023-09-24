const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const bodyParser = require('body-parser');
const { Op } = require('sequelize');
const db = require('./app/models');

const app = express();

const Appointment = db.appointments;

const corsOptions = {
  origin: 'http://localhost:8081',
};

app.use(cors(corsOptions));

// parse requests of content-type - application/json
app.use(express.json());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

require('./app/routes/appointment.routes')(app);

// simple route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to appointments api.' });
});

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

db.sequelize.sync({ force: true })
  .then(() => {
    console.log('Drop and re-sync db.');
  })
  .catch((err) => {
    console.log(`Failed to sync db: ${err.message}`);
  });

cron.schedule('* * * * *', async () => {
  console.log('weee');
  try {
    const results = await Appointment.findAll(
      {
        where: {
          reservedAt: { [Op.ne]: null },
        },
      },
    );
    for (let i = 0; i < results.length; i += 1) {
      const validWindow = new Date(new Date(results[i].reservedAt).getTime() + 30000 * 60);
      if (validWindow < new Date()) {
        results[i].reservedAt = null;
        results[i].status = 'available';
        results[i].save();
      }
    }
  } catch (err) {
    console.log('Some error occurred while processing expirations.', err);
  }
});
