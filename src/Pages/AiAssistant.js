// Frontend: AiAssistant.js
import React, { useState, useRef, useEffect } from "react";
import { Layout, Input, Button, List } from "antd";

const { Content } = Layout;

const AiAssistant = () => {
  const [prompt, setPrompt] = useState("");
  const [conversation, setConversation] = useState([]);
  const messageEndRef = useRef(null);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleSend = async () => {
    if (!prompt.trim()) return;

    const newMessage = { role: "user", content: prompt };
    setConversation([...conversation, newMessage]);

    try {
      const response = await fetch("/.netlify/functions/openAiAssistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (response.ok) {
        // Ensure the content is safely rendered
        const aiReply = {
          role: "assistant",
          content: data.reply.value || data.reply,
        }; // Adjusted for object handling
        setConversation([...conversation, newMessage, aiReply]);
      } else {
        console.error("API Error:", data.error);
      }
    } catch (error) {
      console.error("Error:", error.message);
    } finally {
      setPrompt("");
    }
  };

  return (
    <Layout style={{ height: "100vh" }}>
      <Content style={{ padding: "20px" }}>
        <h1>AI Assistant</h1>
        <List
          bordered
          dataSource={conversation}
          renderItem={(item) => (
            <List.Item>
              <strong>{item.role === "user" ? "You" : "AI"}:</strong>{" "}
              {typeof item.content === "string"
                ? item.content
                : JSON.stringify(item.content)}
            </List.Item>
          )}
          style={{ marginBottom: "20px", height: "60vh", overflowY: "auto" }}
        />
        <div ref={messageEndRef}></div>
        <Input.TextArea
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type your message here..."
          style={{ marginBottom: "10px" }}
        />
        <Button type="primary" onClick={handleSend}>
          Send
        </Button>
      </Content>
    </Layout>
  );
};

export default AiAssistant;
