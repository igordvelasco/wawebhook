require('dotenv').config()

const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const xhub = require('express-x-hub');
const fetch = require('node-fetch')

const jwt = process.env.JWT

app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'));

app.use(xhub({ algorithm: 'sha1', secret: process.env.APP_SECRET }));
app.use(bodyParser.json());

const token = process.env.TOKEN || 'token';
const received_updates = [];



app.get('/', function (req, res) {
  console.log(req);
  res.send('<pre>' + JSON.stringify(received_updates, null, 2) + '</pre>');
});

app.get(['/whatsapp'], function (req, res) {
  if (
    req.query['hub.mode'] == 'subscribe' &&
    req.query['hub.verify_token'] == token
  ) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(400);
  }
});

app.post('/whatsapp', async function (req, res) {
    // if (!req.isXHubValid()) {
    //   console.log('Warning - request header X-Hub-Signature not present or invalid');
    //   res.sendStatus(401);
    //   return;
    // console.log('request header X-Hub-Signature validated');
    // }

  const messagePayload = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]

  if(!messagePayload)
    return res.send("Vai mto a merda!")

  const message = messagePayload.text?.body || messagePayload.button?.text;
  const phone = messagePayload.from;

  if(!message || !phone)
    return res.send("Vai a merda!")

  let template;

  switch (message) {
    case 'Conhecer os projetos':
      template = 'projetos'
      break
    case 'Problemas com plataforma':
      template = 'plataforma'
      break
    case 'Formação de professores':
      template = 'professores'
      break
    default:
      template = 'boas_vindas'
  }

  try {
 
  await fetch('https://graph.facebook.com/v13.0/100679882671832/messages', {
    method: 'post',
    body: "{ \"messaging_product\": \"whatsapp\", \"to\": \""+phone+"\", \"type\": \"template\", \"template\": { \"name\": \""+template+"\", \"language\": { \"code\": \"pt_BR\" } } }",
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`
    }
  });

  received_updates.unshift(req.body);
  res.sendStatus(200);
  }

  catch(err){return res.send(err)}
});

app.listen();
