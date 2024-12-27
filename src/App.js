import React from "react";
import { Routes, Route } from "react-router-dom";
import Chat from "./Pages/Chat";
import Home from "./Pages/Home";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/chat" element={<Chat />} />
    </Routes>
  );
}

export default App;
