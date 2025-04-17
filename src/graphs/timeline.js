import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const Timeline = ({ years, selectedYear, setSelectedYear }) => {
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
    svg.append('line')
      .attr('class', 'progress-line')
      .attr('x1', x.range()[0])
      .attr('x2', x(selectedYear))
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
      .attr('fill', d => d <= selectedYear ? '#4CAF50' : '#fff')
      .attr('stroke', '#4CAF50')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (_, d) => setSelectedYear(+d));

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

  // Animate changes in selectedYear
  useEffect(() => {
    if (!Array.isArray(years) || years.length === 0) return;

    const svg = d3.select(svgRef.current);
    const x = d3.scalePoint()
      .domain(years)
      .range([margin.left, width - margin.right])
      .padding(0.5);

    svg.select('line.progress-line')
      .transition()
      .duration(400)
      .attr('x2', x(selectedYear));

    svg.selectAll('circle.year-dot')
      .transition()
      .duration(400)
      .attr('fill', d => +d <= selectedYear ? '#4CAF50' : '#fff');
  }, [selectedYear, years]);

  return <svg ref={svgRef} width={width} height={height}></svg>;
};

export default Timeline;
