import React from "react";
import { Routes, Route } from "react-router-dom";
import Chat from "./Pages/Chat";
import Home from "./Pages/Home";
import EmbeddingForm from "./Pages/EmbeddingForm";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/embedding-form" element={<EmbeddingForm />} />
    </Routes>
  );
}

export default App;
