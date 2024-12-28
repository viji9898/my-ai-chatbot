const fetch = require("node-fetch");

exports.handler = async function (event) {
  try {
    const { prompt } = JSON.parse(event.body);

    // Create Thread
    const threadResponse = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!threadResponse.ok) {
      throw new Error(`Thread creation failed: ${await threadResponse.text()}`);
    }

    const thread = await threadResponse.json();

    // Run Assistant
    const runResponse = await fetch(
      `https://api.openai.com/v1/threads/${thread.id}/runs`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
        body: JSON.stringify({ assistant_id: "asst_QvyqvzY9fwonKmEaWWMNeWdv" }),
      }
    );

    if (!runResponse.ok) {
      throw new Error(`Run initiation failed: ${await runResponse.text()}`);
    }

    const run = await runResponse.json();

    // Poll for Completion
    let runStatus = run.status;
    while (runStatus !== "completed") {
      const statusResponse = await fetch(
        `https://api.openai.com/v1/threads/${thread.id}/runs/${run.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "OpenAI-Beta": "assistants=v2",
          },
        }
      );

      const updatedRun = await statusResponse.json();
      runStatus = updatedRun.status;
      if (runStatus !== "completed") {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Fetch Messages
    const messagesResponse = await fetch(
      `https://api.openai.com/v1/threads/${thread.id}/messages`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "OpenAI-Beta": "assistants=v2",
        },
      }
    );

    if (!messagesResponse.ok) {
      throw new Error(
        `Message retrieval failed: ${await messagesResponse.text()}`
      );
    }

    const messages = await messagesResponse.json();
    const assistantMessage = messages.data.find(
      (msg) => msg.role === "assistant"
    );

    if (
      !assistantMessage ||
      !assistantMessage.content ||
      !Array.isArray(assistantMessage.content)
    ) {
      throw new Error("Assistant message format invalid");
    }

    // Extract the text content from the assistant message
    const textContent = assistantMessage.content.find(
      (item) => item.type === "text"
    );
    if (!textContent || !textContent.text) {
      throw new Error("Assistant text content missing or invalid");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ reply: textContent.text }),
    };
  } catch (error) {
    console.error("Function error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
