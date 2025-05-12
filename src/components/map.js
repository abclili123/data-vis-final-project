import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import regionColorScale from './region_color_scale';

const MapChart = ({ data, startYear, endYear, selectedRegions }) => {
  const ref = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const isSingleYear = (startYear || endYear) && !(startYear && endYear);
    const width = 500;
    const height = 350;

    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(world => {
      const svg = d3.select(ref.current);
      svg.selectAll("*").remove();

      const countriesFeature = topojson.feature(world, world.objects.countries);
      const projection = d3.geoNaturalEarth1().fitSize([width - 100, height - 100], { type: "Sphere" });
      const path = d3.geoPath(projection);

      if ((!startYear && !endYear) || selectedRegions.length === 0) {
        svg.attr("viewBox", [0, 0, width - 100, height - 100])
          .style("width", "100%")
          .style("height", "auto");

        svg.append("path").datum({ type: "Sphere" }).attr("d", path).style("fill", "#9ACBE3");
        svg.append("path").datum(d3.geoGraticule10()).attr("d", path)
          .style("fill", "none").style("stroke", "white").style("stroke-width", .8)
          .style("stroke-opacity", .5).style("stroke-dasharray", 2);
        svg.append("path").datum(countriesFeature).attr("fill", "white").style("fill-opacity", .5).attr("d", path);

        const usFeature = countriesFeature.features.find(f => f.properties.name === "United States of America");
        svg.append("path").datum(usFeature).attr("fill", "none").attr("stroke", "black").attr("stroke-width", 1.5).attr("d", path);
        return;
      }

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

      const parseValue = (str, d) => {
        if (typeof str === 'string') {
          if (str === 'D') {
            d.hasDefaultValue = true;
            return 50;
          }
          const cleaned = str.replace(/,/g, '');
          const num = +cleaned;
          return isNaN(num) ? 0 : num;
        }
        return +str || 0;
      };

      const yearA = startYear;
      const yearB = endYear;

      const rawData = data.filter(d => selectedRegions.includes(d.Region)).map(d => {
        const normalizedName = countryNameMap[d.Country] || d.Country;
        const coords = countryCentroids.get(normalizedName);
        const local = { hasDefaultValue: false };
        const yearValues = {};
        if (yearA != null && yearB == null) {
          yearValues[yearA] = parseValue(d[yearA], local);
        } else if (yearB != null && yearA == null) {
          yearValues[yearB] = parseValue(d[yearB], local);
        } else {
          for (let year = yearA; year <= yearB; year++) {
            yearValues[year] = parseValue(d[year], local);
          }
        }
        return {
          id: normalizedName,
          region: d.Region,
          yearValues,
          hasDefaultValue: local.hasDefaultValue,
          x: coords ? coords[0] : null,
          y: coords ? coords[1] : null,
          originalX: coords ? coords[0] : null,
          originalY: coords ? coords[1] : null
        };
      }).filter(d => d.x !== null && d.y !== null);

      const radius = d3.scaleSqrt()
        .domain([0, d3.max(rawData, d => d3.max(Object.values(d.yearValues)))])
        .range([0, 30]);

      const usBox = { cx: 100, cy: 76, width: 60, height: 30, angle: 15 };

      const setSimulatedPositions = (data, currentYear, xKey, yKey) => {
        data.forEach(d => {
          d.value = d.yearValues[currentYear];
          d.x = d.originalX;
          d.y = d.originalY;
        });

        const sim = d3.forceSimulation(data)
          .force("x", d3.forceX(d => d.x).strength(0.5))
          .force("y", d3.forceY(d => d.y).strength(0.5))
          .force("collide", d3.forceCollide(d => radius(d.value) + 1))
          .force("avoidRotatedUSBox", () => {
            const angle = (usBox.angle * Math.PI) / 180;
            const cosA = Math.cos(-angle);
            const sinA = Math.sin(-angle);
            const hw = usBox.width / 2;
            const hh = usBox.height / 2;
            const strength = 2;
            data.forEach(d => {
              const r = radius(d.value);
              const dx = d.x - usBox.cx;
              const dy = d.y - usBox.cy;
              const rx = dx * cosA - dy * sinA;
              const ry = dx * sinA + dy * cosA;
              if (rx + r > -hw && rx - r < hw && ry + r > -hh && ry - r < hh) {
                const len = Math.sqrt(dx * dx + dy * dy) || 1;
                d.vx += (dx / len) * strength;
                d.vy += (dy / len) * strength;
              }
            });
          });

        for (let i = 0; i < 300; i++) sim.tick();
        sim.stop();

        data.forEach(d => {
          d[xKey] = d.x;
          d[yKey] = d.y;
        });
      };

      let allYears;
      if (yearA != null && yearB == null) {
        allYears = [yearA];
      } else if (yearB != null && yearA == null) {
        allYears = [yearB];
      } else {
        allYears = d3.range(yearA, yearB + 1);
      }

      allYears.forEach(year => {
        setSimulatedPositions(rawData, year, `xSim${year}`, `ySim${year}`);
      });

      const firstYear = allYears[0];
      rawData.forEach(d => {
        d.value = d.yearValues[firstYear];
        d.x = d[`xSim${firstYear}`];
        d.y = d[`ySim${firstYear}`];
      });

      svg.attr("viewBox", [0, 0, width - 100, height - 100])
        .style("width", "100%")
        .style("height", "auto");

      svg.append("path").datum({ type: "Sphere" }).attr("d", path).style("fill", "#9ACBE3");
      svg.append("path").datum(d3.geoGraticule10()).attr("d", path)
        .style("fill", "none").style("stroke", "white").style("stroke-width", .8)
        .style("stroke-opacity", .5).style("stroke-dasharray", 2);
      svg.append("path").datum(countriesFeature).attr("fill", "white").style("fill-opacity", .5).attr("d", path);

      const usFeature = countriesFeature.features.find(f => f.properties.name === "United States of America");
      svg.append("path").datum(usFeature).attr("fill", "none").attr("stroke", "black").attr("stroke-width", 1.5).attr("d", path);

      const groups = svg.selectAll("g.country-group")
        .data(rawData)
        .enter()
        .append("g")
        .attr("class", "country-group")
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .on("mouseover", function (event, d) {
      const [cx, cy] = d3.pointer(event, svg.node());
      const valueText = d.hasDefaultValue ? "Unknown" : d3.format(",")(d.value);
      const tooltipText = `${d.id}\n${valueText}`;

      const tooltipGroup = svg.append("g")
        .attr("id", "tooltip")
        .attr("transform", `translate(${cx}, ${cy - radius(d.value) - 10})`);

      tooltipGroup.append("text")
        .attr("font-size", 6)
        .attr("font-family", "sans-serif")
        .attr("fill", "#fff")
        .attr("text-anchor", "middle")
        .selectAll("tspan")
        .data(tooltipText.split("\n"))
        .enter()
        .append("tspan")
        .attr("x", 0)
        .attr("dy", (d, i) => i === 0 ? 0 : 8)
        .text(d => d);

      const bbox = tooltipGroup.node().getBBox();
        tooltipGroup.insert("rect", "text")
          .attr("x", bbox.x - 6)
          .attr("y", bbox.y - 4)
          .attr("width", bbox.width + 12)
          .attr("height", bbox.height + 8)
          .attr("rx", 4)
          .attr("ry", 4)
          .attr("fill", "rgba(0, 0, 0, 0.8)");
      })
      .on("mousemove", function (event) {
        const [x, y] = d3.pointer(event, svg.node());
        d3.select("#tooltip")
          .attr("transform", `translate(${x}, ${y - 20})`);
      })
      .on("mouseout", function () {
        svg.select("#tooltip").remove();
      });

      const tooltip = d3.select("body")
        .append("div")
        .attr("class", "map-tooltip")
        .style("position", "absolute")
        .style("padding", "6px 10px")
        .style("background", "#fff")
        .style("border", "1px solid #ccc")
        .style("border-radius", "4px")
        .style("pointer-events", "none")
        .style("box-shadow", "0 1px 4px rgba(0,0,0,0.2)")
        .style("font-size", "13px")
        .style("opacity", 0);

      const circles = groups.append("circle")
        .attr("r", d => radius(d.value))
        .attr("fill", d => regionColorScale(d.region))
        .attr("fill-opacity", 0.9)
        .attr("stroke", d => d.hasDefaultValue ? "white" : "#fff")
        .attr("stroke-width", 0.5)
        .attr("stroke-dasharray", d => d.hasDefaultValue ? "4,2" : null);

      groups.append("text")
        .text(d => d.id)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-family", "sans-serif")
        .attr("font-weight", "normal")
        .attr("fill", "white")
        .style("font-size", d => `${radius(d.value) * 0.8}px`);

      const timelineHeight = height - 30;
    const timelineGroup = svg.append("g").attr("class", "timeline");

    const yearScale = d3.scalePoint()
      .domain(allYears)
      .range([40, width - 140])
      .padding(0.5);

    const getBarCenter = d => yearScale(d);

    timelineGroup.append("line")
      .attr("x1", getBarCenter(allYears[0]))
      .attr("x2", getBarCenter(allYears[allYears.length - 1]))
      .attr("y1", 4)
      .attr("y2", 4)
      .attr("stroke", "#ddd")
      .attr("stroke-width", 4);

    const yearDots = timelineGroup.selectAll("circle.year-dot")
      .data(allYears)
      .enter()
      .append("circle")
      .attr("class", "year-dot")
      .attr("cx", d => getBarCenter(d))
      .attr("cy", 4)
      .attr("r", 3)
      .attr("fill", d => d === firstYear ? '#4CAF50' : '#fff')
      .attr("stroke", "#4CAF50")
      .attr("stroke-width", 2);

    const yearLabels = timelineGroup.selectAll(".year-label")
      .data(allYears)
      .enter()
      .append("text")
      .attr("class", d => `year-label year-${d}`)
      .attr("x", d => yearScale(d))
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .attr("font-size", 5)
      .attr("fill", d => d === firstYear ? "black" : "#999")
      .attr("font-weight", d => d === firstYear ? "bold" : "normal")
      .text(d => d);

    const totalGroup = svg.append("g")
      .attr("class", "total-label")
      .attr("transform", `translate(${(width-100) / 2}, ${240})`);

    const totalText = totalGroup.append("text")
      .attr("text-anchor", "middle")
      .attr("font-size", 8)
      .attr("font-family", "sans-serif")
      .attr("fill", "#333")
      .text(""); // placeholder, will be updated

    const formatTotal = d3.format(",");
    const updateTotal = (year) => {
      const total = d3.sum(rawData.filter(d => !d.hasDefaultValue), d => d.value);
      totalText.text(`Total: ${formatTotal(total)}`);
    };

    updateTotal(firstYear);


    // Animation loop only if more than one year
    if (allYears.length > 1) {
      let yearIndex = 0;
      d3.interval(() => {
        const currentYear = allYears[yearIndex];
        updateTotal(currentYear);
        yearIndex = (yearIndex + 1) % allYears.length;

        rawData.forEach(d => {
          d.value = d.yearValues[currentYear];
          d.x = d[`xSim${currentYear}`];
          d.y = d[`ySim${currentYear}`];
        });

        circles.transition().duration(1000).attr("r", d => radius(d.value));
        groups.transition().duration(1000).attr("transform", d => `translate(${d.x},${d.y})`);
        groups.select("text").transition().duration(1000).style("font-size", d => `${radius(d.value) * 0.8}px`);

        yearDots.transition().duration(800)
          .attr("fill", d => d === currentYear ? '#4CAF50' : '#fff');

        yearLabels.transition().duration(800)
          .attr("fill", d => d === currentYear ? "black" : "#999")
          .attr("font-weight", d => d === currentYear ? "bold" : "normal");

      }, 5000);
    }
    });
  }, [data, startYear, endYear, selectedRegions]);

  return (
    <div style={{ padding: '20px', position: 'relative' }}>
      <svg ref={ref}></svg>
    </div>
  );
};

export default MapChart;
