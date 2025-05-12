import './App.css';

import * as d3 from 'd3';

import React, { useEffect, useState } from 'react';

import Overview from './components/overview';      // your original graphs path
import MapChart from './components/map';            // your original graphs path
import { CountryStoryCarousel } from './components/CountryStory';
import SankeyChart from './components/sankey';  // new SankeyChart from incoming
import RefugeeQueryAdlib from './components/RefugeeQueryAdlib';

import IntroStory from './components/introStory';


function App() {
  const [countryByYearData, setCountryByYearData] = useState([]);
  const [startYear, setStartYear] = useState(null);
  const [endYear, setEndYear] = useState(null);
  const [selectedYears, setSelectedYears] = useState([]);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [countryStories, setCountryStories] = useState([]);

  // Load data once on mount
  useEffect(() => {
    d3.csv('/data/country_by_year.csv').then(setCountryByYearData);
    d3.json('/data/country_stories.json').then((data) => {
      console.log('Loaded country stories:', data); // Debug log
      setCountryStories(data);
    });
  }, []);

  useEffect(() => {
    console.log('Start Year:', startYear);
    console.log('End Year:', endYear);
    console.log('Region:', selectedRegions);
  }, [startYear, endYear, selectedRegions]);

  return (
    <div className="App" style={{ padding: '20px', position: 'relative'}}>
      
      <IntroStory />

      {/* Render CountryStory components dynamically */}
      <div style={{ marginBottom: '40px' }}>
        <CountryStoryCarousel stories={countryStories} />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          textAlign: 'center',
          margin: '40px 0'
        }}
      >
        <h1
        style={{
          width: '40%'
        }}
        >
          Below, you will find an overview of refugees entering into the United States. 
          Keep scrolling to explore the data by region and year.
        </h1>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Overview
          data={countryByYearData}
          selectedYears={selectedYears}
          setSelectedYears={setSelectedYears}
          setSelectedRegions={setSelectedRegions}
        />
      </div>

      {/* Graphs and Map section */}
      <div style={{ display: 'flex', gap: '1rem', height: '500px' }}>
        <div
          style={{
            flex: 1,
            padding: '10px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <RefugeeQueryAdlib
            startYear={startYear}
            endYear={endYear}
            setStartYear={setStartYear}
            setEndYear={setEndYear}
            selectedRegions={selectedRegions}
            setSelectedRegions={setSelectedRegions}
          />
        </div>

        <div
          style={{
            flex: 2,
            padding: '10px',
            height: '100%',
          }}
        >
          <MapChart
            data={countryByYearData}
            startYear={startYear}
            endYear={endYear}
            selectedRegions={selectedRegions}
          />
        </div>
      </div>


      {/* SankeyChart section */}
      <div style={{ flex: 1, marginTop: '2rem', padding: '10px' }}>
        <SankeyChart
          data={countryByYearData}
          startYear={startYear}
          endYear={endYear}
          selectedRegions={selectedRegions}
        />
      </div>

      <div>
        
      </div>

    </div>
  );
}

export default App;
