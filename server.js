const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const bodyParser = require('body-parser');
const db = require('./app/models');
const { expire } = require('./app/controllers/appointment.controller');

const app = express();

const corsOptions = {
  origin: 'http://localhost:8081',
};

app.use(cors(corsOptions));

app.use(express.json());

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

require('./app/routes/appointment.routes')(app);

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to appointments api.' });
});

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
  await expire();
});
