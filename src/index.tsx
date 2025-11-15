import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import AuthGate from "./components/AuthGate";

ReactDOM.render(
    <AuthGate>
      <App />
    </AuthGate>,
  document.getElementById("root")
);