const express = require('express');
const app = express();
const dialogflow = require('dialogflow');
const uuid = require('uuid');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const functions = require('./config/comman');


app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});


app.get('/',(req,res)=>{
    res.send("working");
})
app.post('/chatbot',jsonParser,(req,res)=>{
    async function runSample(projectId = 'test-lhtake') {
        // A unique identifier for the given session
        const sessionId = uuid.v4();
        const text = req.body.text;
        // Create a new session
        const sessionClient = new dialogflow.SessionsClient({
          keyFilename: "Test-d0a73546118d.json"
        });
        const sessionPath = sessionClient.sessionPath(projectId, sessionId);
       
        // The text query request.
        const request = {
          session: sessionPath,
          queryInput: {
            text: {
              // The query to send to the dialogflow agent
              text: text,
              // The language used by the client (en-US)
              languageCode: 'en-US',
            },
          },
        };
      
        // Send request and log result
        const responses = await sessionClient.detectIntent(request);
        console.log('Detected intent');
        const result = responses[0].queryResult;
        functions.responseHandler(res,200,{response: result.fulfillmentText});
      }
      
      runSample();
      
})

const port = process.env.PORT || 3000;
app.listen(port);