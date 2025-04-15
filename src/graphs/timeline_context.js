import React, { useEffect, useState } from 'react';
import './timeline_context.css';

const TimelineContext = ({ selectedTimelineText }) => {
  const [displayedText, setDisplayedText] = useState(selectedTimelineText);
  const [fadeState, setFadeState] = useState('fade-in');

  useEffect(() => {
    if (selectedTimelineText === displayedText) return;

    setFadeState('fade-out');

    const timeout = setTimeout(() => {
      setDisplayedText(selectedTimelineText);
      setFadeState('fade-in');
    }, 300); // match the fade-out duration

    return () => clearTimeout(timeout);
  }, [selectedTimelineText, displayedText]);

  return (
    <div className={`timeline-context ${fadeState}`}>
      {displayedText}
    </div>
  );
};

export default TimelineContext;
