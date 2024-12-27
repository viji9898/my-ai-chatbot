// src/pages/Chat.jsx
import React, { useState } from "react";
import { Button, Input, Typography } from "antd";
import axios from "axios";

const { Title } = Typography;
const { TextArea } = Input;

function Chat() {
  const [userMessage, setUserMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false); // New state to control button loading

  const handleSend = async () => {
    if (!userMessage.trim()) return; // Prevent empty messages
    setLoading(true); // Set loading to true while waiting for response
    setResponse(""); // Clear previous response

    try {
      // Make API call to Netlify function
      const res = await axios.post("/.netlify/functions/chat", {
        userMessage,
      });

      setResponse(res.data.botResponse);
    } catch (err) {
      console.error("Error:", err);
      setResponse("Sorry, something went wrong. Please try again.");
    } finally {
      setLoading(false); // Stop loading spinner after response or error
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
        style={{ marginBottom: 16 }}
      />
      <Button
        type="primary"
        onClick={handleSend}
        loading={loading} // Ant Design Button's loading state
      >
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
