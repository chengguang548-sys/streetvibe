import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

interface Slide {
  id: number;
  bgGradient: string;
  image: string;
  titleBg: string; // The huge display title behind the model
  tagline: string;
  description: string;
  categoryLink: string;
}

export default function HeroSlider() {
  const navigate = useNavigate();
  const [activeSlide, setActiveSlide] = useState(0);

  const slides: Slide[] = [
    {
      id: 1,
      bgGradient: 'bg-gradient-to-b from-[#B8E1F0] via-[#DCEFF7] to-white',
      image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80', // Premium man model
      titleBg: 'STREETVIBE',
      tagline: 'Inspired by nature. Designed for movement.',
      description: 'Style that rises above the ordinary. Discover our all-season linen layers.',
      categoryLink: '/shop/shirts'
    },
    {
      id: 2,
      bgGradient: 'bg-gradient-to-b from-[#DCEFF7] via-white to-[#F3F6F8]',
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80', // Tailored overcoat/jacket look
      titleBg: 'TAILORED',
      tagline: 'Clean lines. Sophisticated silhouettes.',
      description: 'Meticulously crafted for the contemporary explorer.',
      categoryLink: '/shop/pants'
    },
    {
      id: 3,
      bgGradient: 'bg-gradient-to-b from-[#B8E1F0] via-brand-off to-white',
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80', // Minimalist sneaker silhouette
      titleBg: 'ESSENTIALS',
      tagline: 'Walk with structural comfort.',
      description: 'Low-top raw-grain calfskin leather trainers backed by Ortholite cushions.',
      categoryLink: '/shop/shoes'
    }
  ];

  // Auto Slider Interval
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const handlePrev = () => {
    setActiveSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const current = slides[activeSlide];

  return (
    <div className="relative w-full h-[620px] sm:h-[680px] md:h-[750px] overflow-hidden bg-brand-white select-none border-b border-brand-off">
      {/* Background slide transitions */}
      <div className={`absolute inset-0 transition-all duration-1000 ease-in-out ${current.bgGradient}`}>
        {/* Subtle mountain outline backdrop for style */}
        <div className="absolute inset-0 opacity-10 bg-cover bg-center pointer-events-none mix-blend-overlay" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=40')" }}></div>
        
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 md:px-8 relative flex flex-col justify-between pt-6 pb-0 md:py-0 md:flex-row md:justify-between md:items-center">
          
          {/* HUGE TEXT BLOCK BEHIND THE PHOTO (ELEVATE references design setup) */}
          <div className="absolute top-1/4 md:top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none overflow-hidden select-none">
            <h1 className="text-[14vw] md:text-[12vw] font-black tracking-widest text-[#FFFFFF] font-montserrat leading-none opacity-40 select-none">
              {current.titleBg}
            </h1>
          </div>

          {/* Left Text Detail Column */}
          <div className="w-full md:w-1/2 text-center md:text-left z-10 mt-8 mb-4 md:my-0 flex flex-col items-center md:items-start px-2 sm:px-4 md:px-0">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] font-montserrat font-extrabold text-brand-gray mb-2 sm:mb-3 leading-none">
              StreetVibe Signature Edit
            </p>
            <h2 className="text-[24px] xs:text-[28px] sm:text-3xl md:text-5xl font-black font-montserrat text-brand-charcoal tracking-tight mb-3 sm:mb-4 max-w-sm sm:max-w-md md:max-w-lg leading-[1.15] md:leading-tight">
              {current.tagline}
            </h2>
            <p className="text-xs sm:text-sm md:text-md text-brand-gray max-w-xs sm:max-w-md font-medium mb-6 md:mb-8 leading-relaxed">
              {current.description}
            </p>
            <div className="flex flex-col space-y-2.5 sm:space-y-0 sm:flex-row sm:space-x-4 w-full max-w-[280px] xs:max-w-[320px] sm:max-w-none">
              <button 
                onClick={() => navigate(current.categoryLink)}
                className="w-full sm:w-auto bg-brand-charcoal text-white font-montserrat font-bold text-xs uppercase px-8 py-3.5 tracking-widest rounded shadow-md hover:bg-brand-gray transition-all active:scale-[0.98] cursor-pointer"
              >
                Explore Collection
              </button>
              <button 
                onClick={() => navigate('/shop')}
                className="w-full sm:w-auto border border-brand-charcoal text-brand-charcoal bg-transparent font-montserrat font-bold text-xs uppercase px-8 py-3.5 tracking-widest rounded hover:bg-brand-charcoal hover:text-white transition-all active:scale-[0.98] cursor-pointer"
              >
                Shop Now
              </button>
            </div>
          </div>

          {/* Right Floating Model Image Column */}
          <div className="w-full md:w-1/2 h-[240px] sm:h-[300px] md:h-[620px] relative flex justify-center items-end overflow-hidden z-10">
            <img 
              src={current.image} 
              alt="Fashion Model representation" 
              className="h-full object-contain object-bottom transition-all duration-[1000ms] scale-100 transform translate-y-1 hover:scale-105"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>

      {/* Slide Navigation Arrows */}
      <button 
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-brand-charcoal p-2.5 rounded-full border border-brand-off/30 transition-all z-20 focus:outline-none hidden md:block"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button 
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/70 hover:bg-white text-brand-charcoal p-2.5 rounded-full border border-brand-off/30 transition-all z-20 focus:outline-none hidden md:block"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Bottom pagination Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2.5 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setActiveSlide(index)}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 focus:outline-none ${
              activeSlide === index ? 'bg-brand-charcoal w-6' : 'bg-brand-gray/30 hover:bg-brand-gray/70'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          ></button>
        ))}
      </div>
    </div>
  );
}
