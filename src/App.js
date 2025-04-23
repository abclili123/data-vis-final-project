import './App.css';

import * as d3 from 'd3';

import React, { useEffect, useState } from 'react';

import Overview from './graphs/overview';
import MapChart from './graphs/map';

function App() {
  const [countryByYearData, setCountryByYearData] = useState([]);
  const [sexByYearData, setSexByYearData] = useState([]);
  const [selectedYears, setSelectedYears] = useState([2013, 2015]);

  // Load data once on mount
  useEffect(() => {
    d3.csv('/data/country_by_year.csv').then(setCountryByYearData);
    d3.csv('/data/sex_by_year.csv').then(setSexByYearData);
  }, []);

  return (
    <div className="App">
      <Overview
        data={countryByYearData}
        selectedYears={selectedYears}
        setSelectedYears={setSelectedYears}
      />
      <MapChart data={countryByYearData} selectedYears={selectedYears} />
    </div>
  );
}

export default App;

