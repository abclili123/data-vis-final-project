import './App.css';

import * as d3 from 'd3';

import React, { useEffect, useState } from 'react';

import Overview from './graphs/overview';
import MapChart from './graphs/map';

function App() {
  const [countryByYearData, setCountryByYearData] = useState([]);
  const [sexByYearData, setSexByYearData] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);

  // Load data once on mount
  useEffect(() => {
    d3.csv('/data/country_by_year.csv').then(setCountryByYearData);
    d3.csv('/data/sex_by_year.csv').then(setSexByYearData);
  }, []);

  return (
    <div className="App" style={{ padding: '20px', position: 'relative' }}>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1 , border: "solid 1px red" }}>
          <Overview
            data={countryByYearData}
            selectedYears={selectedYears}
            setSelectedYears={setSelectedYears}
          />
        </div>
        <div style={{ flex: 2, border: "solid 1px blue" }}>
          <MapChart data={countryByYearData} selectedYears={selectedYears} />
        </div>
      </div>
    </div>
  );
}

export default App;

