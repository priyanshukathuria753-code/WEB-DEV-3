const express=require('express');
const app = express();
const port = 3000;

// app.get('/', (req, res) => {
//   res.send('Hello World');
// });



app.get('/', (req, res) => {
  res.send('Home Page');
});

app.get('/about', (req, res) => {
  res.send('About Page');
});

app.get('/contact', (req, res) => {
  res.send('Contact Page');
});0

app.listen(port, () => {
  console.log('Server is running');
});