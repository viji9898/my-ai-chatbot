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

    // Env vars
    const openaiKey = process.env.OPENAI_API_KEY;
    const pineconeKey = process.env.PINECONE_API_KEY;
    const faunaKey = process.env.FAUNA_KEY;

    // 1) OpenAI client (new style)
    const openai = new OpenAI({ apiKey: openaiKey });

    // 2) Pinecone initialization
    const pc = new Pinecone({ apiKey: pineconeKey });

    // 3) Fauna setup
    const q = faunadb.query;
    const faunaClient = new faunadb.Client({ secret: faunaKey });

    // 4) Embed userMessage (OpenAI embeddings)
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: userMessage,
    });
    const userEmbedding = embeddingResponse.data[0].embedding; // array of floats

    // 5) Query Pinecone "my-chatbot-index"
    //    - Adjust topK if you want more or fewer chunks
    //    - includeMetadata: true -> so we can read "match.metadata"
    const myIndex = pc.Index("my-chatbot-index");
    const queryResponse = await myIndex.query({
      vector: userEmbedding,
      topK: 3,
      includeMetadata: true,
    });

    // 6) Combine the retrieved text chunks into one context
    //    - We assume each match.metadata has a "text" field
    const relevantChunks = queryResponse.matches.map(
      (match) => match.metadata.text
    );
    const context = relevantChunks.join("\n");

    // 7) Construct a final prompt with context
    const prompt = `
      You are an AI assistant. The user question is:
      "${userMessage}"

      Here is some context from our knowledge base:
      ${context}

      Provide a helpful answer using only the context if relevant. If unsure, say "I'm not sure."
    `;

    // 8) Create a chat completion with GPT
    const chatResult = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });
    const botResponse = chatResult.choices[0].message.content;

    // 9) (Optional) Save the conversation to Fauna
    await faunaClient.query(
      q.Create(q.Collection("ChatLogs"), {
        data: {
          userMessage,
          botResponse,
          timestamp: Date.now(),
        },
      })
    );

    // 10) Return the chatbot answer
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
