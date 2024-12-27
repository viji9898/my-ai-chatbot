// netlify/functions/chat.js
const { Configuration, OpenAIApi } = require("openai");
const { PineconeClient } = require("@pinecone-database/pinecone");
const faunadb = require("faunadb"); // Fauna DB client

exports.handler = async function (event) {
  try {
    // 1) Parse user input from HTTP body (JSON)
    const { userMessage } = JSON.parse(event.body || "{}");
    if (!userMessage) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing userMessage" }),
      };
    }

    // 2) Set up environment variables
    // (These will come from Netlify's environment variable settings)
    const openaiKey = process.env.OPENAI_API_KEY;
    const pineconeKey = process.env.PINECONE_API_KEY;
    const pineconeEnv = process.env.PINECONE_ENV; // e.g. 'us-east1-gcp'
    const faunaKey = process.env.FAUNA_KEY;

    // 3) Initialize clients
    // --- OpenAI ---
    const openai = new OpenAIApi(new Configuration({ apiKey: openaiKey }));

    // --- Pinecone ---
    const pinecone = new PineconeClient();
    await pinecone.init({
      apiKey: pineconeKey,
      environment: pineconeEnv,
    });
    const index = pinecone.Index("my-chatbot-index");

    // --- Fauna ---
    const q = faunadb.query;
    const faunaClient = new faunadb.Client({ secret: faunaKey });

    // 4) Create embedding for userMessage
    const embeddingResponse = await openai.createEmbedding({
      model: "text-embedding-3-small",
      input: userMessage,
    });
    const userEmbedding = embeddingResponse.data.data[0].embedding;

    // 5) Pinecone search for relevant context
    const pineconeResponse = await index.query({
      vector: userEmbedding,
      topK: 3,
      includeMetadata: true,
    });
    const context = pineconeResponse.matches
      .map((match) => match.metadata.text)
      .join("\n");

    // 6) Compose final prompt
    const prompt = `
      You are an AI. Here is context:
      ${context}

      The user says: "${userMessage}"
      How do you respond?
    `;

    // 7) Call GPT for final answer
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });
    const botResponse = completion.data.choices[0].message.content;

    // 8) (Optional) Store chat in Fauna DB
    await faunaClient.query(
      q.Create(q.Collection("ChatLogs"), {
        data: {
          userMessage,
          botResponse,
          timestamp: Date.now(),
        },
      })
    );

    // 9) Return the chatbot answer
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
