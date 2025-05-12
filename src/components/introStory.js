import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function IntroStory() {
  const sectionsRef = useRef([]);
  const spanRefs = useRef([]);
  const bgRef = useRef();

  const counts = [14053, 24438];
  const hasAnimated = useRef(counts.map(() => false));

  useEffect(() => {
    const handleScroll = () => {
      sectionsRef.current.forEach((section, i) => {
        const span = spanRefs.current[i];
        if (!span || hasAnimated.current[i]) return;

        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;

        if (scrollY + windowHeight > sectionTop && scrollY < sectionTop + sectionHeight) {
          const scrollProgress = Math.min(1, Math.max(0, (scrollY + windowHeight - sectionTop) / windowHeight));
          const value = Math.floor(scrollProgress * counts[i]);
          span.textContent = value.toLocaleString();

          if (value >= counts[i]) {
            hasAnimated.current[i] = true;
            span.textContent = counts[i].toLocaleString();
          }
        }
      });

      // Background circles
      const svg = d3.select(bgRef.current);
      const colors = ['#F77F00', '#90BE6D', '#277DA1', '#F94144', '#F9C74F'];
      const scrollY = window.scrollY;

      if (scrollY % 50 < 5) { // Throttle: every ~100px
        const cx = Math.random() * window.innerWidth;
        const cy = scrollY + Math.random() * window.innerHeight;
        const r = Math.random() * 40 + 5;
        const color = colors[Math.floor(Math.random() * colors.length)];

        svg.append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 0)
          .attr('fill', color)
          .attr('fill-opacity', 0.15)
          .transition()
          .duration(1000)
          .attr('r', r)
          .attr('fill-opacity', 0.4);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <svg
        ref={bgRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '300%',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <section
          style={{
            height: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div
          style={{
            width: '40%'
          }}
          >
          <h1>
            The United States has a long history with immigration, making
            diversity a pillar of American identity. For centuries, people from
            all over the world have traveled here in pursuit of the "American Dream."
          </h1>
           <h1>A better life.</h1>
          <h1>
            It is America's role to be a safe haven. 
            Accepting and supporting refugees fleeing from war, persecution, and natural disaster
            reflects our foundational value of freedom for all. In this time of uncertainty and 
            hostility towards immigrants, it is important to reflect on this history. 
          </h1>
          </div>
        </section>

        <section
          ref={el => (sectionsRef.current[0] = el)}
          style={{
            height: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <h1 style={{ fontWeight: 'bold' }}>
            In 2022, the US had over <span ref={el => (spanRefs.current[0] = el)}>0</span> refugees come and seek asylum.
          </h1>
        </section>

        <section
          ref={el => (sectionsRef.current[1] = el)}
          style={{
            height: '30vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <h1 style={{ fontWeight: 'bold' }}>
            This is way lower than the <span ref={el => (spanRefs.current[1] = el)}>0</span> people that came to the United States in 2018.
          </h1>
        </section>

        <section
          style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <h2>Keep scrolling to see some examples and then explore the data on your own.</h2>
        </section>
      </div>
    </div>
  );
}
