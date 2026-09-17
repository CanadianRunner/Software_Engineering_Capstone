import React, { useState } from "react";
import "../scss/loginModal.scss";
import { login } from "../services/api";

function LoginModal({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = () => {
    login({ username, password })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        onLoginSuccess();
      } else {
        setErrorMessage("Invalid username or password");
      }
    })
    .catch((error) => {
      setErrorMessage("An error occurred. Please try again.");
    });
  };
  

  return (
    <div className="login-modal">
      <div className="login-modal__content">
        <h2>Login</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button onClick={handleLogin}>Login</button>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </div>
    </div>
  );
}

export default LoginModal;
