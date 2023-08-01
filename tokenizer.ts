const GPT3TokenizerImport = require("gpt3-tokenizer");

const GPT3Tokenizer: typeof GPT3TokenizerImport =
  typeof GPT3TokenizerImport === "function"
    ? GPT3TokenizerImport
    : (GPT3TokenizerImport as any).default;

const tokenizer = new GPT3Tokenizer({ type: "gpt3" });

module.exports = {
  getTokens: (input: string) => {
    return tokenizer.encode(input).length;
  },
};
