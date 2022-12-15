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
      await this.michelinConnection(this.getBody(cai, qty),2),
      async (err, results) => {
        if (err) {
          throw err;
        }
        const json = JSON.parse(JSON.stringify(results, null, 4));
        // console.log(json)
        //  res.status(200).json({json})
        const response = await this.buetifyResponse(json);
        console.log(response);
        console.log(
          json.quote.OrderLine[0].OrderedArticle[0].ArticleDescription[0]
            .ArticleDescriptionText[0]
        );
        res.status(200).json({
          message: "Response",
          product_name:
            json.quote.OrderLine[0].OrderedArticle[0].ArticleDescription[0]
              .ArticleDescriptionText[0],
          response: response,
          product: await this.findProduct(cai, next),
        });
      }
    );
  } else {
    res.status(402).json({ message: "fill the required fields" });
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
        upddate: products[0][0].upddate,
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
        upddate: "",
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

exports.michelinConnection = async (body,id) => {
  let message_type = (id==1 ? 'order' : 'inquiry' );
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
      avaliable: response.quote.OrderLine[i].OrderedArticle[0].Availability[0],
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
        quantity_valiue:
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
  const cai = req.body.cai;
  const dates = req.body.dates;
  const qtys = req.body.qtys;

  if (!cai || !dates || !qtys) {
    res.status(402).json({ message: "fill the required fields" });
  } else {
    xml.parseString(
      await this.michelinConnection(this.getOrderBody(cai, dates, qtys),1),
      async (err, results) => {
        if (err) {
            throw err;
        }
        const json = JSON.parse(JSON.stringify(results,null,4));
        // console.log(json.order_response.OrderLine[0].OrderedArticle[0].OrderReference[0].DocumentID[0]);
        res.status(200).json({
            message:"Order Completed",
            response:{
              DocumentID : json.order_response.OrderLine[0].OrderedArticle[0].OrderReference[0].DocumentID[0]
            }
        })
      }
    );
  }
};

exports.getOrderBody = (cai, dates, qty) => {
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
    this.getOrderLineData(cai, dates, qty) +
    `
    </order>
    `
  );
};

exports.getOrderLineData = (cai, dates, qty) => {
  let datesArray = this.fromStringToArray(dates);
  let qtyArray = this.fromStringToArray(qty);
  let orderLine = [];
  for (let i = 0; i < qtyArray.length; i++) {
    let line = i + 1;
    orderLine[i] =
      `
        <OrderLine>
        <LineID>` +
      line +
      `</LineID>
        <OrderedArticle>
            <ArticleIdentification>
                <ManufacturersArticleID>` +
      cai +
      `</ManufacturersArticleID>
               <EANUCCArticleID></EANUCCArticleID>
            </ArticleIdentification>
            <RequestedDeliveryDate>` +
      datesArray[i] +
      `</RequestedDeliveryDate>
            <RequestedQuantity>
                <QuantityValue>` +
      qtyArray[i] +
      `</QuantityValue>
            </RequestedQuantity>
        </OrderedArticle>
    </OrderLine>
        `;
  }

  return orderLine;
};

exports.fromStringToArray = (string) => {
  let arr = string.split(",");
  return arr;
};
