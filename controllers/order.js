const database = require("../database");
const axios = require("axios");
const xml = require("xml2js");

exports.xmlReq = async (req, res, next) => {
  const cai = req.body.cai;
  const qty = req.body.qty;
  const name = req.body.name;
  console.log(name);
  if (name) {
    let newName = "%" + name + "%";
    let names = await database.execute(
      "select cai from products where name LIKE ?",
      [newName]
    );
    try {
      let return_prods = [];
      for (let i = 0; i < names[0].length; i++) {
        console.log(names[0][i]);
        return_prods.push(await this.findProduct(names[0][i].cai, next));
      }
      res.status(200).json({
        message: "products",
        product: return_prods,
        product_name: "name",
      });
    } catch (error) {
      throw error;
    }
  } else if (cai && qty) {
    xml.parseString(
      await this.michelinConnection(this.getBody(cai, qty), "inquiry"),
      async (err, results) => {
        if (err) {
          throw err;
        }
        xml.parseString(
          await this.michelinConnection(
            this.getOrderStatus(cai),
            "order_status"
          ),
          async (err, orderStatus) => {
            if (err) throw err;
            let infos = this.getImportantInfo(orderStatus);
            const json = JSON.parse(JSON.stringify(results, null, 4));
            const response = await this.buetifyResponse(json);
            const product = await this.findProductWithDates(
              cai,
              response,
              infos
            );
            if (product.mtrl) {
              console.log(response);
              res.status(200).json({
                message: "Response",
                response: response,
                product_name:
                  json.quote.OrderLine[0].OrderedArticle[0]
                    .ArticleDescription[0].ArticleDescriptionText[0],
                product: product,
              });
            } else {
              res.status(404).json({ message: "No Product Found" });
            }
          }
        );
      }
    );
  } else {
    res.status(402).json({ message: "fill the required fields" });
  }
};
exports.getImportantInfo = (orderStatus) => {
  let docID = [];
  let confQty = [];
  let delDate = [];
  let orderdQty = [];
  let cancellQty = [];
  let reqDate = [];
  console.log(orderStatus.order_status.ReferencedOrder.length);
  for (let i = 0; i < orderStatus.order_status.ReferencedOrder.length; i++) {
    docID[i] =
      orderStatus.order_status.ReferencedOrder[
        i
      ].SupplierOrderNumber[0].DocumentID[0];
    confQty[i] =
      orderStatus.order_status.ReferencedOrder[
        i
      ].OrderLine[0].OrderedArticle[0].ScheduleDetails[0].ConfirmedQuantity[0].QuantityValue[0];
    if (
      orderStatus.order_status.ReferencedOrder[i].OrderLine[0].OrderedArticle[0]
        .ScheduleDetails[0].DeliveryDate
    ) {
      delDate[i] =
        orderStatus.order_status.ReferencedOrder[
          i
        ].OrderLine[0].OrderedArticle[0].ScheduleDetails[0].DeliveryDate[0];
    } else {
      delDate[i] = "Δεν ΠΡΟΚΕΙΤΑΙ ΝΑ ΤΟ ΠΑΡΕΙ ΠΟΤΕ";
    }

    orderdQty[i] =
      orderStatus.order_status.ReferencedOrder[
        i
      ].OrderLine[0].OrderedArticle[0].OrderedQuantity[0].QuantityValue[0];
    cancellQty[i] =
      orderStatus.order_status.ReferencedOrder[
        i
      ].OrderLine[0].OrderedArticle[0].ScheduleDetails[0].CancelledQuantity[0].QuantityValue[0];
    reqDate[i] =
      orderStatus.order_status.ReferencedOrder[
        i
      ].OrderLine[0].OrderedArticle[0].RequestedDeliveryDate[0];
  }
  return {
    documentID: docID,
    confirmedQuantity: confQty,
    deliveryDates: delDate,
    orderedQty: orderdQty,
    canceledQty: cancellQty,
    requestedDate: reqDate,
  };
};
exports.getOrderStatus = (cai) => {
  return `
  <?xml version="1.0" encoding="UTF-8"?>
  <order_status_request>
      <DocumentID>C1</DocumentID>
      <Variant>0</Variant>
      <OrderDateFrom></OrderDateFrom>
      <OrderDateTo></OrderDateTo>
      <OrderingMethod></OrderingMethod>
      <OrderStatusIndicator>1</OrderStatusIndicator>
      <BuyerParty>
          <PartyID>Q0040950</PartyID>
          <AgencyCode>91</AgencyCode>
      </BuyerParty>
      <ReferencedOrder>
          <SupplierOrderNumber>
              <DocumentID></DocumentID>
          </SupplierOrderNumber>
          <OrderReference>
              <DocumentID></DocumentID>
          </OrderReference>
          <Contract>
              <DocumentID></DocumentID>
          </Contract>
          <OrderedArticle>
              <ArticleIdentification>
                  <BuyersArticleID></BuyersArticleID>
                  <ManufacturersArticleID>${cai}</ManufacturersArticleID>
                  <EANUCCArticleID></EANUCCArticleID>
              </ArticleIdentification>
          </OrderedArticle>
      </ReferencedOrder>
  </order_status_request>
  `;
};
exports.findProductWithDates = async (cai, response, infos) => {
  let products = await database.execute(
    "select * from products where cai = ?",
    [cai]
  );
  try {
    if (products[0].length > 0) {
      console.log(products[0][0]);
      console.log(products[0][0].name);
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
        apothema_thess: products[0][0].apothema_thess,
        apothema_athens: products[0][0].apothema_athens,
        price: products[0][0].price,
        offer: products[0][0].offer,
        discount: products[0][0].discount,
        image: products[0][0].image,
        response: response,
        orderInfos: infos,
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
        apothema_thess: "",
        apothema_athens: "",
        price: "",
        offer: "",
        discount: "",
        image: "",
      };
    }
  } catch (err) {
    throw err;
  }
};

