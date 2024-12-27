// netlify/functions/chat.js
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

    const openaiKey = process.env.OPENAI_API_KEY;
    const pineconeKey = process.env.PINECONE_API_KEY;
    const faunaKey = process.env.FAUNA_KEY;

    // OpenAI client (new style)
    const openai = new OpenAI({ apiKey: openaiKey });

    // Pinecone initialization
    const pc = new Pinecone({
      apiKey: pineconeKey,
    });

    // Fauna
    const q = faunadb.query;
    const faunaClient = new faunadb.Client({ secret: faunaKey });

    // Example: embed userMessage
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: userMessage,
    });
    const userEmbedding = embeddingResponse.data[0].embedding;

    // ... Pinecone logic (e.g. query an index) ...
    // const queryResponse = await pc.indexes.query('my-chatbot-index', { ... });

    // Chat completion
    const prompt = `User says: "${userMessage}"`;
    const chatResult = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });
    const botResponse = chatResult.choices[0].message.content;

    // Save to Fauna (optional)
    await faunaClient.query(
      q.Create(q.Collection("ChatLogs"), {
        data: {
          userMessage,
          botResponse,
          timestamp: Date.now(),
        },
      })
    );

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
