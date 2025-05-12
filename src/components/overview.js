import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import regionColorScale from './region_color_scale';

const Overview = ({ data }) => {
  const svgRef = useRef();

  const parseValue = (str, d) => {
    if (typeof str === 'string') {
      if (str === 'D') return 50;
      const cleaned = str.replace(/,/g, '');
      const num = +cleaned;
      return isNaN(num) ? 0 : num;
    }
    return +str || 0;
  };

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

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

    const stacked = d3.stack().keys(allRegions)(stackedData);

    const width = 900, height = 600;
    const margin = { top: 60, right: 150, bottom: 60, left: 80 };

    const x = d3.scaleBand().domain(years).range([margin.left, width - margin.right]).padding(0.1);
    const y = d3.scaleLinear()
      .domain([0, d3.max(stackedData, d => d3.sum(allRegions, r => d[r]))])
      .range([height - margin.bottom, margin.top]);

    const color = regionColorScale;

    // Title
    svg.append('text')
      .attr('x', (width - margin.left - margin.right) / 2 + margin.left)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '24px')
      .style('font-weight', 'bold')
      .text('Total Refugees Entering the United States by Region');

    const bars = svg.append('g')
      .selectAll('g')
      .data(stacked)
      .join('g')
      .attr('fill', d => color(d.key));

    bars.selectAll('rect')
      .data(d => d.map(v => ({ ...v, key: d.key })))
      .join('rect')
      .attr('x', d => x(d.data.year))
      .attr('y', d => y(d[1]))
      .attr('height', d => y(d[0]) - y(d[1]))
      .attr('width', x.bandwidth());

    // X Axis
    svg.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .style('font-size', '12px');

    // X Axis Label
    svg.append('text')
      .attr('x', (width - margin.left - margin.right) / 2 + margin.left)
      .attr('y', height - 10)
      .attr('text-anchor', 'middle')
      .style('font-size', '20px')
      .text('Year');

    // Y Axis
    svg.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .style('font-size', '12px');

    // Y Axis Label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '20px')
      .text('Total Refugees');

    // Legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - margin.right + 10}, ${margin.top})`);

    allRegions.forEach((region, i) => {
      const g = legend.append('g').attr('transform', `translate(0, ${i * 20})`);
      g.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', color(region));
      g.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .text(region)
        .style('font-size', '16px');
    });
  }, [data]);

  return <svg ref={svgRef} width={900} height={600}></svg>;
};

export default Overview;