exports.findProduct = async (cai, next) => {
  let products = await database.execute(
    "select * from products where cai = ?",
    [cai]
  );
  try {
    if (products[0].length > 0) {
      console.log(products[0][0]);
      console.log(products[0][0].name);
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
        apothema_thess: products[0][0].apothema_thess,
        apothema_athens: products[0][0].apothema_athens,
        price: products[0][0].price,
        offer: products[0][0].offer,
        discount: products[0][0].discount,
        image: products[0][0].image,
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
        apothema_thess: "",
        apothema_athens: "",
        price: "",
        offer: "",
        discount: "",
        image: "",
      };
    }
  } catch (err) {
    throw err;
  }
};
exports.getOrderLine = (cai, qty) => {
  return `
           <OrderLine>
            <LineID>1</LineID>
            <OrderedArticle>
            <ArticleIdentification>
                <ManufacturersArticleID>${cai}</ManufacturersArticleID>
                <EANUCCArticleID></EANUCCArticleID>
            </ArticleIdentification>
            <RequestedDate></RequestedDate>
            <RequestedQuantity>
                <QuantityValue>${qty}</QuantityValue>
            </RequestedQuantity>
            </OrderedArticle>
        </OrderLine> 
        `;
};
exports.getBody = (cai, qty) => {
  return `
         <?xml version="1.0" encoding="UTF-8"?>
            <inquiry>
                <DocumentID>C1</DocumentID>
                <Variant>0</Variant>
                <TransportPriority>REPL</TransportPriority>
                <Campaign></Campaign>
                <CustomerReference>
                <DocumentID>Test001</DocumentID>
                </CustomerReference>
                <BuyerParty>
                    <PartyID>Q0040950</PartyID>
                    <AgencyCode>91</AgencyCode>
                </BuyerParty>${this.getOrderLine(cai, qty)}
            </inquiry>
        `;
};

