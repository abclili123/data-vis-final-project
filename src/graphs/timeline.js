import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const Timeline = ({ years, selectedYears, setSelectedYears }) => {
  const svgRef = useRef();
  const width = 500, height = 120;
  const margin = { top: 20, right: 50, bottom: 30, left: 50 };

  // Initial render: only runs when `years` changes
  useEffect(() => {
    if (!Array.isArray(years) || years.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // ✅ Only on full re-render

    const x = d3.scalePoint()
      .domain(years)
      .range([margin.left, width - margin.right])
      .padding(0.5);

    // Static background line
    svg.append('line')
      .attr('x1', x.range()[0])
      .attr('x2', x.range()[1])
      .attr('y1', height / 2)
      .attr('y2', height / 2)
      .attr('stroke', '#ddd')
      .attr('stroke-width', 6)
      .attr('stroke-linecap', 'round');

    // Progress line — animated later
    // Progress line — animated later
    svg.append('line')
      .attr('class', 'progress-line')
      .attr('x1', x(selectedYears[0] || years[0]))
      .attr('x2', x(selectedYears[1] || selectedYears[0] || years[0]))
      .attr('y1', height / 2)
      .attr('y2', height / 2)
      .attr('stroke', '#4CAF50')
      .attr('stroke-width', 6)
      .attr('stroke-linecap', 'round');

    // Year dots
    svg.selectAll('circle.year-dot')
      .data(years)
      .enter()
      .append('circle')
      .attr('class', 'year-dot')
      .attr('cx', d => x(d))
      .attr('cy', height / 2)
      .attr('r', 10)
      .attr('fill', d => {
        if (selectedYears.length === 2) {
          return d >= selectedYears[0] && d <= selectedYears[1] ? '#4CAF50' : '#fff';
        } else {
          return selectedYears.includes(d) ? '#4CAF50' : '#fff';
        }
      })      
      .attr('stroke', '#4CAF50')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (_, d) => {
        if (selectedYears.includes(d)) {
          setSelectedYears(selectedYears.filter(year => year !== d));
        } else if (selectedYears.length < 2) {
          setSelectedYears([...selectedYears, d].sort((a, b) => a - b));
        } else {
          setSelectedYears([d]); // Reset if two already selected
        }
      })      

    // Year labels
    svg.selectAll('text.year-label')
      .data(years)
      .enter()
      .append('text')
      .attr('class', 'year-label')
      .attr('x', d => x(d))
      .attr('y', height / 2 + 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .text(d => d);
  }, [years]);

  // Animate changes in selectedYears
  useEffect(() => {
    if (!Array.isArray(years) || years.length === 0) return;

    const svg = d3.select(svgRef.current);
    const x = d3.scalePoint()
      .domain(years)
      .range([margin.left, width - margin.right])
      .padding(0.5);

    const start = x(selectedYears[0] || years[0]);
    const end = x(selectedYears[1] || selectedYears[0] || years[0]);

    svg.select('line.progress-line')
      .transition()
      .duration(400)
      .attr('x1', start)
      .attr('x2', end);

    svg.selectAll('circle.year-dot')
      .transition()
      .duration(400)
      .attr('fill', d => {
        if (selectedYears.length === 2) {
          return d >= selectedYears[0] && d <= selectedYears[1] ? '#4CAF50' : '#fff';
        } else {
          return selectedYears.includes(d) ? '#4CAF50' : '#fff';
        }
      });
  }, [selectedYears, years]);


  return <svg ref={svgRef} width={width} height={height}></svg>;
};

export default Timeline;
