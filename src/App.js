import './App.css';

import * as d3 from 'd3';

import React, { useEffect, useState } from 'react';

import Overview from './components/overview';      // your original graphs path
import MapChart from './components/map';            // your original graphs path
import CountryStory from './components/CountryStory'; // your CountryStory
import SankeyChart from './components/sankey';  // new SankeyChart from incoming

function App() {
  const [countryByYearData, setCountryByYearData] = useState([]);
  const [sexByYearData, setSexByYearData] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [countryStories, setCountryStories] = useState([]);

  // Load data once on mount
  useEffect(() => {
    d3.csv('/data/country_by_year.csv').then(setCountryByYearData);
    d3.csv('/data/sex_by_year.csv').then(setSexByYearData);
    d3.json('/data/country_stories.json').then((data) => {
      console.log('Loaded country stories:', data); // Debug log
      setCountryStories(data);
    });
  }, []);

  return (
    <div className="App" style={{ padding: '20px', position: 'relative' }}>
      
      {/* Render CountryStory components dynamically */}
      {countryStories.map((story, index) => (
        <CountryStory
          key={index}
          country={story.country}
          anecdote={story.anecdote}
          headlines={story.headlines}
        />
      ))}

      {/* Graphs and Map section */}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
        <div style={{ flex: 1, border: 'solid 1px red', padding: '10px' }}>
          <Overview
            data={countryByYearData}
            selectedYears={selectedYears}
            setSelectedYears={setSelectedYears}
            setSelectedRegions={setSelectedRegions}
          />
        </div>

        <div style={{ flex: 2, border: 'solid 1px blue', padding: '10px' }}>
          <MapChart
            data={countryByYearData}
            selectedYears={selectedYears}
            selectedRegions={selectedRegions}
          />
        </div>
      </div>

      {/* SankeyChart section */}
      <div style={{ flex: 1, border: 'solid 1px purple', marginTop: '2rem', padding: '10px' }}>
        <SankeyChart
          data={countryByYearData}
          selectedYears={selectedYears}
          selectedRegions={selectedRegions}
        />
      </div>

    </div>
  );
}

export default App;
