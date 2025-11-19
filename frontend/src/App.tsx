// frontend/src/App.tsx
import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    // This will request data from our backend API
    fetch('/api')
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(() => setMessage('Error: Could not connect to backend.'));
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