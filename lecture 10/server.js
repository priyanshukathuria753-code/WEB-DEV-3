const express=require('express');
const app = express();
const port = 3000;
app.use(express.json()); //json data parsing

const products=[
    
    {
        id: 1,
        name: 'TUF A16',
        price: 130000
    },
    {
        id: 2,
        name: 'TUF A15',
        price: 110000
    },
    {
        id: 3,
        name: 'TUF A14',
        price: 105999
    }
];

app.get('/', (req, res) => {
    res.json(products);
});

app.get('/products/:id', (req, res) => {
    const id=req.params.id;
    console.log(id);
    const result=products.find(product => product.id==id);
    if(result==undefined){
        res.status(404).json({success: false, message: 'Product not found'});
    } else {
        res.json({success: true,result});
    }
});

// POST/Create
app.post('/products', (req, res) => {
    const product=req.body; 
    products.push({id: products.length + 1, ...product});
    res.json({success: true, products});
});

//Update/PUT
app.put('/products/:id', (req, res) => {
    const id=req.params.id;
    const product=req.body;
    const result=products.find(product => product.id==id);
    if(result==undefined){
        res.status(404).json({success: false, message: 'Product not found'});
    } else {
        result.name=product.name;
        result.price=product.price;
        res.json({success: true, products});
    }
});

//Delete

app.delete('/products/:id', (req, res) => {
    const id=req.params.id;
    const result=products.find(product => product.id==id);
    if(result==undefined){
        res.status(404).json({success: false, message: 'Product not found'});
    } else {
        const index=products.indexOf(result);
        products.splice(index, 1);
        res.json({success: true, products});
    }
});

app.listen(port, () => {
  console.log('Server is running');
});

