const express=require('express');
const router=express.Router();
const products=require('../data/data.js');
const port = 3000;

router.get('/', (req, res) => {
    res.json(products);
});



router.get('/products/:id');

// POST/Create
router.post('/products');

//Update/PUT
router.put('/products/:id', (req, res) => {
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
router.delete('/products/:id', (req, res) => {
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

module.exports=router;
