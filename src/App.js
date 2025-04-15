import './App.css';

import * as d3 from 'd3';

import React, { useEffect, useState } from 'react';
import { useMemo, useRef } from 'react';

import Timeline from './graphs/timeline';
import TimelineContext from './graphs/timeline_context';
import Overview from './graphs/overview';
import ListCountries from './graphs/list_countries';
import MapChart from './graphs/map';

function App() {
  const [countryByYearData, setCountryByYearData] = useState([]);
  const [sexByYearData, setSexByYearData] = useState([]);
  const [eventByYearData, setEventByYearData] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedRegionData, setSelectedRegionData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(2013);
  const [selectedTimelineText, setSelectedTimelineText] = useState("");
  const yearChangeSource = useRef(null);

  // Load data once on mount
  useEffect(() => {
    d3.csv('/data/country_by_year.csv').then(setCountryByYearData);
    d3.csv('/data/sex_by_year.csv').then(setSexByYearData);
    d3.csv('/data/events_by_year.csv').then(setEventByYearData);
  }, []);

  const memoizedYears = useMemo(() => {
    return (eventByYearData || [])
      .map(d => +d.year)
      .sort((a, b) => a - b);
  }, [eventByYearData]);

  // trigger correct shared variable assignments
  useEffect(() => {
    if (eventByYearData.length > 0) {
      const match = eventByYearData.find(d => +d.year === +selectedYear);
      if (match) {
        setSelectedTimelineText(match.event);
      }
    }
  
    if (yearChangeSource.current === 'timeline') {
      setSelectedRegion(null);
      setSelectedRegionData([]);
    }
  
    // Reset the source after handling
    yearChangeSource.current = null;
  }, [selectedYear, eventByYearData]);  

  // Filter region data when region or data changes
  useEffect(() => {
    if (selectedRegion && countryByYearData.length > 0) {
      const regionData = countryByYearData.filter(d => d.region === selectedRegion);
      setSelectedRegionData(regionData);
    }
  }, [selectedRegion, countryByYearData]);

  return (
    <div className="App">
      <MapChart data={countryByYearData} selectedYear={selectedYear} />
      <Timeline
        years={memoizedYears}
        selectedYear={selectedYear}
        setSelectedYear={(year) => {
          yearChangeSource.current = 'timeline';
          setSelectedYear(year);
        }}
        yearChangeSource={yearChangeSource}
      />
      <TimelineContext selectedTimelineText={selectedTimelineText} />
      <Overview
        data={countryByYearData}
        setSelectedYear={(year) => {
          yearChangeSource.current = 'overview';
          setSelectedYear(year);
        }}
        setSelectedRegionData={setSelectedRegionData}
      />
      <ListCountries
        data={selectedRegionData}
        selectedYear={selectedYear}
      />
      {/* Example: pass data + setters to charts */}
      {/* <MapChart data={countryByYearData} onRegionSelect={setSelectedRegion} /> */}
      {/* <BarChart data={selectedRegionData} selectedYear={selectedYear} onYearChange={setSelectedYear} /> */}
    </div>
  );
}

export default App;

