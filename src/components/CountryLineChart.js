import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const CountryLineChart = ({ data, selectedRegions }) => {
  const ref = useRef();

  useEffect(() => {
    if (!data || data.length === 0 || selectedRegions.length === 0) return;

    const width = 600;
    const height = 400;
    const marginTop = 20;
    const marginRight = 30;
    const marginBottom = 30;
    const marginLeft = 40;
    const years = d3.range(2013, 2023);

    // Convert wide to long
    const data2 = [];
    for (const row of data) {
      if (!selectedRegions.includes(row.Region)) continue;
      for (const year of years) {
        const raw = row[year];
        if (raw && raw !== 'D') {
          const val = +String(raw).replace(/,/g, '');
          if (!isNaN(val)) {
            data2.push({
              country: row.Country,
              year,
              value: val
            });
          }
        }
      }
    }

    const countries = d3.groups(data2, d => d.country);
    const x = d3.scaleLinear().domain([2013, 2022]).range([marginLeft, width - marginRight-30]);
    const y = d3.scaleLinear().domain([0, d3.max(data2, d => d.value)]).nice().range([height - marginBottom, marginTop]);
    const z = d3.scaleOrdinal(d3.schemeTableau10).domain(countries.map(([key]) => key));

    const line = d3.line()
      .defined(d => !isNaN(d.value))
      .x(d => x(d.year))
      .y(d => y(d.value));

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    svg
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;");

    svg.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x).ticks(years.length).tickFormat(d3.format("d")));

    svg.append("g")
      .attr("transform", `translate(${marginLeft},0)`)
      .call(d3.axisLeft(y).ticks(null, "s"))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll(".tick:not(:first-of-type) line").clone()
        .attr("x2", width)
        .attr("stroke", "#ddd"));

    const g = svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("fill", "none")
      .attr("stroke-width", 1.5)
      .attr("stroke-miterlimit", 1);

    // Animate lines
    (async function animate() {
      for (const [country, values] of countries) {
        values.sort((a, b) => a.year - b.year);

        const path = g.append("path")
          .attr("d", line(values))
          .attr("stroke", z(country))
          .attr("stroke-dasharray", "0,1");

        await path.transition()
          .ease(d3.easeLinear)
          .duration(1000)
          .attrTween("stroke-dasharray", function () {
            const l = this.getTotalLength();
            return d3.interpolateString(`0,${l}`, `${l},${l}`);
          })
          .end();

        if (!isNaN(values[values.length - 1].value)) {
          g.append("text")
            .attr("paint-order", "stroke")
            .attr("stroke", "white")
            .attr("stroke-width", 3)
            .attr("fill", z(country))
            .attr("dx", 4)
            .attr("dy", "0.32em")
            .attr("x", x(values[values.length - 1].year))
            .attr("y", y(values[values.length - 1].value))
            .text(country);
        }
      }
    })();
  }, [data, selectedRegions]);

  return <svg ref={ref} />;
};

export default CountryLineChart;
