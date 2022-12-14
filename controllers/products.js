const database = require("../database");

exports.getAllProducts = (req, res, next) => {
  database
    .execute("select * from products")
    .then((products) => {
      let returnProds = [];
      for (let i = 0; i < products[0].length; i++) {
        returnProds[i] = {
          mtrl: products[0][i].mtrl,
          code: products[0][i].code,
          name: products[0][i].name,
          cai: products[0][i].cai,
          tipos_elastikou: products[0][i].tupos_elastikou,
          omada: products[0][i].omada,
          marka: products[0][i].marka,
          zanta: products[0][i].zanta,
          epoxi: products[0][i].epoxi,
          upddate: products[0][i].upddate,
          apothema_thess: products[0][i].apothema_thess,
          apothema_athens: products[0][i].apothema_athens,
          price: products[0][i].price,
          offer: products[0][i].offer,
          discount: products[0][i].discount,
          image: products[0][i].image,
        };
      }
      res.status(200).json({ message: "All Products", data: returnProds });
    })
    .catch((err) => {
      if (!err.statusCode) err.statusCode = 500;
      next(err);
    });
};

exports.addToCart = (req, res, next) => {
  const mtrl = req.body.mtrl;
  const trdr = req.body.trdr;
  const qty = req.body.qty;
  const avail = req.body.availability;
  const dates = req.body.dates;
  const qtysonDate = req.body.qtysonDate;

  if (!mtrl || !trdr || !qty || !avail || !dates || !qtysonDate) {
    res.status(402).json({ message: "Fill The Required Fields" });
  } else {
    database
      .execute("select * from cart where mtrl=? and trdr=?", [mtrl, trdr])
      .then(async (results) => {
         let data = this.correctDateQty(qtysonDate,dates,qty);
         console.log(data);
         let datesarr=[];
         let qty_on_dates=[];
         for(let i = 0 ; i < data.length;i++){
             datesarr[i] = data[i].dates;
             qty_on_dates[i] = data[i].qty_on_date
         }
        if (results[0].length > 0) {
          let update = await database.execute(
            "update cart set availability=?,dates=?,qty=?,qtys_on_dates=? where mtrl=? and trdr=?",
            [avail, datesarr.join(','), qty,qty_on_dates.join(','), mtrl, trdr]
          );
          res.status(200).json({ message: "product updated" });
        } else {
          let insert = await database.execute(
            "insert into cart (mtrl,trdr,qty,availability,dates,qtys_on_dates) VALUES (?,?,?,?,?,?)",
            [mtrl, trdr, qty, avail, datesarr.join(','),qty_on_dates.join(',')]
          );
          res.status(200).json({ message: "product inserted" });
        }
      })
      .catch((err) => {
        if (!err.statusCode) err.statusCode = 500;
        next(err);
      });
  }
};
exports.fetchCart = (req, res, next) => {
  const trdr = req.body.trdr;
  if (!trdr) {
    res.status(200).json({ message: "fill the required fields" });
  } else {
    database
      .execute("select * from cart where trdr=?", [trdr])
      .then(async (products) => {
        let returnProds = [];
        for (let i = 0; i < products[0].length; i++) {
          returnProds[i] = await this.getSingleCartItem(products[0][i]);
        }
        res.status(200).json({ message: "products", products: returnProds });
      });
  }
};
exports.removeCartItem = (req, res, next) => {
  const trdr = req.body.trdr;
  const mtrl = req.body.mtrl;

  if (!trdr || !mtrl) {
    res.status(402).json({ message: "fill the required fields" });
  } else {
    database
      .execute("delete from cart where mtrl=? and trdr=?", [mtrl, trdr])
      .then((results) => {
        console.log(results[0]);
        this.fetchCart(req, res, next);
      });
  }
};
exports.getSingleCartItem = async (singelProduct) => {
  let products = await database.execute("select * from products where mtrl=?", [
    singelProduct.mtrl,
  ]);
  if (products[0].length > 0) {
    return {
      mtrl: products[0][0].mtrl,
      code: products[0][0].code,
      name: products[0][0].name,
      cai: products[0][0].cai,
      tipos_elastikou: products[0][0].tupos_elastikou,
      omada: await this.findOmada(products[0][0].omada),
      marka: await this.findMarka(products[0][0].marka),
      zanta: await this.findZanta(products[0][0].zanta),
      epoxi: await this.findEpoxi(products[0][0].epoxi),
      upddate: products[0][0].upddate,
      apothema_thess: products[0][0].apothema_thess,
      apothema_athens: products[0][0].apothema_athens,
      price: products[0][0].price,
      offer: products[0][0].offer,
      discount: products[0][0].discount,
      image: products[0][0].image,
      qty: singelProduct.qty,
      date: singelProduct.dates,
      availability: singelProduct.availability,
      qty_on_dates: singelProduct.qtys_on_dates,
    };
  } else {
    return {
      mtrl: "",
      code: "",
      name: "",
      cai: "",
      tipos_elastikou: "",
      omada: "",
      marka: "",
      zanta: "",
      epoxi: "",
      upddate: "",
      apothema_thess: "",
      apothema_athens: "",
      price: "",
      offer: "",
      discount: "",
      image: "",
      qty: "",
      date: "",
      availability: "",
      qty_on_dates: "",
    };
  }
};

exports.correctDateQty = (qtys_on_dates,dates,qty) => {
  console.log(qtys_on_dates,dates,qty);

  let qty_on_dates = this.fromStringToArray(qtys_on_dates);
  let datesar = this.fromStringToArray(dates);
  let qtys =+ qty;
  let returnData = [];
  let qty_count =0;
  for (let i = 0; i < qty_on_dates.length; ++i ){
    console.log(qty_on_dates[i])
    qty_count += +qty_on_dates[i];
    if(qtys > qty_count){
        returnData.push({
            qty_on_date : +qty_on_dates[i],
            dates :datesar[i]
        })
        
     }else{
        let diff = +qty_count - +qtys
        let qtydata = +qty_on_dates[i] - +diff
        console.log(qtydata);
        returnData.push({
            qty_on_date : qtydata,
            dates : datesar[i]
        });
        break;
     }
    
  }
  return returnData;
};
exports.diff = (q,c) =>{
    return c - q ;
}
exports.findOmada = async (omada) => {
  let findOmada = await database.execute(
    "select * from group_categories where group_id=?",
    [omada]
  );
  try {
    return findOmada[0][0].name;
  } catch (e) {
    throw e;
  }
};
exports.findMarka = async (marka) => {
  let findMarka = await database.execute("select * from mark where mark_id=?", [
    marka,
  ]);
  try {
    return findMarka[0][0].name;
  } catch (e) {
    throw e;
  }
};
exports.findZanta = async (zanta) => {
  let findZanta = await database.execute(
    "select * from manfctr where manfctr_id=?",
    [zanta]
  );
  try {
    return findZanta[0][0].name;
  } catch (e) {
    throw e;
  }
};

exports.findEpoxi = async (epoxi) => {
  let findEpoxi = await database.execute(
    "select * from model where model_id=?",
    [epoxi]
  );
  try {
    console.log(findEpoxi[0][0].name);
    return findEpoxi[0][0].name;
  } catch (e) {
    throw e;
  }
};
exports.fromStringToArray = (string) => {
  let arr = string.split(',');
  return arr;
};
