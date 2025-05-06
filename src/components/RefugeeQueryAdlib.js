import React, { useEffect } from 'react';
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
  const yearOptions = years.map((y) => ({ value: y, label: y }));

  // Reset endYear if it becomes invalid
  useEffect(() => {
    if (startYear && endYear && endYear <= startYear) {
      setEndYear(null);
    }
  }, [startYear, endYear, setEndYear]);

  const CustomMultiValue = (props) => (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: '#eef',
        borderRadius: '16px',
        padding: '2px 8px',
        fontSize: '16px',
        fontWeight: 600,
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

  const regionSelectStyles = {
    control: (base) => ({
      ...base,
      border: '1px solid #ccc',
      borderRadius: '6px',
      background: '#fff',
      padding: '2px 6px',
      fontSize: '16px',
      fontWeight: 600,
      minHeight: '36px',
      cursor: 'pointer',
    }),
    valueContainer: (base) => ({
      ...base,
      display: 'flex',
      flexWrap: 'wrap',
      gap: '6px',
      alignItems: 'center',
      padding: '4px',
    }),
    menu: (base) => ({
      ...base,
      fontSize: '16px',
      zIndex: 20,
    }),
    placeholder: (base) => ({
      ...base,
      color: '#aaa',
    }),
  };

  const yearSelectStyles = {
    control: (base) => ({
      ...base,
      border: '1px solid #ccc',
      borderRadius: '6px',
      background: '#fff',
      padding: '2px 6px',
      fontSize: '16px',
      fontWeight: 600,
      minWidth: '120px',
      minHeight: '36px',
      cursor: 'pointer',
    }),
    menu: (base) => ({
      ...base,
      fontSize: '16px',
      zIndex: 20,
    }),
    placeholder: (base) => ({
      ...base,
      color: '#aaa',
    }),
  };

  // Shared span style
  const spanStyle = { fontWeight: 500, fontSize: '20px' };

  return (
    <div
      style={{
        fontSize: '20px',
        fontWeight: 400,
        textAlign: 'center',
        marginBottom: '40px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
        lineHeight: 1.6,
      }}
    >
      <span style={spanStyle}>Show me data on refugees entering the U.S. from</span>

      <Select
        isMulti
        options={regionOptions}
        value={regionOptions.filter((opt) => selectedRegions.includes(opt.value))}
        onChange={(selected) => setSelectedRegions(selected.map((opt) => opt.value))}
        placeholder="Select region(s)"
        closeMenuOnSelect={false}
        components={{ MultiValue: CustomMultiValue }}
        styles={regionSelectStyles}
      />

      <span style={spanStyle}>between</span>

      <Select
        options={yearOptions.filter((opt) => opt.value < 2022)}
        value={startYear ? { value: startYear, label: startYear } : null}
        onChange={(selected) => setStartYear(selected?.value ?? null)}
        placeholder="Start year"
        isClearable
        styles={yearSelectStyles}
      />

      <span style={spanStyle}>and</span>

      <Select
        options={yearOptions.filter((opt) => !startYear || opt.value > startYear)}
        value={endYear ? { value: endYear, label: endYear } : null}
        onChange={(selected) => setEndYear(selected?.value ?? null)}
        placeholder="End year"
        isClearable
        styles={yearSelectStyles}
      />

      <span style={spanStyle}>.</span>
    </div>
  );
};

export default RefugeeQueryAdlib;
