import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const SankeyChart = ({ data, startYear, endYear, selectedRegions }) => {
  let selectedYears = [startYear, endYear];
  const svgRef = useRef();

  const parseValue = (str, d) => {
    if (typeof str === "string") {
      if (str.trim() === "D") {
        d.hasDefaultValue = true;
        return 50;
      }
      const cleaned = str.replace(/,/g, "");
      const num = +cleaned;
      return isNaN(num) ? 0 : num;
    }
    return +str || 0;
  };

  useEffect(() => {
    if (!data || !startYear || !endYear || selectedRegions.length === 0) return;

    const filtered = data.filter((d) => selectedRegions.includes(d.Region));

    const width = 875;
    const height = 600;
    const margin = { top: 20, right: 250, bottom: 80, left: 250 };
    const innerWidth = 300;
    const yearSpacing = innerWidth / (selectedYears.length - 1);
    const nodeWidth = 10;
    const maxBarHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    const offsetX = (width - innerWidth) / 2;
    const container = svg
      .append("g")
      .attr("transform", `translate(${offsetX},${margin.top})`);

    const yearData = new Map();
    const top10Countries = new Map();

    selectedYears.forEach((year) => {
      const countryValues = [];

      filtered.forEach((d) => {
        const value = parseValue(d[year], d);
        if (value > 0) {
          countryValues.push({
            country: d.Country,
            region: d.Region,
            value: value,
          });
        }
      });

      countryValues.sort((a, b) => b.value - a.value);
      yearData.set(year, countryValues);

      const top10 = countryValues.slice(0, 10);
      top10Countries.set(year, new Set(top10.map((d) => d.country)));
    });

    const nodes = [];
    const nodeMap = new Map();

    selectedYears.forEach((year, yearIndex) => {
      const yearCountries = yearData.get(year);
      const top10Set = top10Countries.get(year);

      const groupedData = [];
      let otherTotal = 0;

      yearCountries.forEach((d) => {
        if (top10Set.has(d.country)) {
          groupedData.push(d);
        } else {
          otherTotal += d.value;
        }
      });

      if (otherTotal > 0) {
        groupedData.push({
          country: "Other",
          region: "Multiple",
          value: otherTotal,
        });
      }

      const totalValue = d3.sum(groupedData, (d) => d.value);
      const heightScale = maxBarHeight / totalValue;

      let yOffset = 0;
      groupedData.forEach((d) => {
        const height = d.value * heightScale;
        const node = {
          name: `${d.country} ${year}`,
          country: d.country,
          region: d.region,
          year,
          value: d.value,
          x0: yearSpacing * yearIndex,
          x1: yearSpacing * yearIndex + nodeWidth,
          y0: yOffset,
          y1: yOffset + height,
        };

        if (d.country === "Other") {
          node.isOther = true;
        }

        nodes.push(node);
        nodeMap.set(node.name, node);
        yOffset += height + 2;
      });
    });

    const links = [];
    const linkMap = new Map();

    const getCountryCategory = (country, year) => {
      return top10Countries.get(year).has(country) ? country : "Other";
    };

    filtered.forEach((d) => {
      for (let i = 0; i < selectedYears.length - 1; i++) {
        const sourceYear = selectedYears[i];
        const targetYear = selectedYears[i + 1];

        const sourceValue = parseValue(d[sourceYear], d);
        const targetValue = parseValue(d[targetYear], d);

        if (sourceValue > 0 && targetValue > 0) {
          const sourceCategory = getCountryCategory(d.Country, sourceYear);
          const targetCategory = getCountryCategory(d.Country, targetYear);

          const sourceKey = `${sourceCategory} ${sourceYear}`;
          const targetKey = `${targetCategory} ${targetYear}`;
          const linkKey = `${sourceKey}->${targetKey}`;

          // Skip if source or target doesn't exist
          if (!nodeMap.has(sourceKey) || !nodeMap.has(targetKey)) continue;

          // Create or update link
          if (!linkMap.has(linkKey)) {
            linkMap.set(linkKey, {
              source: nodeMap.get(sourceKey),
              target: nodeMap.get(targetKey),
              value: 0,
              country: d.Country,
              sourceCategory,
              targetCategory,
            });
          }

          linkMap.get(linkKey).value += Math.min(sourceValue, targetValue);
        }
      }
    });

    links.push(...Array.from(linkMap.values()));

    const countryColor = d3.scaleOrdinal(d3.schemeCategory10);

    const getColor = (country) => {
      return country === "Other" ? "#999999" : countryColor(country);
    };

    const linkGroup = container.append("g");
    const nodeGroup = container.append("g");

    let activeElement = null;

    const resetHighlight = () => {
      nodeElements.attr("fill-opacity", 1);
      linkElements.attr("stroke-opacity", 0.4);
      activeElement = null;
    };

    const linkElements = linkGroup
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("d", (d) => {
        const x0 = d.source.x1;
        const x1 = d.target.x0;
        const y0 = (d.source.y0 + d.source.y1) / 2;
        const y1 = (d.target.y0 + d.target.y1) / 2;
        const width0 = d.source.y1 - d.source.y0;
        const width1 = d.target.y1 - d.target.y0;

        const path = `M${x0},${y0 - width0 / 2}
        C${(x0 + x1) / 2},${y0 - width0 / 2}
         ${(x0 + x1) / 2},${y1 - width1 / 2}
         ${x1},${y1 - width1 / 2}
        L${x1},${y1 + width1 / 2}
        C${(x0 + x1) / 2},${y1 + width1 / 2}
         ${(x0 + x1) / 2},${y0 + width0 / 2}
         ${x0},${y0 + width0 / 2}Z`;
        return path;
      })
      .attr("fill", (d) => getColor(d.source.country))
      .attr("fill-opacity", 0.4)
      .attr("stroke", (d) => getColor(d.source.country))
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1)
      .on("click", function (event, d) {
        if (activeElement === d) {
          resetHighlight();
        } else {
          activeElement = d;
          linkElements.attr("stroke-opacity", (l) => (l === d ? 1 : 0.1));
          nodeElements.attr("fill-opacity", (n) =>
            n.name === d.source.name || n.name === d.target.name ? 1 : 0.1
          );
        }
      });

    const nodeElements = nodeGroup
      .selectAll("rect")
      .data(nodes)
      .join("rect")
      .attr("x", (d) => d.x0)
      .attr("y", (d) => d.y0)
      .attr("width", nodeWidth)
      .attr("height", (d) => d.y1 - d.y0)
      .attr("fill", (d) => getColor(d.country))
      .attr("fill-opacity", 1)
      .on("click", function (event, d) {
        if (activeElement === d) {
          resetHighlight();
        } else {
          activeElement = d;
          nodeElements.attr("fill-opacity", (n) => (n === d ? 1 : 0.1));
          linkElements.attr("stroke-opacity", (l) =>
            l.source.name === d.name || l.target.name === d.name ? 1 : 0.1
          );
        }
      });

    container
      .append("g")
      .selectAll("text.year-label")
      .data(selectedYears)
      .join("text")
      .attr("class", "year-label")
      .attr("x", (d, i) => yearSpacing * i + nodeWidth / 2)
      .attr("y", maxBarHeight + 40)
      .attr("text-anchor", "middle")
      .style("font-size", "20px")
      .style("font-weight", "bold")
      .text((d) => d);

    selectedYears.forEach((year, yearIndex) => {
      const yearNodes = nodes.filter((d) => d.year === year);

      const labelX = yearIndex === 0 ? -10 : innerWidth + 20;
      const textAnchor = yearIndex === 0 ? "end" : "start";

      yearNodes.forEach((d) => {
        if (d.y1 - d.y0 < 5) return;

        const barHeight = d.y1 - d.y0;
        const fontSize = Math.max(6, Math.min(12, barHeight - 2));

        container
          .append("text")
          .attr(
            "x",
            d.x0 +
              (yearIndex === 0 ? 0 : nodeWidth) +
              (yearIndex === 0 ? -10 : 10)
          )
          .attr("y", (d.y0 + d.y1) / 2)
          .attr("text-anchor", textAnchor)
          .attr("alignment-baseline", "middle")
          .style("cursor", "pointer")
          .style("font-size", `${fontSize}px`)
          .style("font-weight", d.country === "Other" ? "normal" : "bold")
          .text(() => {
            if (d.country === "Other") return "Other";
            return `${d.country} (${d3.format(",")(d.value)})`;
          })
          .on("click", () => {
            if (activeElement === d) {
              resetHighlight();
            } else {
              activeElement = d;
              nodeElements.attr("fill-opacity", (n) =>
                n.country === d.country ? 1 : 0.1
              );
              linkElements.attr("stroke-opacity", (l) =>
                l.source.country === d.country || l.target.country === d.country
                  ? 1
                  : 0.1
              );
            }
          });
      });
    });
  }, [data, startYear, endYear, selectedRegions]);

  return <svg ref={svgRef}></svg>;
};

export default SankeyChart;
