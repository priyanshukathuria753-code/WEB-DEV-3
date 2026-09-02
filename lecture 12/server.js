const express = require('express');
const app = express();
const port = 3000;

const productsRoute = require('./route/productsroute.js');

app.use(express.json()); // JSON data parsing

app.use('/api', productsRoute);

app.listen(port, () => {
    console.log('Server is running');
});