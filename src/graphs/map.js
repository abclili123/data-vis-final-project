import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

const MapChart = ({ data, selectedYear }) => {
  const ref = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const width = 800;
    const height = 400;

    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(world => {
      const svg = d3.select(ref.current);
      svg.selectAll("*").remove();

      const countriesFeature = topojson.feature(world, world.objects.countries);
      const projection = d3.geoNaturalEarth1().fitSize([width - 100, height - 100], { type: "Sphere" });
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

      const countryNameMap = {
        "Bosnia and Herzegovina": "Bosnia and Herz.",
        "Burma": "Myanmar",
        "Central African Republic": "Central African Rep.",
        "China, People's Republic": "China",
        "Congo, Democratic Republic": "Dem. Rep. Congo",
        "Congo, Republic": "Congo",
        "Cote d'Ivoire": "Côte d'Ivoire",
        "Dominican Republic": "Dominican Rep.",
        "North Macedonia": "Macedonia",
        "South Sudan": "S. Sudan"
      };
      
      const missingCentroids = [];

      const parseValue = str => {
        if (typeof str === 'string') {
          return +str.replace(/,/g, '') || 0;
        }
        return +str || 0;
      };
      
      const rawData = data.map(d => {
        const normalizedName = countryNameMap[d.Country] || d.Country;
        const coords = countryCentroids.get(normalizedName);
        const value = parseValue(d[selectedYear]);
        if (!coords) {
          missingCentroids.push({
            Country: d.Country,
            Region: d.Region,
            Value: value
          });
        }
        return {
          id: normalizedName,
          region: d.Region,
          value: value,
          x: coords ? coords[0] : null,
          y: coords ? coords[1] : null,
          originalX: coords ? coords[0] : null,
          originalY: coords ? coords[1] : null
        };
      }).filter(d => d.x !== null && d.y !== null);
      
      console.warn("Missing centroids:", missingCentroids);
      console.log(rawData)

      const radius = d3.scaleSqrt()
        .domain([0, d3.max(rawData, d => d.value)])
        .range([0, 30]);

      svg.attr("viewBox", [0, 0, width - 100, height - 100])
        .style("width", "100%")
        .style("height", "auto");

      svg.append("path")
        .datum({ type: "Sphere" })
        .attr("d", path)
        .style("fill", "#9ACBE3");

      svg.append("path")
        .datum(d3.geoGraticule10())
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

      const usFeature = countriesFeature.features.find(f => f.properties.name === "United States of America");
      svg.append("path")
        .datum(usFeature)
        .attr("fill", "none")
        .attr("stroke", "black")
        .attr("stroke-width", 1.5)
        .attr("d", path);

      const regionColor = d3.scaleOrdinal()
        .domain([...new Set(rawData.map(d => d.region))])
        .range(d3.schemeTableau10);

      const tooltip = d3.select(tooltipRef.current);

      // Approximate bounding box for the contiguous US in projected coordinates
      const usBox = {
        cx: 200, // center x
        cy: 76, // center y
        width: 70,
        height: 40,
        angle: 15 // degrees
      };

      const simulation = d3.forceSimulation(rawData)
      .force("x", d3.forceX(d => d.x).strength(0.5))
      .force("y", d3.forceY(d => d.y).strength(0.5))
      .force("collide", d3.forceCollide(d => radius(d.value) + 1))
      .force("avoidRotatedUSBox", () => {
        const angle = (usBox.angle * Math.PI) / 180;
        const cosA = Math.cos(-angle);
        const sinA = Math.sin(-angle);

        rawData.forEach(d => {
          const r = radius(d.value);
          const dx = d.x - usBox.cx;
          const dy = d.y - usBox.cy;
          const rx = dx * cosA - dy * sinA;
          const ry = dx * sinA + dy * cosA;

          const hw = usBox.width / 2;
          const hh = usBox.height / 2;

          if (rx + r > -hw && rx - r < hw && ry + r > -hh && ry - r < hh) {
            const len = Math.sqrt(dx * dx + dy * dy) || 1;
            const strength = 2;
            d.vx += (dx / len) * strength;
            d.vy += (dy / len) * strength;
          }
        });
      });

      for (let i = 0; i < 300; i++) simulation.tick();

      const groups = svg.selectAll("g.country-group")
        .data(rawData)
        .enter()
        .append("g")
        .attr("class", "country-group")
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .on("mouseenter", (event, d) => {
          tooltip
            .style("display", "block")
            .html(`<strong>${d.id}</strong><br/>${d.value.toLocaleString()}`);
        })
        .on("mousemove", (event) => {
          tooltip
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY) + "px");
        })
        .on("mouseleave", () => {
          tooltip.style("display", "none");
        });

      groups.append("circle")
        .attr("r", d => radius(d.value))
        .attr("fill", d => regionColor(d.region))
        .attr("fill-opacity", 0.9)
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5);

      groups.append("text")
        .text(d => d.id)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-family", "sans-serif")
        .attr("font-weight", "normal")
        .attr("fill", "white")
        .style("font-size", d => `${radius(d.value) * 0.8}px`);
    });
  }, [data, selectedYear]);

  return (
    <div>
      <svg ref={ref}></svg>
      <div
        ref={tooltipRef}
        style={{
          position: 'absolute',
          pointerEvents: 'none',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: '#fff',
          padding: '6px 10px',
          borderRadius: '4px',
          fontSize: '12px',
          display: 'none',
        }}
      />
    </div>
  );
};

export default MapChart;
