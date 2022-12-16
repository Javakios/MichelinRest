const { default: axios } = require("axios");
const { decode } = require("jsonwebtoken");
const database = require("../database");
const decoder = new TextDecoder("ISO-8859-7");

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
        let data = this.correctDateQty(qtysonDate, dates, qty);
        console.log(data);
        let datesarr = [];
        let qty_on_dates = [];
        for (let i = 0; i < data.length; i++) {
          datesarr[i] = data[i].dates;
          qty_on_dates[i] = data[i].qty_on_date;
        }
        if (results[0].length > 0) {
          let update = await database.execute(
            "update cart set availability=?,dates=?,qty=?,qtys_on_dates=? where mtrl=? and trdr=?",
            [avail, datesarr.join(","), qty, qty_on_dates.join(","), mtrl, trdr]
          );
          res.status(200).json({ message: "product updated" });
        } else {
          let insert = await database.execute(
            "insert into cart (mtrl,trdr,qty,availability,dates,qtys_on_dates) VALUES (?,?,?,?,?,?)",
            [mtrl, trdr, qty, avail, datesarr.join(","), qty_on_dates.join(",")]
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

exports.correctDateQty = (qtys_on_dates, dates, qty) => {
  console.log(qtys_on_dates, dates, qty);

  let qty_on_dates = this.fromStringToArray(qtys_on_dates);
  let datesar = this.fromStringToArray(dates);
  let qtys = +qty;
  let returnData = [];
  let qty_count = 0;
  for (let i = 0; i < qty_on_dates.length; ++i) {
    console.log(qty_on_dates[i]);
    qty_count += +qty_on_dates[i];
    if (qtys > qty_count) {
      returnData.push({
        qty_on_date: +qty_on_dates[i],
        dates: datesar[i],
      });
    } else {
      let diff = +qty_count - +qtys;
      let qtydata = +qty_on_dates[i] - +diff;
      console.log(qtydata);
      returnData.push({
        qty_on_date: qtydata,
        dates: datesar[i],
      });
      break;
    }
  }
  return returnData;
};
exports.diff = (q, c) => {
  return c - q;
};
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
  let arr = string.split(",");
  return arr;
};
exports.updateStock = async (req, res, next) => {
  const method = req.body.method;

  if (!method) {
    res.status(402).json({ message: "fill the required fields" });
  } else {
    let clientID = await this.login();
    clientID = await this.authenticate(clientID);
    let stocks = await this.stockupdate(clientID);
    await this.stockToDatabase(stocks);
    res.status(200).json({ message: "Stock Updated" });
  }
};
exports.updateCategories =async (req,res,next) =>{
  const method = req.body.method;
  if(!method) {
    res.status(402).json({message:"fill the required fields"});
  }else{
    let clientID = await this.login();
    clientID = await this.authenticate(clientID);
    let categories = await this.mtrCategory(clientID)
    await this.categoriesUpdate(categories);
    res.status(200).json({message:"Categories Updated"});
  }
}
exports.categoriesUpdate = async(categories) =>{
  for(let i = 0 ; i < categories.totalcount;i ++){
    await this.categoriesToDb(categories.rows[i]);
  }
}
exports.categoriesToDb = async(category) =>{
  let select = await database.execute("select * from category where category=?", [
    category.mtrcategory,
  ]);
  try {
    if (select[0].length > 0) {
      let update = await database.execute(
        "update category set code = ?,name=? where category=?",
        [category.code, category.name, category.mtrcategory]
      );
    } else {
      let insert = await database.execute(
        "insert into category (category,code,name) VALUES(?,?,?)",
        [category.mtrcategory, category.code, category.name]
      );
    }
  } catch (err) {
    throw err;
  }
}
exports.mtrCategory = async(clientID) =>{
  var data = JSON.stringify({
    service: "SqlData",
    clientID: clientID,
    appId: "1001",
    Sqlname: "MTRCATEGORY",
    param1: "20220101",
  });

  var config = {
    method: "post",
    url: "https://periferiaki.oncloud.gr/s1services",
    headers: {
      "Content-Type": "application/json;charset=windows-1253",
      "X-APPSMITH-DATATYPE": "TEXT",
    },
    data,
    responseType: "arraybuffer",
    reponseEncoding: "binary",
  };
  let categories = await axios(config)
  let decodedCategories = decoder.decode(categories.data);
  decodedCategories = JSON.parse(decodedCategories);
  return decodedCategories;
}
exports.updateModel = async (req, res, next) => {
  const method = req.body.method;

  if (!method) {
    res.status(402).json({ message: "fill the required fields" });
  } else {
    let clientID = await this.login();
    clientID = await this.authenticate(clientID);
    let models = await this.mtrlModel(clientID);
    await this.modelsUpdate(models);
    res.status(200).json({ mesage: "Models Updated" });
  }
};
exports.modelsUpdate = async (models) => {
  for (let i = 0; i < models.totalcount; i++) {
    await this.modelsToDb(models.rows[i]);
  }
};

exports.modelsToDb = async (model) => {
  console.log(model);
  let select = await database.execute("select * from model where model_id=?", [
    model.mtrmodel,
  ]);
  try {
    if (select[0].length > 0) {
      let update = await database.execute(
        "update model set code = ?,name=? where model_id=?",
        [model.code, model.name, model.mtrmodel]
      );
    } else {
      let insert = await database.execute(
        "insert into model (model_id,code,name) VALUES(?,?,?)",
        [model.mtrmodel, model.code, model.name]
      );
    }
  } catch (err) {
    throw err;
  }
};
exports.updateGroup = async (req,res,next) =>{
  const method = req.body.method;
  
  if(!method){
    res.status(402).json({mesage:"fill the required fields"});
  }else{
    let clientID = await this.login();
    clientID = await this.authenticate(clientID);
    let group = await this.mtrGroup(clientID);
    await this.groupUpdate(group);
    res.status(200).json({message:"Group Updated"});
  }
}
exports.groupUpdate =async (group) =>{
  for(let i =0 ; i < group.totalcount;i++){
    await this.groupToDb(group.rows[i]);
  }
}
exports.groupToDb = async(group) =>{
  let select = await database.execute("select * from group_categories where group_id=?", [
    group.mtrgroup,
  ]);
  try {
    if (select[0].length > 0) {
      let update = await database.execute(
        "update group_categories set code = ?,name=? where group_id=?",
        [group.code, group.name, group.mtrgroup]
      );
    } else {
      let insert = await database.execute(
        "insert into group_categories (group_id,code,name) VALUES(?,?,?)",
        [group.mtrgroup, group.code, group.name]
      );
    }
  } catch (err) {
    throw err;
  }
}
exports.mtrGroup = async(clientID) =>{
  var data = JSON.stringify({
    service: "SqlData",
    clientID: clientID,
    appId: "1001",
    Sqlname: "MTRGROUP",
    param1: "20220101",
  });

  var config = {
    method: "post",
    url: "https://periferiaki.oncloud.gr/s1services",
    headers: {
      "Content-Type": "application/json;charset=windows-1253",
      "X-APPSMITH-DATATYPE": "TEXT",
    },
    data,
    responseType: "arraybuffer",
    reponseEncoding: "binary",
  };
  let group = await axios(config);
  let decodedGroup = decoder.decode(group.data);
  decodedGroup = JSON.parse(decodedGroup);
  return decodedGroup;
}
exports.updateManfctr =async (req,res,next )=>{
  const method = req.body.method;

  if(!method){
    res.status(402).json({message:"fill the required fields"});
  }else{
    let clientID = await this.login();
    clientID = await this.authenticate(clientID);
    let manfctr = await this.mtrlManfctr(clientID);
    await this.manfctrUpdate(manfctr);
    res.status(200).json({message:"Manfctr Updated"});
  }
}
exports.manfctrUpdate = async(manfctr)=>{
  for(let i = 0 ; i < manfctr.totalcount; i++){
    await this.manfctrToDb(manfctr.rows[i]);
  }
}
exports.manfctrToDb = async (manfctr) =>{
  let select = await database.execute("select * from manfctr where manfctr_id=?", [
    manfctr.mtrmanfctr,
  ]);
  try {
    if (select[0].length > 0) {
      let update = await database.execute(
        "update manfctr set code = ?,name=? where manfctr_id=?",
        [manfctr.code, manfctr.name, manfctr.mtrmanfctr]
      );
    } else {
      let insert = await database.execute(
        "insert into manfctr (manfctr_id,code,name) VALUES(?,?,?)",
        [manfctr.mtrmanfctr, manfctr.code, manfctr.name]
      );
    }
  } catch (err) {
    throw err;
  }
}
exports.mtrlManfctr = async(clientID) =>{
  var data = JSON.stringify({
    service: "SqlData",
    clientID: clientID,
    appId: "1001",
    Sqlname: "MTRMANFCTR",
    param1: "20220101",
  });

  var config = {
    method: "post",
    url: "https://periferiaki.oncloud.gr/s1services",
    headers: {
      "Content-Type": "application/json;charset=windows-1253",
      "X-APPSMITH-DATATYPE": "TEXT",
    },
    data,
    responseType: "arraybuffer",
    reponseEncoding: "binary",
  };

  let manfctr = await axios(config);
  let decodedManfctr = decoder.decode(manfctr.data);
  decodedManfctr = JSON.parse(decodedManfctr);
  return decodedManfctr;
};

exports.updateMark = async (req, res, next) => {
  const method = req.body.method;

  if (!method) {
    res.status(402).json({ message: "fill the required fields" });
  } else {
    let clientID = await this.login();
    clientID = await this.authenticate(clientID);
    let mark = await this.mtrMark(clientID);
    await this.markUpdate(mark);
    res.status(200).json({ message: "Mark Updated" });
  }
};
exports.markUpdate = async (mark) => {
  for (let i = 0; i < mark.totalcount; i++) {
    await this.markToDb(mark.rows[i]);
  }
};
exports.markToDb = async (mark) => {
  let select = await database.execute("select * from mark where mark_id=?", [
    mark.mtrmark,
  ]);
  try {
    if (select[0].length > 0) {
      let update = await database.execute(
        "update mark set code = ?,name=? where mark_id=?",
        [mark.code, mark.name, mark.mtrmark]
      );
    } else {
      let insert = await database.execute(
        "insert into mark (mark_id,code,name) VALUES(?,?,?)",
        [mark.mtrmark, mark.code, mark.name]
      );
    }
  } catch (err) {
    throw err;
  }
};
exports.mtrMark = async (clientID) => {
  var data = JSON.stringify({
    service: "SqlData",
    clientID: clientID,
    appId: "1001",
    Sqlname: "MTRMARK",
    param1: "20220101",
  });

  var config = {
    method: "post",
    url: "https://periferiaki.oncloud.gr/s1services",
    headers: {
      "Content-Type": "application/json;charset=windows-1253",
      "X-APPSMITH-DATATYPE": "TEXT",
    },
    data,
    responseType: "arraybuffer",
    reponseEncoding: "binary",
  };

  let mark = await axios(config);
  let decodedMark = decoder.decode(mark.data);
  decodedMark = JSON.parse(decodedMark);
  return decodedMark;
};
exports.mtrlModel = async (clientID) => {
  var data = JSON.stringify({
    service: "SqlData",
    clientID: clientID,
    appId: "1001",
    Sqlname: "MTRMODEL",
    param1: "20220101",
  });

  var config = {
    method: "post",
    url: "https://periferiaki.oncloud.gr/s1services",
    headers: {
      "Content-Type": "application/json;charset=windows-1253",
      "X-APPSMITH-DATATYPE": "TEXT",
    },
    data,
    responseType: "arraybuffer",
    reponseEncoding: "binary",
  };

  let models = await axios(config);
  let decodedModels = decoder.decode(models.data);
  decodedModels = JSON.parse(decodedModels);
  return decodedModels;
};

exports.updateProducts = async (req, res, next) => {
  const method = req.body.method;

  if (!method) {
    res.status(402).json({
      message: "fill the required fields",
    });
  } else {
    let clientID = await this.login();
    clientID = await this.authenticate(clientID);
    let products = await this.mtrlUpdate(clientID);

    await this.productsToDatabase(products);
    res.status(200).json({ mesage: "Products Updated" });
  }
};
exports.productsToDatabase = async (products) => {
  for (let i = 0; i < products.totalcount; i++) {
    await this.addToDatabase(products.rows[i]);
  }
};
exports.stockToDatabase = async (stocks) => {
  for (let i = 0; i < stocks.totalcount; i++) {
    await this.addStockToDatabase(stocks.rows[i]);
  }
};
exports.addStockToDatabase = async (stock) => {
  let update = await database.execute(
    "update products set apothema_thess=?,apothema_athens=? where mtrl=?",
    [stock.Thess_Apothema, stock.Athens_Apothema, stock.MTRL]
  );
};
exports.addToDatabase = async (product) => {
  let select = await database.execute("select * from products where mtrl=?", [
    product.mtrl,
  ]);
  try {
    if (+product.cccprweb != 0 || product.cccprweb != "0") {
      if (select[0].length > 0) {
        let update = await database.execute(
          "update products set code=?,name=?,cai=?,tupos_elastikou=?,omada=?,marka=?,zanta=?,epoxi=?,upddate=? where mtrl=?",
          [
            product.code,
            product.name,
            product.CAI,
            product.Tupos_Elastikou,
            product.Omada,
            product.Marka,
            product.Zanta,
            product.Epoxi,
            product.upddate,
            product.mtrl,
          ]
        );
      } else {
        let insert = await database.execute(
          "insert into products (mtrl,code,name,cai,tupos_elastikou,omada,marka,zanta,epoxi,upddate) VALUES (?,?,?,?,?,?,?,?,?,?)",
          [
            product.mtrl,
            product.code,
            product.name,
            product.CAI,
            product.Tupos_Elastikou,
            product.Omada,
            product.Marka,
            product.Zanta,
            product.Epoxi,
            product.upddate,
          ]
        );
      }
    } else {
      let deleteProd = await database.execute(
        "delete from products where mtrl=?",
        [product.mtrl]
      );
    }
  } catch (err) {
    throw err;
  }
};
exports.login = async () => {
  var data = JSON.stringify({
    service: "login",
    username: "b2badmin",
    password: "1234",
    appId: "1001",
  });
  var config = {
    method: "post",
    url: "https://periferiaki.oncloud.gr/s1services",
    headers: {
      "Content-Type": "application/json;charset=windows-1253",
      "X-APPSMITH-DATATYPE": "TEXT",
    },
    data,
    responseType: "arraybuffer",
    reponseEncoding: "binary",
  };
  let login = await axios(config);
  try {
    let decodedData = decoder.decode(login.data);
    console.log("login done");
    decodedData = JSON.parse(decodedData);
    return decodedData.clientID;
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    throw err;
  }
};

exports.authenticate = async (clientID) => {
  var data = JSON.stringify({
    service: "authenticate",
    clientID: clientID,
    company: "1001",
    branch: "1000",
    module: "0",
    refid: "1",
  });

  var config = {
    method: "post",
    url: "https://periferiaki.oncloud.gr/s1services",
    headers: {
      "Content-Type": "application/json;charset=windows-1253",
      "X-APPSMITH-DATATYPE": "TEXT",
    },
    data: data,
    responseType: "arraybuffer",
    reponseEncoding: "binary",
  };

  let authenticate = await axios(config);

  let decodedData = decoder.decode(authenticate.data);
  decodedData = JSON.parse(decodedData);
  return decodedData.clientID;
};
exports.stockupdate = async (clientID) => {
  var data = JSON.stringify({
    service: "SqlData",
    clientID: clientID,
    appId: "1001",
    Sqlname: "STOCKUPDATE",
    param1: "20221201",
    param2: "20221215",
    param3: "2022",
    param4: "12",
  });
  var config = {
    method: "post",
    url: "https://periferiaki.oncloud.gr/s1services",
    headers: {
      "Content-Type": "application/json;charset=windows-1253",
      "X-APPSMITH-DATATYPE": "TEXT",
    },
    data: data,
    responseType: "arraybuffer",
    reponseEncoding: "binary",
  };

  let stocks = await axios(config);
  let decodedStock = decoder.decode(stocks.data);
  decodedStock = JSON.parse(decodedStock);
  return decodedStock;
};
exports.mtrlUpdate = async (clientID) => {
  var data = JSON.stringify({
    service: "SqlData",
    clientID: clientID,
    appId: "1001",
    Sqlname: "MTRLUPDATE",
    param1: "20220101",
  });

  var config = {
    method: "post",
    url: "https://periferiaki.oncloud.gr/s1services",
    headers: {
      "Content-Type": "application/json;charset=windows-1253",
      "X-APPSMITH-DATATYPE": "TEXT",
    },
    data: data,
    responseType: "arraybuffer",
    reponseEncoding: "binary",
  };

  let products = await axios(config);

  let decodedProducts = decoder.decode(products.data);
  decodedProducts = JSON.parse(decodedProducts);
  return decodedProducts;
};
