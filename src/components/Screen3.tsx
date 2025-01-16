import React, { useEffect, useRef,useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import ScrollToPlugin from 'gsap/ScrollToPlugin';
gsap.registerPlugin(ScrollTrigger);

export default function Screen3() {

  const [val1,setVal1]=useState(0)

  useEffect(() => {
    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    // Select elements
    const element = document.querySelector("#screen3");

    if (!element ) {
      console.warn("Required elements not found");
      return;
    }

    // Create the scroll trigger animation
    const scrollTrigger = ScrollTrigger.create({
      trigger: element,
      start: "top center",
      end: "bottom center",
      // markers:true,
      onEnter: () => {
        gsap.to(window, {
          scrollTo: {
            y: element.offsetTop,
            offsetY: 0
          },
          duration: 1
        });
        //   const intervalId = setInterval(function() {
        //     if (val1<11) {
        //       setVal1(val1+1)
        //         // your code here
        //     } else {
        //         clearInterval(intervalId); // stop if condition is false
        //     }
        // }, 1000);
      }
    });

    // Cleanup function
    return () => {
      scrollTrigger.kill();
    };
  }, []);
  
  return (
    <div id="screen3" className="w-full h-screen flex items-center justify-center font-['Prompt']">
      <div className="flex flex-col w-1/4 text-white  flex items-center justify-center">
        <span  className="text-2xl text-center font-bold pr-4 xl:text-6xl">
          {val1}
        </span>
        <span className="pt-2  text-base text-center xl:text-2xl">
          years experience
        </span>
      </div>
      <div className="flex flex-col w-1/4 text-white  flex items-center justify-center">
        <span className="text-base text-center font-bold pr-4 xl:text-6xl">
          +1000
        </span>
        <span className="pt-2 text-base text-center xl:text-2xl">projects</span>
      </div>

      <div className="flex text-2xl xl:text-2xl w-1/4 text-white flex flex-col items-center justify-center">
        <span className="text-4xl text-center font-bold xl:text-6xl">4</span>
        <span className="pt-2  text-base text-center xl:text-2xl">
          continents
        </span>
      </div>
      <div className="flex flex-col w-1/4 text-white flex items-center justify-center">
        <span className="text-base text-center font-bold xl:text-6xl">
          100%
        </span>
        <span className="pt-2  text-base text-center xl:text-2xl">
          satisfied customers
        </span>
      </div>
    </div>
  );
}


export function Screen4() {

  useEffect(() => {
    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    // Select elements
    const element = document.querySelector("#screen4");

    if (!element ) {
      console.warn("Required elements not found");
      return;
    }

    // Create the scroll trigger animation
    const scrollTrigger = ScrollTrigger.create({
      trigger: element,
      start: "top center",
      end: "bottom center",
      // markers:true,
      onEnter: () => {
        gsap.to(window, {
          scrollTo: {
            y: element.offsetTop,
            offsetY: 0
          },
          duration: 1
        });
      }
    });

    // Cleanup function
    return () => {
      scrollTrigger.kill();
    };
  }, []);

  return (
    <div id="screen4" className="relative w-full bg-white h-screen  items-center justify-end ">
      <div className="absolute w-1/3 top-1/3 left-30 text-black font-['Prompt'] pt-3">
        <span className="italic"> For over a decade </span>B one consulting has
        been a driving force in the business consulting leaving a lasting mark
        across <span>four continents.</span>
        From our roots in <span className="italic"> Paris </span> to our
        expansion to <span className="italic"> Dubai and Bali </span>
        our journey has been defined by a{" "}
        <span className="italic"> legacy of excellence </span>. We've
        orchestrated strategic transformations and delivered impactful solutions
        globally, combining a{" "}
        <span className="italic">
          worlwide perspective with local expertise
        </span>
        With a footprint on four continents, we continue to lead businesses
        towards new heights of{" "}
        <span className="italic">innovation and growth.</span>
      </div>
    </div>
  );
}

export function Screen5() {

  useEffect(() => {
    // Register GSAP plugins
    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    // Select elements
    const element = document.querySelector("#screen5");

    if (!element ) {
      console.warn("Required elements not found");
      return;
    }

    // Create the scroll trigger animation
    const scrollTrigger = ScrollTrigger.create({
      trigger: element,
      start: "top center",
      end: "bottom center",
      // markers:true,
      onEnter: () => {
        gsap.to(window, {
          scrollTo: {
            y: element.offsetTop,
            offsetY: 0
          },
          duration: 1
        });
      }
    });

    // Cleanup function
    return () => {
      scrollTrigger.kill();
    };
  }, []);

  return (
    <div id="screen5" className="relative w-full  h-screen  items-center justify-end text-white font-['Prompt']">
      <div className="absolute w-1/3 top-1/3 right-30 text-white font-['Prompt'] text-xl pt-3">
        "At B One Consulting,{" "}
        <span className="italic">
          {" "}
          client-centricity is our guidind principle{" "}
        </span>
        . We prioritize{" "}
        <span className="italic">
          {" "}
          transparency, open communication, and close collaboration{" "}
        </span>
        , placing our clients at the center of every decision. Our commitment to
        proximity ensures that we're always where you need us, providing the{" "}
        <span className="italic"> support </span> and{" "}
        <span className="italic"> expertise </span> you can rely on." <br />
        Adnane Thari <br /> Founder
      </div>
    </div>
  );
}

