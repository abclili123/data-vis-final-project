import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const SankeyChart = ({ data, startYear, endYear, selectedRegions }) => {
  let selectedYears = [startYear, endYear]
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
    if (!data || (!startYear || !endYear) || selectedRegions.length === 0)
      return;

    const filtered = data.filter((d) => selectedRegions.includes(d.Region));

    const width = 600;
    const height = 600;
    const margin = { top: 20, right: 250, bottom: 80, left: 250 };
    const innerWidth = 300;
    const yearSpacing = innerWidth / (selectedYears.length - 1);
    const nodeWidth = 10;
    const maxBarHeight = height - margin.top - margin.bottom;

    const nodeMap = new Map();
    const nodes = [];
    const links = [];

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", width).attr("height", height);

    const offsetX = (width - innerWidth) / 2;
    const container = svg
      .append("g")
      .attr("transform", `translate(${offsetX},${margin.top})`);

    const tooltip = container
      .append("g")
      .attr("class", "tooltip")
      .style("display", "none");

    tooltip
      .append("text")
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .style("font-size", "12px")
      .style("fill", "#000");

    const yearCountryMap = new Map();

    selectedYears.forEach((year) => {
      const yearData = [];
      filtered.forEach((d) => {
        const val = parseValue(d[year], d);
        if (val > 0) {
          const name = `${d.Country} ${year}`;
          yearData.push({ name, value: val, country: d.Country, year });
        }
      });
      yearData.sort((a, b) => b.value - a.value);
      yearCountryMap.set(year, yearData);
    });

    const countryColor = d3.scaleOrdinal(d3.schemeCategory10);
    const countryY = {};

    selectedYears.forEach((year, yearIndex) => {
      const column = yearCountryMap.get(year);
      let yOffset = 0;
      column.forEach((entry) => {
        const heightScale = maxBarHeight / d3.sum(column, (d) => d.value);
        const h = entry.value * heightScale;
        const node = {
          name: entry.name,
          country: entry.country,
          year,
          value: entry.value,
          x0: yearSpacing * yearIndex,
          x1: yearSpacing * yearIndex + nodeWidth,
          y0: yOffset,
          y1: yOffset + h,
        };
        yOffset += h + 2;
        countryY[`${entry.country}_${year}`] = [node.y0, node.y1];
        nodeMap.set(entry.name, node);
        nodes.push(node);
      });
    });

    filtered.forEach((d) => {
      for (let i = 0; i < selectedYears.length - 1; i++) {
        const yearA = selectedYears[i];
        const yearB = selectedYears[i + 1];
        const valueA = parseValue(d[yearA], d);
        const valueB = parseValue(d[yearB], d);
        if (valueA > 0 && valueB > 0) {
          const source = nodeMap.get(`${d.Country} ${yearA}`);
          const target = nodeMap.get(`${d.Country} ${yearB}`);
          if (source && target) {
            links.push({ source, target, value: valueB });
          }
        }
      }
    });

    const linkGroup = container.append("g");
    const nodeGroup = container.append("g");

    let activeElement = null;

    const resetHighlight = () => {
      nodeElements.attr("fill-opacity", 1);
      linkElements.attr("stroke-opacity", 0.4);
      activeElement = null;

      tooltip.style("display", "none");
    };

    const showTooltip = (d, x, y) => {
      tooltip.select("text").text(d.source ? d.source.country : d.country);

      tooltip.attr("transform", `translate(${x},${y})`).style("display", null);

      tooltip
        .style("opacity", 0)
        .transition()
        .duration(300)
        .style("opacity", 1);

      setTimeout(() => {
        tooltip
          .transition()
          .duration(500)
          .style("opacity", 0)
          .on("end", () => tooltip.style("display", "none"));
      }, 2000);
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
      .attr("fill", (d) => countryColor(d.source.country))
      .attr("fill-opacity", 0.4)
      .on("click", function (event, d) {
        if (activeElement === d) {
          resetHighlight();
        } else {
          activeElement = d;
          linkElements.attr("stroke-opacity", (l) => (l === d ? 1 : 0.1));
          nodeElements.attr("fill-opacity", (n) =>
            n.name === d.source.name || n.name === d.target.name ? 1 : 0.1
          );

          const linkMidX = (d.source.x1 + d.target.x0) / 2;
          const linkMidY =
            ((d.source.y0 + d.source.y1) / 2 +
              (d.target.y0 + d.target.y1) / 2) /
            2;

          showTooltip(d, linkMidX, linkMidY);
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
      .attr("fill", (d) => countryColor(d.country))
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

          const nodeX = (d.x0 + d.x1) / 2;
          const nodeY = (d.y0 + d.y1) / 2;
          showTooltip(d, nodeX, nodeY);
        }
      });

    const leftNodes = nodes.filter((d) => d.year === selectedYears[0]);
    const rightNodes = nodes.filter(
      (d) => d.year === selectedYears[selectedYears.length - 1]
    );

    const leftTop10 = leftNodes
      .sort((a, b) => b.y1 - b.y0 - (a.y1 - a.y0))
      .slice(0, 10);
    const rightTop10 = rightNodes
      .sort((a, b) => b.y1 - b.y0 - (a.y1 - a.y0))
      .slice(0, 10);

    const leftCountries = new Set(leftTop10.map((d) => d.country));
    const rightCountries = new Set(rightTop10.map((d) => d.country));

    const nonTopLeft = leftNodes.filter((d) => !leftCountries.has(d.country));
    const nonTopRight = rightNodes.filter(
      (d) => !rightCountries.has(d.country)
    );

    const otherLabel = "Other";
    const otherCountry = {
      name: otherLabel,
      country: otherLabel,
      year: "Other",
      value: nonTopLeft
        .concat(nonTopRight)
        .reduce((acc, node) => acc + (node.y1 - node.y0), 0),
      x0: leftNodes[0].x0 - 50,
      x1: leftNodes[0].x1 + 50,
      y0: 0,
      y1: nonTopLeft
        .concat(nonTopRight)
        .reduce((acc, node) => acc + (node.y1 - node.y0), 0),
    };

    nodes.push(otherCountry);

    const linksFromOther = [];
    nonTopLeft.forEach((d) => {
      linksFromOther.push({
        source: otherCountry,
        target: d,
        value: d.y1 - d.y0,
      });
    });
    nonTopRight.forEach((d) => {
      linksFromOther.push({
        source: otherCountry,
        target: d,
        value: d.y1 - d.y0,
      });
    });

    links.push(...linksFromOther);

    container
      .append("g")
      .selectAll("text.year-label")
      .data(selectedYears)
      .join("text")
      .attr("class", "year-label")
      .attr("x", (d, i) => yearSpacing * i + nodeWidth / 2)
      .attr("y", maxBarHeight + 40)
      .attr("text-anchor", "middle")
      .text((d) => d);

    const labelSpacing = 14;

    leftTop10.forEach((d, i) => {
      const labelX = d.x0 - 70;
      const labelY = 40 + i * labelSpacing;

      const barHeight = d.y1 - d.y0;
      const fontSize = Math.max(6, Math.min(12, barHeight - 2));

      container
        .append("text")
        .attr("x", labelX)
        .attr("y", (d.y0 + d.y1) / 2)
        .attr("text-anchor", "end")
        .attr("alignment-baseline", "middle")
        .style("cursor", "pointer")
        .text(d.country)
        .style("font-size", `${fontSize}px`)
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

            showTooltip(d, d.x0 - 35, (d.y0 + d.y1) / 2);
          }
        })
        .on("mouseover", () => {
          nodeElements.attr("fill-opacity", (n) =>
            n.country === d.country ? 1 : 0.1
          );
          linkElements.attr("stroke-opacity", (l) =>
            l.source.country === d.country || l.target.country === d.country
              ? 1
              : 0.1
          );
        })
        .on("mouseout", () => {
          if (!activeElement) {
            nodeElements.attr("fill-opacity", 1);
            linkElements.attr("stroke-opacity", 0.4);
          }
        });

      container
        .append("line")
        .attr("x1", labelX + 10)
        .attr("y1", (d.y0 + d.y1) / 2)
        .attr("x2", d.x0)
        .attr("y2", (d.y0 + d.y1) / 2)
        .attr("stroke", "#555")
        .attr("stroke-width", 1);
    });

    rightTop10.forEach((d, i) => {
      const labelX = d.x1 + 70;
      const labelY = 40 + i * labelSpacing;

      const barHeight = d.y1 - d.y0;
      const fontSize = Math.max(6, Math.min(12, barHeight - 2));

      container
        .append("text")
        .attr("x", labelX)
        .attr("y", (d.y0 + d.y1) / 2)
        .attr("text-anchor", "start")
        .attr("alignment-baseline", "middle")
        .style("cursor", "pointer")
        .text(d.country)
        .style("font-size", `${fontSize}px`)
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

            showTooltip(d, d.x1 + 35, (d.y0 + d.y1) / 2);
          }
        })
        .on("mouseover", () => {
          nodeElements.attr("fill-opacity", (n) =>
            n.country === d.country ? 1 : 0.1
          );
          linkElements.attr("stroke-opacity", (l) =>
            l.source.country === d.country || l.target.country === d.country
              ? 1
              : 0.1
          );
        })
        .on("mouseout", () => {
          if (!activeElement) {
            nodeElements.attr("fill-opacity", 1);
            linkElements.attr("stroke-opacity", 0.4);
          }
        });

      container
        .append("line")
        .attr("x1", d.x1)
        .attr("y1", (d.y0 + d.y1) / 2)
        .attr("x2", labelX - 10)
        .attr("y2", (d.y0 + d.y1) / 2)
        .attr("stroke", "#555")
        .attr("stroke-width", 1);
    });
  }, [data, selectedYears, selectedRegions]);

  return <svg ref={svgRef}></svg>;
};

export default SankeyChart;
