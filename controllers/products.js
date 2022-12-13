const database = require('../database');

exports.getAllProducts = (req,res,next) =>{

    database.execute('select * from products')
        .then(products =>{
            let returnProds = [];
            for(let i = 0; i< products[0].length;i++){
                returnProds[i]={
                    mtrl : products[0][i].mtrl,
                    code : products[0][i].code,
                    name : products[0][i].name,
                    cai  : products[0][i].cai,
                    tipos_elastikou : products[0][i].tupos_elastikou,
                    omada : products[0][i].omada,
                    marka : products[0][i].marka,
                    zanta : products[0][i].zanta,
                    epoxi : products[0][i].epoxi,
                    upddate:products[0][i].upddate,
                    apothema_thess : products[0][i].apothema_thess,
                    apothema_athens:products[0][i].apothema_athens,
                    price : products[0][i].price,
                    offer : products[0][i].offer,
                    discount : products[0][i].discount,
                    image : products[0][i].image
                }
            }
            res.status(200).json({message:"All Products",data:returnProds})
        })
        .catch(err =>{
            if(!err.statusCode) err.statusCode = 500;
            next(err);
        })
}

exports.addToCart = (req,res,next) =>{
    const mtrl = req.body.mtrl;
    const trdr = req.body.trdr;
    const qty = req.body.trdr;
    const avail = req.body.availability;
    const dates = req.body.dates;

    if(!mtrl || !trdr || !qty || !avail || !dates ){
        res.status(402).json({message:"Fill The Required Fields"});
    }else{
        database.execute('select * from cart where mtrl=? and trdr=?',[mtrl,trdr])
            .then(async results =>{
                if(results[0].length > 0){
                    let update = await database.execute('update cart set availability=?,dates=?,qty=?+qty where mtrl=? and trdr=?',[avail,dates,qty,mtrl,trdr])
                    res.status(200).json({message:"product updated"})
                }else{
                    let insert = await database.execute('insert into cart (mtrl,trdr,qty,availability,dates) VALUES (?,?,?,?,?)',
                        [mtrl,trdr,qty,avail,dates]
                        )
                    res.status(200).json({message:"product inserted"});
                }
            })
            .catch(err=>{
                if(!err.statusCode) err.statusCode = 500;
                next(err);
            })
    }
}
