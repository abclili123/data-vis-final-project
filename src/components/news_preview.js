import React from 'react';

const regionLinks = {
  Asia: "https://www.nbcnews.com/news/asian-america/largest-u-s-refugee-group-struggling-poverty-45-years-after-n1150031",
  Europe: "https://www.migrationpolicy.org/article/european-immigrants-united-states-2022",
  Africa: "https://www.pewresearch.org/short-reads/2017/02/14/african-immigrant-population-in-u-s-steadily-climbs/",
  "South America": "https://www.americanprogress.org/article/still-refugees-people-continue-flee-violence-latin-american-countries/",
  "North America": "https://afsc.org/news/what-i-learned-helping-migrants-us-mexico-border",
};

const RegionArticleIframe = ({ selectedRegion }) => {
  const link = regionLinks[selectedRegion];

  if (!link) return <p>No article available for this region.</p>;

  return (
    <div style={{ width: '100%', height: '600px', border: '1px solid #ccc' }}>
      <iframe
        src={link}
        title={`Article for ${selectedRegion}`}
        width="100%"
        height="100%"
        style={{ border: 'none' }}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  );
};

export default RegionArticleIframe;
