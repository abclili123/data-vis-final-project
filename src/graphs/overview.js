import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import regionColorScale from './region_color_scale';

const Overview = ({ data, selectedYears, setSelectedYears, setSelectedRegions }) => {
  const svgRef = useRef();
  const tooltipRef = useRef();
  const [visibleRegions, setVisibleRegions] = useState([]); // null means all regions are visible

  const parseValue = (str, d) => {
    if (typeof str === 'string') {
      if (str === 'D') {
        d.hasDefaultValue = true;
        return 50;
      }
      const cleaned = str.replace(/,/g, '');
      const num = +cleaned;
      if (isNaN(num)) {
        console.warn('Invalid numeric value:', str);
        return 0;
      }
      return num;
    }
    return +str || 0;
  };

  // Compute the max value once, using all regions
  const maxYRef = useRef(0);
  useEffect(() => {
    if (!data || data.length === 0) return;
    const years = Object.keys(data[0]).filter(k => /^\d{4}$/.test(k));
    const allRegions = Array.from(new Set(data.map(d => d.Region)));

    const grouped = {};
    data.forEach(row => {
      years.forEach(year => {
        const raw = row[year];
        if (!raw || !row.Region || !row.Country) return;
        const value = parseValue(raw, row);
        if (!Number.isFinite(value)) return;
        const region = row.Region;
        grouped[year] ??= {};
        grouped[year][region] ??= 0;
        grouped[year][region] += value;
      });
    });

    const stackedData = years.map(year => {
      const entry = { year };
      for (const region of allRegions) {
        entry[region] = grouped[year]?.[region] ?? 0;
      }
      return entry;
    });

    const maxY = d3.max(stackedData, d => d3.sum(allRegions, r => d[r]));
    maxYRef.current = maxY;
  }, [data]);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const years = Object.keys(data[0]).filter(k => /^\d{4}$/.test(k));
    const allRegions = Array.from(new Set(data.map(d => d.Region)));
    const regions = visibleRegions === null ? allRegions : visibleRegions;

    const grouped = {};
    data.forEach(row => {
      years.forEach(year => {
        const raw = row[year];
        if (!raw || !row.Region || !row.Country) return;
        const value = parseValue(raw, row);
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

    const width = 700, height = 400;
    const margin = { top: 60, right: 150, bottom: 40, left: 60 };

    const x = d3.scaleBand().domain(years).range([margin.left, width - margin.right]).padding(0.1);
    const y = d3.scaleLinear()
      .domain([0, maxYRef.current])
      .range([height - margin.bottom, margin.top]);

    const color = regionColorScale;

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
      .attr("width", x.bandwidth());

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
      .on("mouseleave", () => tooltip.style("opacity", 0));

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x));

    const timelineY = height - margin.bottom + 30;
    const getBarCenter = d => x(d) + x.bandwidth() / 2;

    svg.append("line")
      .attr("x1", getBarCenter(years[0]))
      .attr("x2", getBarCenter(years[years.length - 1]))
      .attr("y1", timelineY)
      .attr("y2", timelineY)
      .attr("stroke", "#ddd")
      .attr("stroke-width", 4);

    svg.selectAll("circle.year-dot")
      .data(years)
      .join("circle")
      .attr("class", "year-dot")
      .attr("cx", d => getBarCenter(d))
      .attr("cy", timelineY)
      .attr("r", 6)
      .attr("fill", d => {
        if (selectedYears.length === 2) {
          return d >= selectedYears[0] && d <= selectedYears[1] ? '#4CAF50' : '#fff';
        } else {
          return selectedYears.includes(d) ? '#4CAF50' : '#fff';
        }
      })
      .attr("stroke", "#4CAF50")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("click", (_, d) => {
        let updated;
        if (selectedYears.includes(d)) {
          updated = selectedYears.filter(year => year !== d);
        } else if (selectedYears.length < 2) {
          updated = [...selectedYears, d].sort((a, b) => a - b);
        } else {
          updated = [d];
        }
        setSelectedYears(updated);
      });

    if (selectedYears.length === 2) {
      svg.append("line")
        .attr("x1", getBarCenter(selectedYears[0]))
        .attr("x2", getBarCenter(selectedYears[1]))
        .attr("y1", timelineY)
        .attr("y2", timelineY)
        .attr("stroke", "#4CAF50")
        .attr("stroke-width", 4);
    }

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));

    const legend = svg.append("g")
      .attr("transform", `translate(${width - margin.right + 10}, ${margin.top})`);

    allRegions.forEach((region, i) => {
      const isActive = visibleRegions === null || visibleRegions.includes(region);
      const g = legend.append("g").attr("transform", `translate(0, ${i * 20})`).style("cursor", "pointer")
      .on("click", () => {
        setVisibleRegions(prev => {
          let next;
          if (prev.includes(region)) {
            next = prev.filter(r => r !== region);
          } else {
            next = [...prev, region];
          }
          setSelectedRegions(next);
          return next;
        });
      });
      
      g.append("rect")
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", color(region))
        .attr("stroke", isActive ? "none" : "#999")
        .attr("fill-opacity", isActive ? 1 : 0.3);
      g.append("text")
        .attr("x", 20)
        .attr("y", 12)
        .text(region)
        .style("font-size", "12px");
    });
  }, [data, selectedYears, visibleRegions]);

  return (
    <>
      <svg ref={svgRef} width={700} height={400}></svg>
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
