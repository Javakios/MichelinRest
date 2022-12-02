//3rd party imports
const express = require("express");
const bodyParser = require('body-parser');


//initialize server
const app = express();
//initialize server's port
const port = 3000;
//headers
app.use(bodyParser.json());
app.use((req,res,next)=>{

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Methods',
        'OPTIONS, GET, POST, PUT, PATCH, DELETE'
    );
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();

})



//app listener
app.listen(port,(req,res,next)=>{
    console.log("App Is Listening To http://localhost:"+port)
})

