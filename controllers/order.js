const database = require('../database');
const axios = require('axios');
const xml = require('xml2js');

exports.xmlReq = async (req,res,next) => {
    const cai = req.body.cai;
    const qty = req.body.qty;
    const name ='%'+ req.body.name+'%';
    console.log(name);
    if(name != "%undefined%"){

        let names = await database.execute('select * from products where name LIKE ?',[name])
        try{
            let return_prods =[];
            for(let i = 0; i < names[0].length; i++){
                return_prods.push(await this.findProduct(names[0][i].cai,next));
            }
            res.status(200).json({message:"products",product:return_prods});
        }catch (error) {
            throw error;
        }
    }
     else if(cai && qty) {

        xml.parseString(await this.michelinConnection(this.getBody(cai,qty)),async(err,results)=>{
            if(err){
                throw err;
            }
            const json =JSON.parse( JSON.stringify(results,null,4));
           // console.log(json)
          //  res.status(200).json({json})
            const response = await this.buetifyResponse(json);
            console.log(response)
            console.log(json.quote.OrderLine[0].OrderedArticle[0].ArticleDescription[0].ArticleDescriptionText[0])
            res.status(200).json(
                {
                    message:"Response",
                    product_name : json.quote.OrderLine[0].OrderedArticle[0].ArticleDescription[0].ArticleDescriptionText[0],
                    response : response,
                    product : await this.findProduct(cai,next)
                }
                )
        })


    }else{
         res.status(402).json({message:"fill the required fields"})
    }
}

exports.findProduct = async (cai,next) =>{

      let products=await database.execute('select * from products where cai = ?',[cai])
         try {
             return {
                 mtrl: products[0][0].mtrl,
                 code: products[0][0].code,
                 name: products[0][0].name,
                 cai: products[0][0].cai,
                 tipos_elastikou: products[0][0].tupos_elastikou,
                 omada: products[0][0].omada,
                 marka: products[0][0].marka,
                 zanta: products[0][0].zanta,
                 epoxi: products[0][0].epoxi,
                 upddate: products[0][0].upddate,
                 apothema_thess: products[0][0].apothema_thess,
                 apothema_athens: products[0][0].apothema_athens,
                 price: products[0][0].price,
                 offer: products[0][0].offer,
                 discount: products[0][0].discount,
                 image: products[0][0].image
             }
         }catch(err){
          next(err);
         }
}
exports.getOrderLine = (cai,qty) =>{

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
        `

}
exports.getBody =(cai,qty) =>{

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
                </BuyerParty>${this.getOrderLine(cai,qty)}
            </inquiry>
        `

}

exports.michelinConnection =async (body)=>{
        var config = {
          headers: {
              'Content-Type': 'text/xml;charset=utf-8',
              'Accept':'text/xml',
              'Authorization':'Basic TVdHMjExMzpBRCs5NWZlUg==',
              'Message-Type' : 'inquiry'

          }
        };
     let req =await axios.post('https://bibserve.com/eb3/C1/AdhocServlet',body,config)


                return req.data;

}
exports.buetifyResponse = (response )=>{
        let deliveryDates = [];

        let availables = [];
        let returnData =[];
        for(let i = 0; i < response.quote.OrderLine.length; i++){
            availables.push({
                'avaliable' : response.quote.OrderLine[i].OrderedArticle[0].Availability[0]
            });
            console.log(response.quote.OrderLine[0].OrderedArticle[0].ScheduleDetails)
                for(let j = 0; j < response.quote.OrderLine[0].OrderedArticle[0].ScheduleDetails.length ; j++ ) {
                    deliveryDates.push({
                        delivery_dates: response.quote.OrderLine[i].OrderedArticle[i].ScheduleDetails[j].DeliveryDate[0],
                        quantity_valiue: response.quote.OrderLine[i].OrderedArticle[i].ScheduleDetails[j].AvailableQuantity[0].QuantityValue[0]
                    })
                }
        }
    returnData = {
        availability : availables,
        delivery_dates : deliveryDates
    }
    return returnData;

}

