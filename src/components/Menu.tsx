import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";

// Variable globale pour tracker l'animation en cours
let isAnimating = false;

const MenuItem = ({ text }: { text: string }) => {
  const lineRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  

  return (
    <div className="flex items-center cursor-pointer">
      <div
        ref={textRef}
        data-text
        className="hover:font-white text-[rgb(240,240,240)] text-md opacity-0 -translate-x-[10px] w-[200px] leading-3 text-right pr-4"
      >
        {text}
      </div>
      <div ref={lineRef} className="hover:bg-white h-[3px] bg-[rgb(40,40,40)] w-[30px]" />
    </div>
  );
};

const Menu = () => {
  const menuItems = [
    "Introduction",
    "Services",
    "About Us",
    "Clients & Partners",
    "Contact",
  ];

  const menuContainerRef = useRef<HTMLDivElement>(null);
  const helloRef= useRef<HTMLButtonElement>(null);
  const bOneRef=useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = menuContainerRef.current;
    const items = Array.from(container?.children || []);

    const handleMouseEnter = () => {
      if (isAnimating) return;
      isAnimating = true;

      const textElements = Array.from(
        container?.querySelectorAll("[data-text]") || []
      );

      gsap.to(items, {
        marginBottom: 15,
        duration: 0.3,
        stagger: 0.05,
        ease: "power2.out",
      });

      gsap.to(textElements, {
        opacity: 1,
        x: 0,
        duration: 0.3,
        stagger: 0.05,
        ease: "power2.out",
      });
    };

    const handleMouseLeave = () => {
      const textElements = Array.from(
        container?.querySelectorAll("[data-text]") || []
      );

      gsap.to(items, {
        marginBottom: 1,
        duration: 0.3,
        ease: "power2.out",
      });

      gsap.to(textElements, {
        opacity: 0,
        x: -10,
        duration: 0.3,
        ease: "power2.out",
        onComplete: () => {
          isAnimating = false;
        },
      });
    };

    container?.addEventListener("mouseenter", handleMouseEnter);
    container?.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container?.removeEventListener("mouseenter", handleMouseEnter);
      container?.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    gsap.fromTo(
      helloRef.current,
      {
        y: -300, // Position de départ (à gauche)
        opacity: 0,
      },
      {
        y: 0, // Position finale (position actuelle)
        opacity: 1,
        duration: 2,
        ease: "power3.out"
      }
    );

    gsap.fromTo(
      bOneRef.current,
      {
        y: -300, // Position de départ (à gauche)
        opacity: 0,
      },
      {
        y: 0, // Position finale (position actuelle)
        opacity: 1,
        duration: 2,
        ease: "power3.out"
      }
    );

    gsap.fromTo(
      menuContainerRef.current,
      {
        x: 300, // Position de départ (à gauche)
        opacity: 0,
      },
      {
        x: 0, // Position finale (position actuelle)
        opacity: 1,
        duration: 2,
        ease: "power3.out"
      }
    );

  })

  return (
    <>
      <div className="flex justify-between items-center">
        <div ref={bOneRef} className="fixed text-white top-10 left-10 text-4xl font-['Prompt']">
          B one consulting
        </div>
        <button ref={helloRef} className="w-48 h-12 fixed top-10 right-10 px-6 py-2 border border-blue-600 text-blue-600 rounded-full">
          SAY HELLO
        </button>
      </div>
      <div
        ref={menuContainerRef}
        className="fixed top-30 right-10 flex flex-col gap-0 pl-1 bg-transparent"
      >
        {menuItems.map((item, index) => (
          <MenuItem key={index} text={item} />
        ))}
      </div>
    </>
  );
};

export default Menu;
