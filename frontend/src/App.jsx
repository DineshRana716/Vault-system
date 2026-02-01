import "./App.css";
import axios from "axios";
import { useState } from "react";
import Login from "./Pages/Login";
import SignUp from "./Pages/SignUp";
import Home from "./Pages/Home";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/Home" element={<Home />} />
    </Routes>
  );
}

export default App;
