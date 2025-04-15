import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

const MapChart = ({ data, selectedYear }) => {
  const ref = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const width = 960;
    const height = 500;

    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(world => {
      const countriesFeature = topojson.feature(world, world.objects.countries);
      const projection = d3.geoNaturalEarth1().fitSize([width, height], { type: "Sphere" });
      const path = d3.geoPath(projection);

      const countryCentroids = new Map();
      countriesFeature.features.forEach(feature => {
        const name = feature.properties.name;
        const centroid = d3.geoCentroid(feature);
        const projected = projection(centroid);
        if (name && projected) {
          countryCentroids.set(name, projected);
        }
      });

      const rawData = data.map(d => {
        const coords = countryCentroids.get(d.Country);
        return {
          id: d.Country,
          region: d.Region,
          value: +d[selectedYear] || 0,
          x: coords ? coords[0] : null,
          y: coords ? coords[1] : null
        };
      }).filter(d => d.x !== null && d.y !== null);

      const radius = d3.scaleSqrt()
        .domain([0, d3.max(rawData, d => d.value)])
        .range([0, 30]);

      const totalValue = d3.sum(rawData, d => d.value);
      const usCoord = projection([-100, 40]);
      rawData.push({
        id: "Total",
        region: "Total",
        value: totalValue,
        x: usCoord[0],
        y: usCoord[1]
      });

      const regionColor = d3.scaleOrdinal()
        .domain([...new Set(rawData.map(d => d.region))])
        .range(d3.schemeTableau10);

      // Run force simulation to separate overlapping circles
      const simulation = d3.forceSimulation(rawData)
        .force("x", d3.forceX(d => d.x).strength(0.5))
        .force("y", d3.forceY(d => d.y).strength(0.5))
        .force("collide", d3.forceCollide(d => radius(d.value) + 1))
        .stop();

      for (let i = 0; i < 300; i++) simulation.tick();

      const svg = d3.select(ref.current);
      svg.selectAll("*").remove();

      svg.attr("viewBox", [0, 0, width, height])
        .style("width", "100%")
        .style("height", "auto");

      svg.append("path")
        .datum({ type: "Sphere" })
        .attr("class", "graticuleOutline")
        .attr("d", path)
        .style("fill", "#9ACBE3");

      svg.append("path")
        .datum(d3.geoGraticule10())
        .attr("class", "graticule")
        .attr("d", path)
        .style("fill", "none")
        .style("stroke", "white")
        .style("stroke-width", .8)
        .style("stroke-opacity", .5)
        .style("stroke-dasharray", 2);

      svg.append("path")
        .datum(countriesFeature)
        .attr("fill", "white")
        .style("fill-opacity", .5)
        .attr("d", path);

      svg.selectAll("circle")
        .data(rawData)
        .enter()
        .append("circle")
        .attr("r", d => radius(d.value))
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("fill", d => regionColor(d.region))
        .attr("fill-opacity", 0.9)
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5);

      svg.selectAll("text")
        .data(rawData)
        .enter()
        .append("text")
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .text(d => d.id)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-family", "sans-serif")
        .attr("font-weight", d => d.id === "Total" ? "bold" : "normal")
        .attr("fill", "white")
        .style("font-size", d => `${radius(d.value) * 0.8}px`);
    });
  }, [data, selectedYear]);

  return <svg ref={ref}></svg>;
};

export default MapChart;