exports.michelinConnection = async (body, id) => {
  let message_type = id;
  console.log(message_type);
  var config = {
    headers: {
      "Content-Type": "text/xml;charset=utf-8",
      Accept: "text/xml",
      Authorization: "Basic TVdHMjExMzpNaWNoZWxpbj0x",
      "Message-Type": message_type,
    },
  };
  let req = await axios.post(
    "https://bibserve-indus.michelin.com/eb3/C1/AdhocServlet",
    body,
    config
  );

  return req.data;
};
exports.buetifyResponse = (response) => {
  let deliveryDates = [];

  let availables = [];
  let returnData = [];
  for (let i = 0; i < response.quote.OrderLine.length; i++) {
    availables.push({
      available: response.quote.OrderLine[i].OrderedArticle[0].Availability[0],
    });
    console.log(response.quote.OrderLine[0].OrderedArticle[0].ScheduleDetails);
    for (
      let j = 0;
      j < response.quote.OrderLine[0].OrderedArticle[0].ScheduleDetails.length;
      j++
    ) {
      deliveryDates.push({
        delivery_dates:
          response.quote.OrderLine[i].OrderedArticle[i].ScheduleDetails[j]
            .DeliveryDate[0],
        quantity_value:
          response.quote.OrderLine[i].OrderedArticle[i].ScheduleDetails[j]
            .AvailableQuantity[0].QuantityValue[0],
      });
    }
  }
  returnData = {
    availability: availables,
    delivery_dates: deliveryDates,
  };
  return returnData;
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

exports.order = async (req, res, next) => {
  const products = req.body.products;
  const trdr = req.body.trdr;
  if (!products || !trdr)
    res.status(402).json({ message: "fill the required fields" });
  else {
    console.log(req.body.products[0]);
    xml.parseString(
      await this.michelinConnection(this.getOrderBody(products), "order"),
      async (err, results) => {
        if (err) {
          throw err;
        }
        const json = JSON.parse(JSON.stringify(results, null, 4));
        const softoneResponse = await this.softOneConnection(products, trdr);
        res.status(200).json({
          message: "Order Completed",
          response: {
            DocumentID:
              json.order_response.OrderLine[0].OrderedArticle[0]
                .OrderReference[0].DocumentID[0],
            ID: softoneResponse,
          },
        });
      }
    );
  }
};

exports.getOrderBody = (products) => {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>
<order>
    <DocumentID>C1</DocumentID>
    <Variant>0</Variant>
    <TransportPriority>REPL</TransportPriority>
    <CustomerReference>
        <DocumentID>APIOrder001</DocumentID>
    </CustomerReference>
     <BuyerParty>
        <PartyID>Q0040950</PartyID>
        <AgencyCode>91</AgencyCode>
    </BuyerParty>
    <Consignee>
        <PartyID>Q0003027</PartyID>
        <AgencyCode>91</AgencyCode>
    </Consignee>
    ` +
    this.getOrderLineData(products) +
    `
    </order>
    `
  );
};
exports.test = async (req, res, next) => {
  let mtrl = "2335";
  let trdr = "5785";
  let qty = 50;
  let payment = 2;
  let response = await this.softOneConnection(mtrl, trdr, qty, payment);
  res.status(200).json({ message: "Order Placed", response: response });
};
exports.getOrderLineData = (products) => {
  let orderLine = [];
  let line = 1;
  let index = 0;
  let datesarr = [];
  let qty_on_dates = [];
  for (let j = 0; j < products.length; j++) {
    datesarr = this.fromStringToArray(products[j].date);
    qty_on_dates = this.fromStringToArray(products[j].qty_on_dates);
    for (let i = 0; i < datesarr.length; i++) {
      orderLine[index] =
        `
          <OrderLine>
          <LineID>` +
        line +
        `</LineID>
          <OrderedArticle>
              <ArticleIdentification>
                  <ManufacturersArticleID>` +
        products[j].cai +
        `</ManufacturersArticleID>
                <EANUCCArticleID></EANUCCArticleID>
              </ArticleIdentification>
              <RequestedDeliveryDate>` +
        datesarr[i] +
        `</RequestedDeliveryDate>
              <RequestedQuantity>
                  <QuantityValue>` +
        qty_on_dates[i] +
        `</QuantityValue>
              </RequestedQuantity>
          </OrderedArticle>
      </OrderLine>
          `;
      line++;
      index++;
    }
    index++;
  }

  return orderLine;
};

exports.fromStringToArray = (string) => {
  let arr = string.split(",");
  return arr;
};

exports.softOneConnection = async (products, trdr) => {
  let ITELINES = [];
  for (let i = 0; i < products.length; i++) {
    ITELINES[i] = {
      LINUM: 9000000 + i,
      MTRL: products[i].mtrl,
      QTY1: products[i].qty,
    };
  }
  let clientID = await this.login();
  clientID = await this.authenticate(clientID);
  // object : PURDOC
  /* data : {
  PURDOC : {
    "SERIES" : "2020",
    "TRDR" : "4095"
  }
}
*/
  var data = JSON.stringify({
    service: "setData",
    clientID: clientID,
    appId: "1001",
    object: "PURDOC",
    key: "",
    form: "",
    data: {
      PURDOC: {
        SERIES: "2020",
        TRDR: "4095",
      },
      ITELINES: ITELINES,
    },
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

  let palceOrder = await axios(config);
  const decoder = new TextDecoder("ISO-8859-7");
  let decodedCustomers = decoder.decode(palceOrder.data);
  return JSON.parse(decodedCustomers);
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
      "Content-Type": "application/json;",
    },
    data,
  };
  let login = await axios(config);
  try {
    return login.data.clientID;
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
      "Content-Type": "application/json;",
    },
    data,
  };
  let login = await axios(config);
  try {
    return login.data.clientID;
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    throw err;
  }
};

exports.getOrders = async (req, res, next) => {
  const fromDate = req.body.from;
  const toDate = req.body.to;
  const docID = req.body.docID;
  // if doc id search ordes with this documentID aka Parastatiko
  if (docID) {
    xml.parseString(
      await this.michelinConnection(
        this.getOrderStatusByDocId(docID),
        "order_status"
      ),
      async (err, order) => {
        if (err) {
          if (!err.statusCode) err.statusCode = 500;
          throw err;
        }
        console.log(order.order_status.ReferencedOrder);

        if (!order.order_status.ReferencedOrder) {
          res.status(200).json({ message: "No Order Found" });
        } else {
          let info = this.getImportantInfo(order);
          console.log(info);
          let cai = this.getCai(order);
          let name = this.getName(order);
          res
            .status(200)
            .json({ message: "OK", order_info: info, cai: cai, name: name });
        }
      }
    );
  }
  // else if fromDate and toDate search orders within theese two dates
  else if (fromDate && toDate) {
    xml.parseString(
      await this.michelinConnection(
        this.getOrderStatusByDates(fromDate, toDate),
        "order_status"
      ),
      async (err, order) => {
        if (err) {
          if (!err.statusCode) err.statusCode = 500;
          throw err;
        }
        if (!order.order_status.ReferencedOrder) {
          res.status(200).json({ message: "No Order Found" });
        } else {
          let name = this.getName(order);
          let cai = this.getCai(order);
          let info = this.getImportantInfo(order);
          res.status(200).json({ order, name, cai, info });
        }
      }
    );
  }
  // else throw error for not fill the requried fields
  else {
    res.status(402).json({ message: "fill the required fields" });
  }
};

exports.getCai = (order) => {
  let cai = [];
  for (let i = 0; i < order.order_status.ReferencedOrder.length; i++) {
    cai[i] =
      order.order_status.ReferencedOrder[
        i
      ].OrderLine[0].OrderedArticle[0].ArticleIdentification[0].ManufacturersArticleID[0];
  }
  return cai;
};
exports.getName = (order) => {
  let name = [];
  for (let i = 0; i < order.order_status.ReferencedOrder.length; i++) {
    name[i] =
      order.order_status.ReferencedOrder[
        i
      ].OrderLine[0].OrderedArticle[0].ArticleDescription[0].ArticleDescriptionText[0];
  }
  return name;
};

exports.getOrderStatusByDocId = (docID) => {
  return `
  <?xml version="1.0" encoding="UTF-8"?>
  <order_status_request>
      <DocumentID>C1</DocumentID>
      <Variant>0</Variant>
      <OrderDateFrom></OrderDateFrom>
      <OrderDateTo></OrderDateTo>
      <OrderingMethod></OrderingMethod>
      <OrderStatusIndicator>1</OrderStatusIndicator>
      <BuyerParty>
          <PartyID>Q0040950</PartyID>
          <AgencyCode>91</AgencyCode>
      </BuyerParty>
      <ReferencedOrder>
          <SupplierOrderNumber>
              <DocumentID>${docID}</DocumentID>
          </SupplierOrderNumber>
          <OrderReference>
              <DocumentID></DocumentID>
          </OrderReference>
          <Contract>
              <DocumentID></DocumentID>
          </Contract>
          <OrderedArticle>
              <ArticleIdentification>
                  <BuyersArticleID></BuyersArticleID>
                  <ManufacturersArticleID></ManufacturersArticleID>
                  <EANUCCArticleID></EANUCCArticleID>
              </ArticleIdentification>
          </OrderedArticle>
      </ReferencedOrder>
  </order_status_request>
  `;
};
exports.getOrderStatusByDates = (from, to) => {
  return `
  <?xml version="1.0" encoding="UTF-8"?>
  <order_status_request>
      <DocumentID>C1</DocumentID>
      <Variant>0</Variant>
      <OrderDateFrom>${from}</OrderDateFrom>
      <OrderDateTo>${to}</OrderDateTo>
      <OrderingMethod></OrderingMethod>
      <OrderStatusIndicator>1</OrderStatusIndicator>
      <BuyerParty>
          <PartyID>Q0040950</PartyID>
          <AgencyCode>91</AgencyCode>
      </BuyerParty>
      <ReferencedOrder>
          <SupplierOrderNumber>
              <DocumentID></DocumentID>
          </SupplierOrderNumber>
          <OrderReference>
              <DocumentID></DocumentID>
          </OrderReference>
          <Contract>
              <DocumentID></DocumentID>
          </Contract>
          <OrderedArticle>
              <ArticleIdentification>
                  <BuyersArticleID></BuyersArticleID>
                  <ManufacturersArticleID></ManufacturersArticleID>
                  <EANUCCArticleID></EANUCCArticleID>
              </ArticleIdentification>
          </OrderedArticle>
      </ReferencedOrder>
  </order_status_request>
  `;
};
