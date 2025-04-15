import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const Overview = ({ data, setSelectedYear, setSelectedRegionData }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const years = Object.keys(data[0]).filter(k => /^\d{4}$/.test(k));
    const regions = Array.from(new Set(data.map(d => d.Region)));

    // Group data by region per year
    const grouped = {};
    data.forEach(row => {
      years.forEach(year => {
        const value = +row[year].replace(/,/g, "");
        if (!Number.isFinite(value)) return;
        const region = row.Region;
        grouped[year] ??= {};
        grouped[year][region] ??= 0;
        grouped[year][region] += value;
      });
    });

    const stackedData = years.map(year => {
      const entry = { year };
      for (const region of regions) {
        entry[region] = grouped[year]?.[region] ?? 0;
      }
      return entry;
    });

    const stacked = d3.stack().keys(regions)(stackedData);

    const width = 800, height = 550;
    const margin = { top: 60, right: 150, bottom: 40, left: 60 };

    const x = d3.scaleBand()
      .domain(years)
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(stackedData, d => d3.sum(regions, r => d[r]))])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const color = d3.scaleOrdinal()
      .domain(regions)
      .range(d3.schemeCategory10);

    // Add bars
    const bars = svg.append("g")
      .selectAll("g")
      .data(stacked)
      .join("g")
      .attr("fill", d => color(d.key));

    bars.selectAll("rect")
      .data(d => d.map(v => ({ ...v, key: d.key })))
      .join("rect")
      .attr("x", d => x(d.data.year))
      .attr("y", d => y(d[1]))
      .attr("height", d => y(d[0]) - y(d[1]))
      .attr("width", x.bandwidth())
      .on("click", (event, d) => {
        const year = d.data.year;
        const region = d.key;

        const countries = data.filter(row => {
          const rawValue = row[year];
          const numeric = +rawValue?.replace(/,/g, "");
          return row.Region === region && (isNaN(numeric) || numeric !== 0);
        });

        setSelectedYear(+year);
        setSelectedRegionData(countries);
      });

    // Tooltip
    const tooltip = d3.select(tooltipRef.current);

    svg.append("g")
      .selectAll("rect")
      .data(stackedData)
      .join("rect")
      .attr("x", d => x(d.year))
      .attr("y", margin.top)
      .attr("width", x.bandwidth())
      .attr("height", height - margin.top - margin.bottom)
      .attr("fill", "transparent")
      .on("mousemove", function (event, d) {
        const [mouseX, mouseY] = d3.pointer(event);
        const total = d3.sum(regions, r => d[r]);
        const topY = y(total);

        if (mouseY < topY) {
          tooltip
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 28}px`)
            .style("opacity", 1)
            .html(`<strong>Total</strong><br>Year: ${d.year}<br>Value: ${total.toLocaleString()}`);
        } else {
          let hoveredRegion = null;
          let regionValue = 0;
          let y0 = y(0);
          for (const region of regions) {
            const value = d[region];
            const y1 = y0;
            y0 = y0 - (y(0) - y(value));
            if (mouseY >= y0 && mouseY < y1) {
              hoveredRegion = region;
              regionValue = value;
              break;
            }
          }
          if (hoveredRegion) {
            tooltip
              .style("left", `${event.pageX + 10}px`)
              .style("top", `${event.pageY - 28}px`)
              .style("opacity", 1)
              .html(`<strong>${hoveredRegion}</strong><br>Year: ${d.year}<br>Value: ${regionValue.toLocaleString()}`);
          } else {
            tooltip.style("opacity", 0);
          }
        }
      })
      .on("mouseleave", () => tooltip.style("opacity", 0))
      .on("click", function (event, d) {
        const [mouseX, mouseY] = d3.pointer(event);
        let y0 = y(0);
        let clickedRegion = null;
        for (const region of regions) {
          const value = d[region];
          const y1 = y0;
          y0 = y0 - (y(0) - y(value));
          if (mouseY >= y0 && mouseY < y1) {
            clickedRegion = region;
            break;
          }
        }
        if (clickedRegion) {
          const year = d.year.toString();
          const countries = data.filter(row => {
            const raw = row[year];
            const numeric = +raw?.replace(/,/g, "");
            return row.Region === clickedRegion && (isNaN(numeric) || numeric !== 0);
          });
          setSelectedYear(+year);
          setSelectedRegionData(countries);
        }
      });

    // Axes
    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x));

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    // Legend
    const legend = svg.append("g")
      .attr("transform", `translate(${width - margin.right + 10}, ${margin.top})`);

    regions.forEach((region, i) => {
      const g = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
      g.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", color(region));
      g.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .text(region)
        .style("font-size", "12px");
    });
  }, [data, setSelectedYear, setSelectedRegionData]);

  return (
    <>
      <svg ref={svgRef} width={800} height={550}></svg>
      <div
        ref={tooltipRef}
        style={{
          position: 'absolute',
          padding: '6px 10px',
          background: '#fff',
          border: '1px solid #ccc',
          borderRadius: '4px',
          pointerEvents: 'none',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          fontSize: '13px',
          opacity: 0,
        }}
        className="tooltip"
      ></div>
    </>
  );
};

export default Overview;
