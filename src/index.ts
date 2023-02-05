import express from 'express';
require('dotenv').config({path: __dirname + '/../.env'});
const bodyParser = require('body-parser')

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    organization: process.env.ORG,
    apiKey: process.env.APIKEY,
});
const openai = new OpenAIApi(configuration);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
const cors = require('cors');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cors())

const port = 3000;

const promptBaselines = {
  "baseline": "##you are a customer talking to a chat agent trying to ",
  "action": ". Respond as a casual but kind customer.",
  "convertIntentionToNL": "##convert this message to a kind request for help: "
}

  function createCompletion(baseline: string, prompt: string, action: string): Promise<{ message: string }> {
    return new Promise(async (resolve, reject) => {
      try {
        var concatedPrompt: string = baseline + prompt + "\n\n" + (action ? action : '') + "\n\n" + JSON.stringify(transcript.data) + "\n\n";
        console.log('------concated prompt------')
        console.log(concatedPrompt)
        const response = await openai.createCompletion({
          model: "text-davinci-003",
          prompt: concatedPrompt,
          max_tokens: 100,
          temperature: 0.5,
        });
        console.log('------response from openai:------')
        console.log(response.data.choices[0].text)
        if (response.data.choices[0].text) {
          resolve({message: response.data.choices[0].text.replace(/(\r\n|\n|\r)/gm, "")});
        } else {
          resolve({message: "No response"});
        }
      } catch (error) {
        reject(error);
      }
    });
}

function getHighestId(transcript: any) {
  let highestId = 0;
  for (let i = 0; i < transcript.data.length; i++) {
    if (transcript.data[i].id > highestId) {
      highestId = transcript.data[i].id;
    }
  }
  return highestId;
}

function addLineToTranscript(line: string, sender: string) {
    //add line to transcript
    if (transcript.data.length > 0) {
      var highestId = getHighestId(transcript)
      transcript.data[highestId + 1] = {"id": highestId + 1, "sender": sender, "message": line};
      console.log(transcript)
    } else {
      return {
        error: "Something went wrong. Transcript has no length."
      }
    }
}

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

interface Line {
  id: number;
  sender: string;
  message: string;
}

interface Transcript {
  data: Line[];
}

var transcript: Transcript = {
  "data": []
};
/*
{
  "data": [
    {"id": "1", "sender": "customer", "message": "I want to cancel my subscription"},
    {"id": "2", "sender": "agent", "message": "I'm sorry to hear that. What is the reason for cancelling?"}
  ]
}


*/

app.post('/getInitialMessage', async (req, res) => {
  console.log('startEngagement')
  console.log(req.body.intention)
  const response: any = await createCompletion(promptBaselines.convertIntentionToNL, req.body.intention, "")

  //add line to transcript
  if ((response as any)) {
    transcript.data[0] = {"id": 0, "sender": "customer", "message": (response as any).message};
    console.log('------transcript:------')
    console.log(transcript)
    res.json({
      message: (response as any).message
    })
  } else {
    res.json({
      error: "Something went wrong."
    })
  }
});

app.post('/generateNewMessage', async (req, res) => {
  console.log('generateNewMessage')
  console.log(req.body.prompt)

  addLineToTranscript(req.body.prompt, "agent");

  const response = await createCompletion(promptBaselines.baseline, req.body.prompt, promptBaselines.action)
  if ((response as any)) {
    addLineToTranscript((response as any).message, "customer");
    res.json({
      message: (response as any).message
    })
  } else {
    res.json({
      error: "Something went wrong."
    })
  }
});