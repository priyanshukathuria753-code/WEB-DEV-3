const getproducts=(req,res)=>{
    const id=req.params.id;
    console.log(id);
    const result=products.find(product => product.id==id);
    if(result==undefined){
        res.status(404).json({success: false, message: 'Product not found'});
    } else {
        res.json({success: true,result});
    }
}

const createproduct=(req, res) => {
    const product=req.body; 
    products.push({id: products.length + 1, ...product});
    res.json({success: true, products});
} 