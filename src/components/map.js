import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import regionColorScale from './region_color_scale';

const MapChart = ({ data, startYear, endYear, selectedRegions }) => {
  const ref = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const isSingleYear = (startYear || endYear) && !(startYear && endYear);;
    const width = 500;
    const height = 350;

    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(world => {
      const svg = d3.select(ref.current);
      svg.selectAll("*").remove();

      const countriesFeature = topojson.feature(world, world.objects.countries);
      const projection = d3.geoNaturalEarth1().fitSize([width - 100, height - 100], { type: "Sphere" });
      const path = d3.geoPath(projection);

      const labelGroup = svg.append("g")
        .attr("transform", `translate(${(width - 100) / 2}, 10)`);

      const totalText = labelGroup.append("text")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "hanging")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("fill", "black");

      const updateTotalLabel = (year, total) => {
        const fullLine = `Year: ${year} | Total: ${Math.round(total).toLocaleString()}`;

        const updateText = totalText.selectAll("tspan").data([fullLine]);

        updateText.join(
          enter => enter.append("tspan")
            .attr("x", 0)
            .style("opacity", 0)
            .text(d => d)
            .transition()
            .duration(500)
            .style("opacity", 1),
          update => update
            .transition()
            .duration(500)
            .style("opacity", 0)
            .on("end", function () {
              d3.select(this)
                .text(fullLine)
                .transition()
                .duration(500)
                .style("opacity", 1);
            }),
          exit => exit.transition().duration(300).style("opacity", 0).remove()
        );
      };

      if ((!startYear && !endYear) || selectedRegions.length === 0) {
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

      const missingCentroids = [];

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

      const yearA = startYear;
      const yearB = endYear;

      const rawData = data
        .filter(d => selectedRegions.includes(d.Region))
        .map(d => {
          const normalizedName = countryNameMap[d.Country] || d.Country;
          const coords = countryCentroids.get(normalizedName);
          const local = { hasDefaultValue: false };
          const valueStart = parseValue(d[yearA], local);
          const valueEnd = yearB ? parseValue(d[yearB], local) : valueStart;

          if (!coords) {
            missingCentroids.push({
              Country: d.Country,
              Region: d.Region,
              Value: valueStart
            });
          }

          return {
            id: normalizedName,
            region: d.Region,
            valueStart,
            valueEnd,
            value: valueStart,
            hasDefaultValue: local.hasDefaultValue,
            x: coords ? coords[0] : null,
            y: coords ? coords[1] : null,
            originalX: coords ? coords[0] : null,
            originalY: coords ? coords[1] : null,
            xSimStart: null,
            ySimStart: null,
            xSimEnd: null,
            ySimEnd: null
          };
        }).filter(d => d.x !== null && d.y !== null);

      const radius = d3.scaleSqrt()
        .domain([0, d3.max(rawData, d => Math.max(d.valueStart, d.valueEnd))])
        .range([0, 30]);

      const tooltip = d3.select(tooltipRef.current);

      const setSimulatedPositions = (data, valueKey, xKey, yKey) => {
        data.forEach(d => {
          d.value = d[valueKey];
          d.x = d.originalX;
          d.y = d.originalY;
        });

        const sim = d3.forceSimulation(data)
          .force("x", d3.forceX(d => d.x).strength(0.5))
          .force("y", d3.forceY(d => d.y).strength(0.5))
          .force("collide", d3.forceCollide(d => radius(d.value) + 1));

        for (let i = 0; i < 300; i++) sim.tick();

        data.forEach(d => {
          d[xKey] = d.x;
          d[yKey] = d.y;
        });

        sim.stop();
      };

      if (isSingleYear) {
        setSimulatedPositions(rawData, 'valueStart', 'xSimStart', 'ySimStart');
        rawData.forEach(d => {
          d.x = d.xSimStart;
          d.y = d.ySimStart;
          d.value = d.valueStart;
        });
      } else {
        setSimulatedPositions(rawData, 'valueStart', 'xSimStart', 'ySimStart');
        setSimulatedPositions(rawData, 'valueEnd', 'xSimEnd', 'ySimEnd');
        rawData.forEach(d => {
          d.x = d.xSimStart;
          d.y = d.ySimStart;
          d.value = d.valueStart;
        });
      }

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

      const total = d3.sum(rawData.filter(d => !d.hasDefaultValue), d => d.value);
      updateTotalLabel(yearA, total);

      const groups = svg.selectAll("g.country-group")
        .data(rawData)
        .enter()
        .append("g")
        .attr("class", "country-group")
        .attr("transform", d => `translate(${d.x},${d.y})`)
        .on("mouseenter", (event, d) => {
          tooltip
            .style("display", "block")
            .html(`<strong>${d.id}</strong><br/>${d.hasDefaultValue ? 'Unknown' : Math.round(d.value).toLocaleString()}`);
        })
        .on("mousemove", (event) => {
          tooltip
            .style("left", (event.pageX) + "px")
            .style("top", (event.pageY) + "px");
        })
        .on("mouseleave", () => {
          tooltip.style("display", "none");
        });

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

      if (!isSingleYear) {
        d3.interval(() => {
          rawData.forEach(d => {
            const isStart = d.value === d.valueStart;
            d.value = isStart ? d.valueEnd : d.valueStart;
            d.x = isStart ? d.xSimEnd : d.xSimStart;
            d.y = isStart ? d.ySimEnd : d.ySimStart;
            const currentYear = isStart ? yearB : yearA;
            const currentTotal = d3.sum(rawData.filter(d => !d.hasDefaultValue), d => d.value);
            updateTotalLabel(currentYear, currentTotal);
          });

          circles.transition()
            .duration(1000)
            .attr("r", d => radius(d.value));

          groups.transition()
            .duration(1000)
            .attr("transform", d => `translate(${d.x},${d.y})`);

          groups.select("text")
            .transition()
            .duration(1000)
            .style("font-size", d => `${radius(d.value) * 0.8}px`);
        }, 5000);
      }
    });
  }, [data, startYear, endYear, selectedRegions]);

  return (
    <div style={{ padding: '20px', position: 'relative' }}>
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
