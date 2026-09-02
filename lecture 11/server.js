const express=require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
    console.log(req.url);
    console.log(req.method);
    // console.log(req.body);
    console.log(req.params.name);
  res.send('HEllo World');
});

app.get('/students', (req, res) => {
    console.log(req.url);
    console.log(req.query.cgpa);
    res.send('Hello Student');
});

app.listen(port, () => {
  console.log('Server is running');
}
)