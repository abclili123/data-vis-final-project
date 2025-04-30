import React from 'react';

function CountryStory({ country, year, image, anecdote, headlines }) {
  return (
    <div style={{
      border: '2px solid #4CAF50',
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '20px',
      backgroundColor: '#f0f8ff',
      maxWidth: '800px',
      margin: 'auto',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        {image && (
          <img
            src={image}
            alt={`${country} map`}
            style={{
              width: '120px',
              height: 'auto',
              marginRight: '20px',
              borderRadius: '8px',
              border: '2px solid #ddd'
            }}
          />
        )}
        <div>
          <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#333' }}>{country}</h2>
          <p style={{ margin: 0, fontSize: '1.2rem', color: '#666' }}>{year}</p>
        </div>
      </div>

      <h3 style={{ fontSize: '1.5rem', color: '#444', marginBottom: '10px', borderBottom: '2px solid #4CAF50', paddingBottom: '5px' }}>Context</h3>
      <p style={{ fontSize: '1.1rem', color: '#555', lineHeight: '1.8' }}>{anecdote}</p>

      <h3 style={{ fontSize: '1.5rem', color: '#444', marginBottom: '10px', borderBottom: '2px solid #4CAF50', paddingBottom: '5px' }}>News Headlines</h3>
      <ul style={{ paddingLeft: '20px', fontSize: '1.1rem', color: '#555', lineHeight: '1.8' }}>
        {headlines.map((headline, index) => (
          <li key={index}>
            <a
              href={headline.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#007BFF', textDecoration: 'none' }}
            >
              {headline.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CountryStory;