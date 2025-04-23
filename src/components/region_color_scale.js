// region_color_scale.js
import * as d3 from 'd3';

const regionColorScale = d3.scaleOrdinal()
  .domain(['Asia', 'Europe', 'Africa', 'South America', 'North America', 'Oceania'])
  .range(['#1f78b4', '#33a02c', '#e31a1c', '#ff7f00', '#6a3d9a', '#b15928']);

export default regionColorScale;
