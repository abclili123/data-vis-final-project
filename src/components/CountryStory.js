import React, { useState, useEffect, useRef } from 'react';

// CountryStory Component
function CountryStory({ country, year, image, anecdote, headlines }) {
  return (
    <div style={{
      borderRadius: '16px',
      padding: '30px',
      marginBottom: '40px',
      background: 'linear-gradient(to right, #e6f2ff, #f9f9ff)',
      maxWidth: '850px',
      margin: '40px auto',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
      transition: 'transform 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
        {image && (
          <img
            src={image}
            alt={`${country} map`}
            style={{
              width: '130px',
              height: 'auto',
              marginRight: '25px',
              borderRadius: '10px',
              border: '2px solid #ccc',
              flexShrink: 0,
            }}
          />
        )}
        <div>
          <h2 style={{
            margin: 0,
            fontSize: '2rem',
            color: '#2c3e50',
            fontWeight: 700
          }}>{country}</h2>
          <p style={{
            margin: '5px 0 0',
            fontSize: '1.1rem',
            color: '#7f8c8d'
          }}>{year}</p>
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h3 style={{
          fontSize: '1.4rem',
          color: '#34495e',
          marginBottom: '10px',
          borderBottom: '2px solid #5dade2',
          paddingBottom: '4px',
          fontWeight: 600
        }}>Context</h3>
        <p style={{
          fontSize: '1.1rem',
          color: '#444',
          lineHeight: '1.7',
          marginTop: 0
        }}>{anecdote}</p>
      </div>

      <div>
        <h3 style={{
          fontSize: '1.4rem',
          color: '#34495e',
          marginBottom: '10px',
          borderBottom: '2px solid #5dade2',
          paddingBottom: '4px',
          fontWeight: 600
        }}>News Headlines</h3>
        <ul style={{
          paddingLeft: '20px',
          fontSize: '1.05rem',
          color: '#555',
          lineHeight: '1.8',
          marginTop: 0
        }}>
          {headlines.map((headline, index) => (
            <li key={index} style={{ marginBottom: '10px' }}>
              <a
                href={headline.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#2980b9',
                  textDecoration: 'none',
                  transition: 'color 0.2s ease',
                }}
                onMouseOver={e => e.target.style.color = '#1a5276'}
                onMouseOut={e => e.target.style.color = '#2980b9'}
              >
                {headline.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// CountryStoryCarousel Component

const CountryStoryCarousel = ({ stories }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef();

  const scroll = (direction) => {
    const scrollAmount = 600;
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const cardWidth = container.offsetWidth; // includes padding
      const index = Math.round(scrollLeft / cardWidth);
      setCurrentIndex(index);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);


  return (
    <div style={{ position: 'relative', padding: '20px 0' }}>
      <div
        style={{
          display: 'flex',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollBehavior: 'smooth',
          paddingBottom: '20px',
        
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        
        ref={scrollRef}
        
      >
        {stories.map((story, index) => (
          <div
            key={index}
            style={{
              flex: '0 0 100%',
              scrollSnapAlign: 'center',
              padding: '0 5vw',
              boxSizing: 'border-box',
            }}
          >
            <CountryStory {...story} />
          </div>
        ))}
      </div>

      {/* Pagination dots */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginTop: '15px',
        gap: '10px'
      }}>
        {stories.map((_, index) => (
          <div
            key={index}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: index === currentIndex ? '#2980b9' : '#ccc',
              transition: 'background-color 0.3s',
            }}
          />
        ))}
      </div>

      {/* Navigation buttons */}
      <button
        onClick={() => scroll('left')}
        style={navButtonStyle('left')}
        aria-label="Scroll left"
      >
        ◀
      </button>
      <button
        onClick={() => scroll('right')}
        style={navButtonStyle('right')}
        aria-label="Scroll right"
      >
        ▶
      </button>
    </div>
  );
};

// Style for nav buttons
const navButtonStyle = (side) => ({
  position: 'absolute',
  top: '40%',
  [side]: '10px',
  transform: 'translateY(-50%)',
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  border: 'none',
  borderRadius: '50%',
  boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
  cursor: 'pointer',
  padding: '8px',
  zIndex: 10,
});

// Export both components
export { CountryStory, CountryStoryCarousel };
