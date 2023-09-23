const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

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

const db = require('./app/models');

db.sequelize.sync({ force: true })
  .then(() => {
    console.log('Drop and re-sync db.');
  })
  .catch((err) => {
    console.log(`Failed to sync db: ${err.message}`);
  });
