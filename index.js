const express = require("express");
const GPT3Tokenizer = require("gpt3-tokenizer");
require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");

const getTokens = (input) => {
  const tokenizer = new GPT3Tokenizer.default({ type: "gpt3" });
  const encoded = tokenizer.encode(input);
  return encoded.text.length;
};

const getTokenCount = (messages, systemPrompt) => {
  let tokenCount = 0;
  messages.forEach((msg) => {
    const tokens = getTokens(msg.content);
    tokenCount += tokens;
  });
  tokenCount += getTokens(systemPrompt);

  return tokenCount;
};

const adjustTokenLength = (messages, systemPrompt) => {
  let tokenCount = 0;
  messages.forEach((msg) => {
    const tokens = getTokens(msg.content);
    tokenCount += tokens;
  });
  tokenCount += getTokens(systemPrompt);

  if (tokenCount >= 3000) {
    messages.shift();
    adjustTokenLength(messages, systemPrompt);
  }

  return tokenCount;
};

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const config = new Configuration({
  apiKey: "",
});

const openai = new OpenAIApi(config);

app.post("/chat-bot", async (req, res) => {
  try {
    const { messages, personalData } = req.body;
    const { gender, goal, height, weight, level } = personalData;

    if (messages?.length === 0) {
      throw new Error("No messages was sent");
    }

    const moderationResponse = await openai.createModeration({
      model: "text-moderation-stable",
      input: messages[messages.length - 1].content,
    });

    const results = moderationResponse.data.results;

    if (results.flagged) {
      throw new Error("Query flagged by openai");
    }

    const systemPrompt = `You are an personal gym training assistant and motivator.
     You are helping a person who is a ${gender} with a height ${height} and weight ${weight}.
     That person is a ${level} at gym training and his/her goal is ${goal}. If asked, say that those information are saved in app.`;

    const tokenCount = getTokenCount(messages, systemPrompt);

    if (tokenCount >= 3000) {
      throw new Error("You exceeded the 3000 token limit");
    }

    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...messages,
      ],

      max_tokens: 1000,
      temperature: 0.9,
    });

    return res.status(200).json({
      data: response.data.choices[0].message,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.response
        ? error.response.data
        : "There was an issue on the server",
    });
  }
});

const port = 5000;

app.listen(port, () => console.log(`Server listening on port ${port}`));
