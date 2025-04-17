import React from 'react';
import * as d3 from 'd3';

const ListCountries = ({ data, selectedYear }) => {
  if (!data || data.length === 0 || !selectedYear) return null;

  // Prepare raw values
  const rawValues = data.map(d => {
    const raw = d[selectedYear];
    const numeric = +raw?.replace(/,/g, "");
    return {
      country: d.Country,
      raw,
      value: isNaN(numeric) ? null : numeric
    };
  });

  const valuesWithNumbers = rawValues.filter(d => d.value !== null && d.value > 0);
  const min = d3.min(valuesWithNumbers, d => d.value);
  const max = d3.max(valuesWithNumbers, d => d.value);

  const opacityScale = d3.scaleLinear().domain([min, max]).range([0.4, 1]);

  // Sort descending by value
  const sorted = rawValues.sort((a, b) => {
    const aVal = a.value ?? -1;
    const bVal = b.value ?? -1;
    return d3.descending(aVal, bVal);
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      fontFamily: 'sans-serif'
    }}>
      {sorted.map((d, i) => {
        const opacity = d.value ? opacityScale(d.value) : opacityScale(min);
        return (
          <div
            key={i}
            style={{
              fontSize: `24px`,
              opacity: opacity
            }}
          >
            {d.country}
          </div>
        );
      })}
    </div>
  );
};

export default ListCountries;
