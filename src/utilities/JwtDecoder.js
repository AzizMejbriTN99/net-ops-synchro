import React, { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

function JWTDecoder() {
  const [token, setToken] = useState('');
  const [decoded, setDecoded] = useState(null);
  const [error, setError] = useState('');

  const handleDecode = () => {
    try {
      setError('');
      const decodedToken = jwtDecode(token);
      setDecoded(decodedToken);
    } catch (err) {
      setError('Invalid JWT token');
      setDecoded(null);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>JWT Decoder</h2>
      <textarea
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="Paste your JWT token here"
        rows={4}
        style={{ width: '100%', marginBottom: '10px' }}
      />
      <button onClick={handleDecode}>Decode Token</button>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {decoded && (
        <div style={{ marginTop: '20px' }}>
          <h3>Decoded Payload:</h3>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '5px',
            overflowX: 'auto'
          }}>
            {JSON.stringify(decoded, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default JWTDecoder;