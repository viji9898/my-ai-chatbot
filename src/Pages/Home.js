// src/pages/Home.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Button, Typography } from "antd";

const { Title, Paragraph } = Typography;

function Home() {
  return (
    <div style={{ maxWidth: 600, margin: "50px auto", textAlign: "center" }}>
      <Title level={2}>Welcome to My AI Chatbot MVP</Title>
      <Paragraph>
        This application demonstrates an AI chatbot built with React, Ant
        Design, Pinecone, OpenAI, Fauna DB, and Netlify Functions.
      </Paragraph>
      <Link to="/chat">
        <Button type="primary" size="large">
          Go to Chat
        </Button>
      </Link>
    </div>
  );
}

export default Home;
