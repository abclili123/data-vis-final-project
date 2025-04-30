import React, { useEffect, useRef } from 'react';
import './IntroStory.css'; // We’ll create this next

function easeOutQuad(t) {
  return t * (2 - t);
}

function animateCount(elem, target, duration, callback) {
  let startTimestamp = null;

  function step(timestamp) {
    if (!startTimestamp) startTimestamp = timestamp;
    const elapsed = timestamp - startTimestamp;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutQuad(progress);
    const value = Math.floor(eased * target);
    elem.textContent = value.toLocaleString();

    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      elem.textContent = target.toLocaleString();
      if (callback) callback();
    }
  }

  window.requestAnimationFrame(step);
}

export default function IntroStory() {
  const section1Ref = useRef();
  const section2Ref = useRef();
  const section3Ref = useRef();
  const count2022Ref = useRef();
  const count2018Ref = useRef();

  useEffect(() => {
    section1Ref.current.classList.add("visible");

    animateCount(count2022Ref.current, 14053, 4000, () => {
      setTimeout(() => {
        section2Ref.current.scrollIntoView({ behavior: 'smooth' });
        section2Ref.current.classList.add("visible");

        setTimeout(() => {
          animateCount(count2018Ref.current, 24438, 4000, () => {
            setTimeout(() => {
              section3Ref.current.scrollIntoView({ behavior: 'smooth' });
              section3Ref.current.classList.add("visible");
            }, 1500);
          });
        }, 1000);
      }, 1000);
    });
  }, []);

  return (
    <div>
      <section ref={section1Ref} className="intro-section visible">
        <h1>
          In 2022, the US had over <span ref={count2022Ref}>0</span> refugees come and seek asylum.
        </h1>
      </section>

      <section ref={section2Ref} className="intro-section">
        <h2>This is way lower than the <span ref={count2018Ref} className="highlight">0</span> people that came to the United States in 2018.</h2>
      </section>

      <section ref={section3Ref} className="intro-section">
        <h2>Keep scrolling to see some examples and then explore the data on your own.</h2>
      </section>
    </div>
  );
}
