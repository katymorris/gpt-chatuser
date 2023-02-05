"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
require('dotenv').config({ path: __dirname + '/../.env' });
const bodyParser = require('body-parser');
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
    organization: process.env.ORG,
    apiKey: process.env.APIKEY,
});
const openai = new OpenAIApi(configuration);
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
const cors = require('cors');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
const port = 3000;
const promptBaselines = {
    "baseline": "##you are a customer talking to a chat agent trying to ",
    "action": ". Respond as a casual but kind customer.",
    "convertIntentionToNL": "##convert this message to a kind request for help: "
};
function createCompletion(baseline, prompt, action) {
    return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        try {
            var concatedPrompt = baseline + prompt + "\n\n" + (action ? action : '') + "\n\n" + JSON.stringify(transcript.data) + "\n\n";
            console.log('------concated prompt------');
            console.log(concatedPrompt);
            const response = yield openai.createCompletion({
                model: "text-davinci-003",
                prompt: concatedPrompt,
                max_tokens: 100,
                temperature: 0.5,
            });
            console.log('------response from openai:------');
            console.log(response.data.choices[0].text);
            if (response.data.choices[0].text) {
                resolve({ message: response.data.choices[0].text.replace(/(\r\n|\n|\r)/gm, "") });
            }
            else {
                resolve({ message: "No response" });
            }
        }
        catch (error) {
            reject(error);
        }
    }));
}
function getHighestId(transcript) {
    let highestId = 0;
    for (let i = 0; i < transcript.data.length; i++) {
        if (transcript.data[i].id > highestId) {
            highestId = transcript.data[i].id;
        }
    }
    return highestId;
}
function addLineToTranscript(line, sender) {
    //add line to transcript
    if (transcript.data.length > 0) {
        var highestId = getHighestId(transcript);
        transcript.data[highestId + 1] = { "id": highestId + 1, "sender": sender, "message": line };
        console.log(transcript);
    }
    else {
        return {
            error: "Something went wrong. Transcript has no length."
        };
    }
}
app.get('/', (req, res) => {
    res.send('Hello, World!');
});
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
var transcript = {
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
app.post('/getInitialMessage', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('startEngagement');
    console.log(req.body.intention);
    const response = yield createCompletion(promptBaselines.convertIntentionToNL, req.body.intention, "");
    //add line to transcript
    if (response) {
        transcript.data[0] = { "id": 0, "sender": "customer", "message": response.message };
        console.log('------transcript:------');
        console.log(transcript);
        res.json({
            message: response.message
        });
    }
    else {
        res.json({
            error: "Something went wrong."
        });
    }
}));
app.post('/generateNewMessage', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('generateNewMessage');
    console.log(req.body.prompt);
    addLineToTranscript(req.body.prompt, "agent");
    const response = yield createCompletion(promptBaselines.baseline, req.body.prompt, promptBaselines.action);
    if (response) {
        addLineToTranscript(response.message, "customer");
        res.json({
            message: response.message
        });
    }
    else {
        res.json({
            error: "Something went wrong."
        });
    }
}));
