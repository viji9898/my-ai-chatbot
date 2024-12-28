const { Pinecone } = require("@pinecone-database/pinecone");
const OpenAI = require("openai");
const faunadb = require("faunadb");

exports.handler = async function (event) {
  try {
    const { userMessage } = JSON.parse(event.body || "{}");
    if (!userMessage) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing userMessage" }),
      };
    }

    // Environment variables
    const openaiKey = process.env.OPENAI_API_KEY;
    const pineconeKey = process.env.PINECONE_API_KEY;
    const faunaKey = process.env.FAUNA_KEY;

    if (!openaiKey || !pineconeKey || !faunaKey) {
      throw new Error("Missing required API keys");
    }

    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey: openaiKey });

    // Initialize Pinecone
    const pinecone = new Pinecone({ apiKey: pineconeKey });
    const myIndex = pinecone.Index("my-chatbot-index");

    // Initialize FaunaDB client
    const q = faunadb.query;
    const faunaClient = new faunadb.Client({ secret: faunaKey });

    // Generate embedding using OpenAI
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: userMessage,
    });

    const userEmbedding = embeddingResponse.data[0]?.embedding;
    if (!userEmbedding) {
      throw new Error("Failed to generate embedding");
    }

    // Query Pinecone index
    const queryResponse = await myIndex.query({
      vector: userEmbedding,
      topK: 3,
      includeMetadata: true,
    });

    const relevantChunks = queryResponse.matches?.map(
      (match) => match.metadata?.text
    );

    if (!relevantChunks || relevantChunks.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({ botResponse: "I'm not sure." }),
      };
    }

    const context = relevantChunks.join("\n");

    // Construct the prompt
    const prompt = `
      You are an AI assistant. The user question is:
      "${userMessage}"

      Here is some context from our knowledge base:
      ${context}

      Provide a helpful answer using only the context if relevant. If unsure, say "I'm not sure."
    `;

    // Generate chat completion using GPT
    const chatResult = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const botResponse =
      chatResult.choices[0]?.message?.content || "I'm not sure.";

    // Save conversation to FaunaDB
    await faunaClient.query(
      q.Create(q.Collection("ChatLogs"), {
        data: {
          userMessage,
          botResponse,
          timestamp: Date.now(),
        },
      })
    );

    // Return response
    return {
      statusCode: 200,
      body: JSON.stringify({ botResponse }),
    };
  } catch (error) {
    console.error("Error in chat function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
