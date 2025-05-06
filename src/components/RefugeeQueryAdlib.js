import React from 'react';
import Select, { components } from 'react-select';

const RefugeeQueryAdlib = ({
  startYear,
  endYear,
  setStartYear,
  setEndYear,
  selectedRegions,
  setSelectedRegions,
}) => {
  const years = Array.from({ length: 2022 - 2013 + 1 }, (_, i) => 2013 + i);
  const regionOptions = [
    { value: 'Asia', label: 'Asia' },
    { value: 'Europe', label: 'Europe' },
    { value: 'Africa', label: 'Africa' },
    { value: 'South America', label: 'South America' },
    { value: 'North America', label: 'North America' },
    { value: 'Oceania', label: 'Oceania' },
  ];

  const CustomMultiValue = (props) => {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          background: '#eef',
          borderRadius: '16px',
          padding: '4px 10px',
          fontSize: '16px',
          fontWeight: 600,
          marginRight: '8px',
          marginBottom: '4px',
        }}
      >
        <span>{props.data.label}</span>
        <span
          onClick={props.removeProps.onClick}
          style={{
            marginLeft: '8px',
            cursor: 'pointer',
            fontWeight: 'normal',
            color: '#555',
          }}
        >
          ×
        </span>
      </div>
    );
  };

  return (
    <div style={{ fontSize: '22px', fontWeight: 400, textAlign: 'center', marginBottom: '40px' }}>
      <span>Show me data on refugees entering the U.S. from </span>

      <span style={{ display: 'inline-block', minWidth: '280px', verticalAlign: 'middle' }}>
        <Select
          isMulti
          options={regionOptions}
          value={regionOptions.filter((opt) => selectedRegions.includes(opt.value))}
          onChange={(selected) => setSelectedRegions(selected.map((opt) => opt.value))}
          placeholder="Select region(s)"
          closeMenuOnSelect={false}
          components={{
            MultiValue: CustomMultiValue,
            // Leave IndicatorsContainer alone so the dropdown arrow shows
          }}
          styles={{
            control: (base) => ({
              ...base,
              border: '1px solid #ccc',
              borderRadius: '6px',
              background: 'white',
              padding: '4px 6px',
              cursor: 'pointer',
              minHeight: 'auto',
            }),
            menu: (base) => ({
              ...base,
              fontSize: '16px',
              zIndex: 20,
            }),
            valueContainer: (base) => ({
              ...base,
              padding: 0,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              lineHeight: 1.2,
            }),
            placeholder: (base) => ({
              ...base,
              color: '#aaa',
            }),
          }}
        />
      </span>

      <span> between </span>

      <select
        value={startYear ?? ''}
        onChange={(e) => setStartYear(Number(e.target.value))}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          background: 'none',
          border: 'none',
          borderBottom: '2px solid #ccc',
          padding: '2px 6px',
          fontSize: '22px',
          fontWeight: 600,
          textAlign: 'center',
          minWidth: '100px',
          margin: '0 4px',
          cursor: 'pointer',
        }}
      >
        <option value="">Start year</option>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      <span> and </span>

      <select
        value={endYear ?? ''}
        onChange={(e) => setEndYear(Number(e.target.value))}
        style={{
          appearance: 'none',
          WebkitAppearance: 'none',
          MozAppearance: 'none',
          background: 'none',
          border: 'none',
          borderBottom: '2px solid #ccc',
          padding: '2px 6px',
          fontSize: '22px',
          fontWeight: 600,
          textAlign: 'center',
          minWidth: '100px',
          margin: '0 4px',
          cursor: 'pointer',
        }}
      >
        <option value="">End year</option>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>

      <span>.</span>
    </div>
  );
};

export default RefugeeQueryAdlib;
