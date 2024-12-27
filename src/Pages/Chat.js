// src/pages/Chat.jsx
import React, { useState } from "react";
import { Button, Input, Typography } from "antd";
import axios from "axios";

const { Title } = Typography;
const { TextArea } = Input;

function Chat() {
  const [userMessage, setUserMessage] = useState("");
  const [response, setResponse] = useState("");

  const handleSend = async () => {
    try {
      // Netlify functions are typically available at /.netlify/functions/<functionName>
      const res = await axios.post("/.netlify/functions/chat", {
        userMessage,
      });
      setResponse(res.data.botResponse);
    } catch (err) {
      console.error("Error:", err);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "50px auto" }}>
      <Title level={2}>AI Chat</Title>
      <TextArea
        rows={4}
        placeholder="Ask me anything..."
        value={userMessage}
        onChange={(e) => setUserMessage(e.target.value)}
      />
      <Button type="primary" onClick={handleSend} style={{ marginTop: 16 }}>
        Send
      </Button>

      {response && (
        <div style={{ marginTop: 24 }}>
          <Title level={4}>Bot Response:</Title>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
}

export default Chat;
