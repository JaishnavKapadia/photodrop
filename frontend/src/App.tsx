// frontend/src/App.tsx
import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('Loading...');

  // If VITE_API_URL is set (like on Netlify), use it.
  // Otherwise, default to '/api' (relative path for AWS/Docker).
  const API_URL = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => setMessage(`Error: ${err.message}`));
  }, []);

  return (
    <div className="App">
      <h1>PhotoDrop</h1>
      <p>
        <em>{message}</em>
      </p>
    </div>
  );
}

export default App;