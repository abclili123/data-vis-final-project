import './App.css';

import * as d3 from 'd3';

import React, { useEffect, useState } from 'react';

import Overview from './components/overview';      // your original graphs path
import MapChart from './components/map';            // your original graphs path
import { CountryStoryCarousel } from './components/CountryStory';
import SankeyChart from './components/sankey';  // new SankeyChart from incoming
import RefugeeQueryAdlib from './components/RefugeeQueryAdlib';
import CountryLineChart from './components/CountryLineChart';


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
    d3.csv(process.env.PUBLIC_URL + '/data/country_by_year.csv').then(setCountryByYearData);
    d3.json(process.env.PUBLIC_URL + '/data/country_stories.json').then((data) => {
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
  <div className="App" style={{ padding: '20px', position: 'relative' }}>

    <IntroStory />

    <section style={{ marginBottom: '40px' }}>
      <CountryStoryCarousel stories={countryStories} />
    </section>

    <section
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        textAlign: 'center',
        margin: '60px 0',
      }}
    >
      <h1 style={{ width: '60%' }}>
        Below, you will find an overview of refugees entering into the United States. 
        Keep scrolling to explore the data by region and year.
      </h1>
    </section>

    <section style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
      <Overview
        data={countryByYearData}
        selectedYears={selectedYears}
        setSelectedYears={setSelectedYears}
        setSelectedRegions={setSelectedRegions}
      />
    </section>

    <section
      className="responsive-flex"
      style={{
        display: 'flex',
        alignItems: 'stretch',
      }}
    >
      <div style={{ width: '700px', padding: '10px', alignContent: 'center'}}>
        <RefugeeQueryAdlib
          startYear={startYear}
          endYear={endYear}
          setStartYear={setStartYear}
          setEndYear={setEndYear}
          selectedRegions={selectedRegions}
          setSelectedRegions={setSelectedRegions}
        />
      </div>

      <div style={{ flex: 1, padding: '10px' }}>
        <MapChart
          data={countryByYearData}
          startYear={startYear}
          endYear={endYear}
          selectedRegions={selectedRegions}
        />
      </div>
    </section>

    <section
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: '20px',
        justifyContent: 'center',
        marginBottom: '60px',
        padding: '10px',
      }}
    >
      <div
        style={{
          flex: 1,
        }}
      >
        <SankeyChart
          data={countryByYearData}
          startYear={startYear}
          endYear={endYear}
          selectedRegions={selectedRegions}
        />
      </div>

      <div
        style={{
          flex: 4,
        }}
      >
        <CountryLineChart
          data={countryByYearData}
          selectedRegions={selectedRegions}
        />
      </div>
    </section>
  </div>
);

}

export default App;
