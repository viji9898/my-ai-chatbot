// netlify/functions/embed.js
const OpenAI = require("openai"); // new style OpenAI import
const { Pinecone } = require("@pinecone-database/pinecone"); // new Pinecone class

exports.handler = async function (event) {
  try {
    // 1) Parse the request body
    const body = JSON.parse(event.body || "{}");
    const { id, text } = body;
    if (!id || !text) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing 'id' or 'text' parameter." }),
      };
    }

    // 2) Environment variables (configured in Netlify)
    const openaiKey = process.env.OPENAI_API_KEY;
    const pineconeKey = process.env.PINECONE_API_KEY;
    const pineconeIndexName = process.env.PINECONE_INDEX || "my-chatbot-index";

    // 3) OpenAI client (new style)
    //    Make sure your `openai` version is 4.x+ so this syntax works.
    const openai = new OpenAI({ apiKey: openaiKey });

    // 4) Generate an embedding with OpenAI
    //    new style: openai.embeddings.create(...)
    //    This returns an object with .data (array of embeddings)
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    const embedding = embeddingResponse.data[0].embedding; // array of floats

    // 5) Initialize Pinecone (new style)
    //    Some versions allow passing apiKey in constructor
    const pc = new Pinecone({ apiKey: pineconeKey });

    // If your version requires calling `.init(...)` or doesn't allow environment,
    // you might do:
    // await pc.init({ apiKey: pineconeKey });
    // or pass environment via separate means.

    // 6) Reference the index (depends on your Pinecone library version)
    const index = pc.Index(pineconeIndexName);

    // 7) Upsert to Pinecone
    //    Each vector has an `id`, numeric `values`, and optional `metadata`.
    await index.upsert([
      {
        id,
        values: embedding,
        metadata: { text, timestamp: Date.now() },
      },
    ]);

    // 8) Return success
    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Successfully embedded doc ID: ${id}` }),
    };
  } catch (error) {
    console.error("Error embedding/upserting text:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
