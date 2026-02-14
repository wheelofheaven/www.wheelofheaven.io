// Timeline Immersive Experience
document.addEventListener("DOMContentLoaded", function () {
  console.log("=== TIMELINE SCRIPT LOADED ===");

  // Get all DOM elements
  const ageCard = document.getElementById("age-card");
  const ageSymbol = document.getElementById("age-symbol");
  const ageTitle = document.getElementById("age-title");
  const ageTimespan = document.getElementById("age-timespan");
  const ageDescription = document.getElementById("age-description");
  const ageLink = document.getElementById("age-link");
  const ageImages = document.getElementById("age-card-images");
  const progressSegments = document.getElementById("age-progress-segments");
  const earthContainer = document.querySelector(".earth-container");
  const navPrev = document.getElementById("nav-prev");
  const navNext = document.getElementById("nav-next");
  // Removed selectorTrigger - now using progressSegments for dropdown
  const selectorDropdown = document.getElementById("age-selector-dropdown");

  let currentAgeIndex = 0;
  let isTransitioning = false;

  // Age data
  const agesData = [
    {
      name: "In the beginning...",
      symbol: "✦",
      color: "yellow",
      start: "−23970",
      end: "−21810",
      event:
        "Before time began, in the vast expanse of the cosmos, the Elohim civilization flourished. Advanced beings who mastered science and creation, they would soon discover our world and begin the greatest experiment in galactic history.",
      link: "/timeline/in-the-beginning",
      images: [
        "/images/ages/modern-urban-landscape.avif",
        "/images/ages/saurian-experiments.avif",
      ],
      earth_texture: "https://assets.wheelofheaven.io/images/earth/earth-ocean-mist.webp",
    },
    {
      name: "Age of Capricorn",
      symbol: "♑",
      color: "mauve",
      start: "−21810",
      end: "−19650",
      event:
        "Synthetic life engineering on the Elohim home planet with the inevitable escape of synthetic 'monster' lifeforms. Earth discovered, exploration. Known as the 1st day of Creation (Genesis)",
      link: "/timeline/age-of-capricorn",
      images: ["/images/ages/spacecraft-in-orbit.avif"],
      earth_texture: "https://assets.wheelofheaven.io/images/earth/earth-ocean-mist.webp",
    },
    {
      name: "Age of Sagittarius",
      symbol: "♐",
      color: "blue",
      start: "−19650",
      end: "−17490",
      event:
        "Study and analysis of Earth's atmosphere and its constitution and the harmfulness of the sun light. Known as the 2nd day of Creation (Genesis)",
      link: "/timeline/age-of-sagittarius",
      images: ["/images/ages/orbital-outpost.avif"],
      earth_texture: "https://assets.wheelofheaven.io/images/earth/earth-ocean-blue.webp",
    },
    {
      name: "Age of Scorpio",
      symbol: "♏",
      color: "cyan",
      start: "−17490",
      end: "−15330",
      event:
        "Terraforming and first synthetic life engineering adapted to the new planet (Earth); creation of prokaryotes, fungi, plant life and most likely insects. Known as the 3rd day of Creation (Genesis)",
      link: "/timeline/age-of-scorpio",
      images: ["/images/ages/genetic-research-lab.avif"],
      earth_texture: "https://assets.wheelofheaven.io/images/earth/earth-pangeae-arid.webp",
    },
    {
      name: "Age of Libra",
      symbol: "♎",
      color: "teal",
      start: "−15330",
      end: "−13170",
      event:
        "Astronomy, measure of time, adaptation of life to Earth environment. Engineering of fish and bird life, as well as dragons, known to us as dinosaurs. Known as the 4th day of Creation (Genesis)",
      link: "/timeline/age-of-libra",
      images: ["/images/ages/fauna-and-flora.avif"],
      earth_texture: "https://assets.wheelofheaven.io/images/earth/earth-pangeae-green.webp",
    },
    {
      name: "Age of Virgo",
      symbol: "♍",
      color: "mint",
      start: "−13170",
      end: "−11010",
      event:
        "Engineering of all types of land animals, mammals, reptiles. Everything was done to keep things in balance/ecology. Known as the 5th day of Creation (Genesis)",
      link: "/timeline/age-of-virgo",
      images: ["/images/ages/dinosaurs-on-plain.avif"],
      earth_texture: "https://assets.wheelofheaven.io/images/earth/earth-pangeae-green.webp",
    },
    {
      name: "Age of Leo",
      symbol: "♌",
      color: "green",
      start: "−11010",
      end: "−8850",
      event:
        "First Earthly humans engineered. Lived as primitive among the Elohim. Weren't allowed to learn about their cosmic origins. Known as the 6th day of Creation (Genesis)",
      link: "/timeline/age-of-leo",
      images: [
        "/images/ages/genetic-research-lab.avif",
        "/images/ages/saurian-experiments.avif",
      ],
      earth_texture: "https://assets.wheelofheaven.io/images/earth/earth-pangeae-green.webp",
    },
    {
      name: "Age of Cancer",
      symbol: "♋",
      color: "yellow",
      start: "−8850",
      end: "−6690",
      event:
        "The Elohim rebel group known as the Serpent/Dragon was banished to remain on Earth after they taught the Earthlings about their cosmic origins. They conceived offsprings with the humans, creating the first hybrids. Known as the 7th day of Creation (Genesis) of Rest.",
      link: "/timeline/age-of-cancer",
      images: ["/images/ages/blue-planet-surface.avif"],
      earth_texture: "https://assets.wheelofheaven.io/images/earth/earth-pangeae-green.webp",
    },
    {
      name: "Age of Gemini",
      symbol: "♊",
      color: "pink",
      start: "−6690",
      end: "−4530",
      event:
        "The Elohim government didn't like the events on Earth, so they were planning to destroy life on Earth. The banished faction among with Noah build a spaceship to escape the planet, known as Noah's Ark. When the flood-inducing weaponry hit Earth, life was preserved on the Ark in orbit around the planet. After the flood, Noah's Ark landed on Earth and reseeded Earth with the help of the Elohim survivors. Creation of a huge space rocket, the Tower of Babel. War in Heaven among the Elohim factions.",
      link: "/timeline/age-of-gemini",
      images: [
        "/images/ages/above-the-clouds-structure.avif",
        "/images/ages/orbital-outpost.avif",
      ],
      earth_texture: "https://assets.wheelofheaven.io/images/earth/earth-ocean-blue.webp",
    },
    {
      name: "Age of Taurus",
      symbol: "♉",
      color: "soft-pink",
      start: "−4530",
      end: "−2370",
      event:
        "Destruction of the center of progress such as Sodom and Gomorrah. The Serpentine Elohim faction lost and was pardoned, so they returned back to their home planet. The public opinion about life on Earth got favorable. Events of Abraham.",
      link: "/timeline/age-of-taurus",
      images: [],
      earth_texture: "https://assets.wheelofheaven.io/images/earth/earth-ocean-blue.webp",
    },
    {
      name: "Age of Aries",
      symbol: "♈",
      color: "lavender",
      start: "−2370",
      end: "−210",
      event: "Events of Moses and Exodus",
      earth_texture: "https://assets.wheelofheaven.io/images/earth/earth-ocean-blue.webp",
      link: "/timeline/age-of-aries",
      images: [],
    },
    {
      name: "Age of Pisces",
      symbol: "♓",
      color: "mauve",
      start: "−210",
      end: "1945",
      event:
        "Jesus and his fishermen, multiplication of people, increase of demographics, independent development.",
      link: "/timeline/age-of-pisces",
      images: [],
      earth_texture: "https://assets.wheelofheaven.io/images/earth/earth-ocean-blue.webp",
    },
    {
      name: "Age of Aquarius",
      symbol: "♒",
      color: "blue",
      start: "1945",
      end: "4110",
      event:
        "Revelation of our cosmic origins, the last prophet, the avoiding of the nuclear holocaust/destroying our civilization, Golden Age is awaiting, the return of our father in Heaven, our creators, the Elohim",
      link: "/timeline/age-of-aquarius",
      images: [],
      earth_texture: "https://assets.wheelofheaven.io/images/earth/earth-ocean-blue.webp",
    },
  ];

  // Color mapping
  // Earth texture management - cross-fade between two SVG layers
  let currentEarthTexture = null;
  let earthLayerFront = "A";

  function updateEarthTexture(newTexturePath) {
    if (!newTexturePath || newTexturePath === currentEarthTexture) return;

    const nextId = earthLayerFront === "A" ? "B" : "A";
    const nextPattern = document.querySelector(
      `#earthTexture${nextId} image`,
    );
    const nextCircle = document.querySelector(
      `.earth-layer--${nextId.toLowerCase()}`,
    );

    if (nextPattern && nextCircle) {
      // Preload the texture so it's cached before we start the cross-fade
      const preloader = new Image();
      preloader.onload = function () {
        // Apply the new texture to the incoming layer
        nextPattern.setAttribute("href", newTexturePath);

        // Move the incoming layer on top in SVG paint order
        nextCircle.parentNode.appendChild(nextCircle);

        // Reset to hidden instantly (no transition)
        nextCircle.style.transition = "none";
        nextCircle.style.opacity = "0";
        // Force the browser to commit opacity:0 (offsetWidth doesn't work for SVG)
        window.getComputedStyle(nextCircle).opacity;

        // Fade in over 1s — the old layer stays at opacity 1 underneath,
        // so the earth is never transparent during the cross-dissolve
        nextCircle.style.transition = "opacity 1s ease";
        nextCircle.style.opacity = "1";

        earthLayerFront = nextId;
        currentEarthTexture = newTexturePath;
        console.log("Earth texture cross-fade to:", newTexturePath);
      };
      preloader.src = newTexturePath;
    }
  }

  const colorMap = {
    yellow: "#fbf8cc",
    pink: "#fde4cf",
    "soft-pink": "#ffcfd2",
    lavender: "#f1c0e8",
    mauve: "#cfbaf0",
    blue: "#a3c4f3",
    cyan: "#90dbf4",
    teal: "#8eecf5",
    mint: "#98f5e1",
    green: "#b9fbc0",
  };

  // Starmap SVG aspect ratio (864×432 = 2:1)
  const STARMAP_ASPECT_RATIO = 864 / 432;

  // Update starmap position based on current age - align constellations with Earth
  function updateStarmapPosition(customPosition = null) {
    const starmapBackground = document.getElementById("starmap-background");
    const timelineContent = document.getElementById("timeline-content");

    if (starmapBackground && timelineContent) {
      const position =
        customPosition !== null ? customPosition : currentAgeIndex;

      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        // Mobile: starmap is 300% wide, slide it left via translateX
        // Each age shifts by a fraction of the extra width (200% of viewport)
        const shiftPercent = (position / (agesData.length - 1)) * -200;
        starmapBackground.style.transform = `translateX(${shiftPercent}vw)`;
      } else {
        // Desktop: clear any mobile transform on the starmap
        starmapBackground.style.transform = "";

        // Timeline moves horizontally through ages (each age is 100vw)
        const timelineTransform = -(position * 100);
        timelineContent.style.transform = `translateX(${timelineTransform}vw)`;

        // Starmap: rendered at auto × 100vh, so width = viewportHeight × aspectRatio
        // One full image = one zodiac cycle. Repeat-x handles seamless tiling.
        const imageWidth = window.innerHeight * STARMAP_ASPECT_RATIO;
        const stepSize = imageWidth / 13;

        // Align constellations with Earth (at 30% of viewport width)
        const earthX = window.innerWidth * 0.30;
        const bgX = earthX - (position * stepSize);

        starmapBackground.style.backgroundPosition = `${bgX}px center`;
      }

      if (customPosition === null) {
        console.log(
          `Age ${currentAgeIndex + 1}/${agesData.length}: Starmap position updated`,
        );
      }
    }
  }

  // Update age function
  function updateAge(index, animated = true) {
    if (index < 0 || index >= agesData.length) return;
    if (isTransitioning && animated) return;

    const age = agesData[index];
    const color = colorMap[age.color] || "#a3c4f3";

    if (animated && currentAgeIndex !== index) {
      isTransitioning = true;
      ageCard.style.opacity = "0.7";

      setTimeout(() => {
        updateCardContent(age, color, index);
        ageCard.style.opacity = "1";
        setTimeout(() => {
          isTransitioning = false;
        }, 150);
      }, 100);
    } else {
      updateCardContent(age, color, index);
    }

    currentAgeIndex = index;

    // Reset scroll accumulator when age changes programmatically
    scrollAccumulator = 0;
    scrollResistanceCount = 0;
    lastScrollTime = 0;

    updateStarmapPosition();

    // Note: positionElementsBelowCard was removed — no longer needed
  }

  // Update card content
  function updateCardContent(age, color, index) {
    // Update earth texture
    if (age.earth_texture) {
      updateEarthTexture(age.earth_texture);
    }

    // Update text content
    ageSymbol.textContent = age.symbol;
    ageTitle.textContent = age.name;
    ageDescription.textContent = age.event;
    ageLink.href = age.link;

    // Format timespan
    const startYear = Math.abs(parseInt(age.start.replace("−", "")));
    const endYear = Math.abs(parseInt(age.end.replace("−", "")));
    const startSuffix = age.start.startsWith("−") ? " BC" : " AD";
    const endSuffix = age.end.startsWith("−") ? " BC" : " AD";

    ageTimespan.textContent = `${startYear.toLocaleString()}${startSuffix} → ${endYear.toLocaleString()}${endSuffix}`;

    // Update colors
    ageCard.style.setProperty("--age-color", color);

    const linkElement = ageCard.querySelector(".age-card__link");
    if (linkElement) {
      linkElement.style.background = `linear-gradient(135deg, ${color}, ${color}99)`;
    }

    // Update progress segments
    if (progressSegments) {
      const segments = progressSegments.querySelectorAll(
        ".age-progress__segment",
      );
      segments.forEach((segment, segmentIndex) => {
        if (segmentIndex === index) {
          segment.classList.add("age-progress__segment--active");
          segment.style.setProperty("--age-color", color);
          segment.style.background = color;
          segment.style.boxShadow = `0 0 16px ${color}, inset 0 1px 0 rgba(255, 255, 255, 0.3)`;
        } else {
          segment.classList.remove("age-progress__segment--active");
          segment.style.background = "";
          segment.style.boxShadow = "";
        }
      });

      console.log(
        `Progress bar updated: ${segments.length} segments, active: ${index}`,
      );
    } else {
      console.log("Progress segments element not found");
    }

    // Update images
    if (ageImages && age.images && age.images.length > 0) {
      ageImages.innerHTML = "";
      age.images.forEach((imageSrc) => {
        const img = document.createElement("img");
        img.src = imageSrc;
        img.alt = `${age.name} illustration`;
        img.className = "age-card__image";

        // Handle image load errors gracefully
        img.onerror = function () {
          this.style.display = "none";
        };

        ageImages.appendChild(img);
      });
    } else if (ageImages) {
      // Clear images if none are available
      ageImages.innerHTML = "";
    }

    // Update navigation buttons
    navPrev.disabled = index === 0;
    navNext.disabled = index === agesData.length - 1;
  }

  // Navigation button handlers — use both click and touchend for mobile compat
  function handlePrevAction(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log("PREV button triggered via", e.type);
    if (currentAgeIndex > 0) {
      updateAge(currentAgeIndex - 1, true);
    }
  }

  function handleNextAction(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log("NEXT button triggered via", e.type);
    if (currentAgeIndex < agesData.length - 1) {
      updateAge(currentAgeIndex + 1, true);
    }
  }

  if (navPrev) {
    navPrev.addEventListener("click", handlePrevAction);
    navPrev.addEventListener("touchend", handlePrevAction);
  }

  if (navNext) {
    navNext.addEventListener("click", handleNextAction);
    navNext.addEventListener("touchend", handleNextAction);
  }

  // Age selector dropdown (triggered by progress bar clicks)
  const ageProgressContainer = document.querySelector(".age-progress");
  if (ageProgressContainer && progressSegments && selectorDropdown) {
    // Smart click handler for progress bar area
    ageProgressContainer.addEventListener("click", (e) => {
      // Check if we clicked on a specific segment
      if (e.target.classList.contains("age-progress__segment")) {
        // Get the segment index and go directly to that age
        const segmentIndex = parseInt(e.target.dataset.segment);
        if (!isNaN(segmentIndex) && segmentIndex < agesData.length) {
          updateAge(segmentIndex, true);
          selectorDropdown.classList.remove("age-selector__dropdown--open");
        }
      } else {
        // Clicked on the background/container - open dropdown
        selectorDropdown.classList.toggle("age-selector__dropdown--open");
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".age-progress")) {
        selectorDropdown.classList.remove("age-selector__dropdown--open");
      }
    });

    // Age selector options
    document.querySelectorAll(".age-selector__option").forEach((option) => {
      option.addEventListener("click", (e) => {
        e.preventDefault();
        const targetIndex = parseInt(option.dataset.ageIndex);
        updateAge(targetIndex, true);
        selectorDropdown.classList.remove("age-selector__dropdown--open");
      });
    });
  }

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      if (navPrev) navPrev.click();
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      if (navNext) navNext.click();
    }
  });

  // Keep Earth stationary for constellation alignment (desktop only)
  // On mobile, CSS uses translateX(-50%) without Y shift
  if (earthContainer && window.innerWidth > 768) {
    earthContainer.style.transform = `translate(-50%, -50%)`;
  }

  // Timeline progression state
  let hasCompletedAllAges = false;
  let isVerticalScrolling = false;
  let scrollResistanceCount = 0;
  const SCROLL_RESISTANCE_THRESHOLD = 15; // Require 15 scroll attempts at end

  // Simple scroll weight system with time-based throttling
  let scrollAccumulator = 0;
  const SCROLL_WEIGHT_THRESHOLD = 5; // Require 5 scroll events to change age
  let lastScrollTime = 0;
  const SCROLL_THROTTLE_MS = 200; // Minimum time between scroll counts (ms)

  function handleWheelScroll(event) {
    if (isTransitioning) return;

    if (!isVerticalScrolling) {
      event.preventDefault();

      const currentTime = Date.now();

      // Special handling for Age of Aquarius - don't throttle resistance scrolls
      if (currentAgeIndex === agesData.length - 1 && event.deltaY > 0) {
        scrollResistanceCount++;
        console.log(
          `Age of Aquarius resistance: ${scrollResistanceCount}/${SCROLL_RESISTANCE_THRESHOLD}`,
        );

        if (scrollResistanceCount >= SCROLL_RESISTANCE_THRESHOLD) {
          hasCompletedAllAges = true;
          isVerticalScrolling = true;
          scrollResistanceCount = 0;
          console.log("Enabling vertical scroll from Age of Aquarius!");
          hideTimelineElements();
          unlockScroll();
          // No auto-scroll — user's continued scrolling reveals world-ages
          // section naturally. They can also scroll back up to return.
        }
        return; // Don't process this scroll for normal movement
      }

      // Only count scroll if enough time has passed since last scroll
      if (currentTime - lastScrollTime < SCROLL_THROTTLE_MS) {
        console.log(`Scroll throttled - too fast!`);
        return;
      }

      lastScrollTime = currentTime;

      if (event.deltaY > 0) {
        // Forward scroll
        scrollAccumulator++;
        console.log(
          `Forward scroll: ${scrollAccumulator}/${SCROLL_WEIGHT_THRESHOLD}`,
        );

        if (scrollAccumulator >= SCROLL_WEIGHT_THRESHOLD) {
          if (currentAgeIndex < agesData.length - 1) {
            updateAge(currentAgeIndex + 1, true);
          }
          scrollAccumulator = 0;
        }
      } else {
        // Backward scroll
        scrollAccumulator--;
        console.log(
          `Backward scroll: ${Math.abs(scrollAccumulator)}/${SCROLL_WEIGHT_THRESHOLD}`,
        );

        if (scrollAccumulator <= -SCROLL_WEIGHT_THRESHOLD) {
          if (currentAgeIndex > 0) {
            updateAge(currentAgeIndex - 1, true);
          }
          scrollAccumulator = 0;
        }
      }
    }
  }

  // Handle vertical scrolling after completing timeline
  // The world-ages-section (z-index: 2) naturally covers the fixed timeline
  // elements (inside timeline-section z-index: 1 stacking context) as it
  // scrolls into view — no opacity manipulation needed.
  function handleRegularScroll() {
    if (isVerticalScrolling) {
      const scrollY = window.scrollY;

      // Allow scrolling back into timeline when at the top
      if (scrollY <= 10) {
        isVerticalScrolling = false;
        hasCompletedAllAges = false;
        scrollResistanceCount = 0;
        scrollAccumulator = 0;
        lastScrollTime = 0;
        mobileScrollResistance = 0;
        window.scrollTo(0, 0);
        showTimelineElements();
        lockScroll();
        console.log("Returned to timeline - horizontal scrolling re-enabled");
      }
    } else {
      // Force scroll to top while in timeline mode — iOS Safari ignores
      // overflow: hidden on html/body, so this is the fallback.
      if (window.scrollY > 0) {
        window.scrollTo(0, 0);
      }
    }
  }

  // Populate world age cards with images
  function populateWorldAgeCards() {
    agesData.forEach((age, index) => {
      // Handle special case for "In the beginning" entry
      let containerId;
      if (index === 0) {
        containerId = "world-age-images-beginning";
      } else {
        containerId = `world-age-images-${index}`;
      }

      const imagesContainer = document.getElementById(containerId);
      if (imagesContainer && age.images && age.images.length > 0) {
        imagesContainer.innerHTML = "";
        age.images.forEach((imageSrc) => {
          const img = document.createElement("img");
          img.src = imageSrc;
          img.alt = `${age.name} illustration`;
          img.className = "world-age-card__image";

          // Handle image load errors gracefully
          img.onerror = function () {
            this.style.display = "none";
          };

          imagesContainer.appendChild(img);
        });
      }
    });
  }

  // Lock/unlock scrolling — class on <html> triggers overflow: hidden
  // on both html and body (needed for iOS Safari).
  function lockScroll() {
    document.documentElement.classList.add("timeline-scroll-locked");
  }

  function unlockScroll() {
    document.documentElement.classList.remove("timeline-scroll-locked");
  }

  // Show/hide fixed timeline elements when transitioning to/from world-ages section.
  // The world-ages-section (z-index: 2) paints above the timeline-section's
  // stacking context (z-index: 1), so fixed elements get covered. We fade them
  // out for a clean transition and restore them when returning.
  function hideTimelineElements() {
    const sunrise = document.querySelector(".earth-sunrise");
    const cardContainer = document.querySelector(".age-card-container");
    const starmap = document.getElementById("starmap-background");
    if (earthContainer) earthContainer.style.opacity = "0";
    if (sunrise) sunrise.style.opacity = "0";
    if (cardContainer) cardContainer.style.opacity = "0";
    if (starmap) starmap.style.opacity = "0";
  }

  function showTimelineElements() {
    const sunrise = document.querySelector(".earth-sunrise");
    const cardContainer = document.querySelector(".age-card-container");
    const starmap = document.getElementById("starmap-background");
    if (earthContainer) earthContainer.style.opacity = "1";
    if (sunrise) sunrise.style.opacity = "1";
    if (cardContainer) cardContainer.style.opacity = "1";
    if (starmap) starmap.style.opacity = "1";
  }

  // Initialize timeline
  function initializeTimeline() {
    // Lock scrolling for age navigation on both desktop and mobile
    lockScroll();

    // Initialize with first age (also sets starmap position)
    updateAge(0, false);

    // Populate world age cards with images
    populateWorldAgeCards();

    console.log(
      "Timeline section initialized: horizontal scroll through 13 ages (including 'In the beginning...'), then reveal World Ages section",
    );
  }

  // Handle mobile touch navigation
  let touchStartX = 0;
  let touchStartY = 0;
  let mobileScrollResistance = 0;
  const MOBILE_SCROLL_RESISTANCE = 5;

  function handleTouchStart(event) {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;

    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }

  function handleTouchEnd(event) {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;

    // If in vertical scroll mode, don't handle swipe navigation
    if (isVerticalScrolling) return;

    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    const swipeDistanceX = touchStartX - touchEndX;
    const swipeDistanceY = touchStartY - touchEndY;
    const minSwipeDistance = 50;

    // Determine if swipe is more horizontal or vertical
    const isHorizontalSwipe = Math.abs(swipeDistanceX) > Math.abs(swipeDistanceY);

    if (isHorizontalSwipe && Math.abs(swipeDistanceX) > minSwipeDistance) {
      // Horizontal swipe — navigate between ages
      if (swipeDistanceX > 0 && currentAgeIndex < agesData.length - 1) {
        updateAge(currentAgeIndex + 1, true);
      } else if (swipeDistanceX < 0 && currentAgeIndex > 0) {
        updateAge(currentAgeIndex - 1, true);
      }
    } else if (!isHorizontalSwipe && Math.abs(swipeDistanceY) > minSwipeDistance) {
      // Vertical swipe
      if (swipeDistanceY > 0) {
        // Swipe up — next age or transition to world-ages
        if (currentAgeIndex < agesData.length - 1) {
          updateAge(currentAgeIndex + 1, true);
        } else {
          // At last age — apply resistance before transitioning
          mobileScrollResistance++;
          console.log(`Mobile resistance: ${mobileScrollResistance}/${MOBILE_SCROLL_RESISTANCE}`);
          if (mobileScrollResistance >= MOBILE_SCROLL_RESISTANCE) {
            isVerticalScrolling = true;
            hasCompletedAllAges = true;
            mobileScrollResistance = 0;
            hideTimelineElements();
            unlockScroll();
            console.log("Mobile: transitioning to vertical scroll");
          }
        }
      } else {
        // Swipe down — previous age
        if (currentAgeIndex > 0) {
          updateAge(currentAgeIndex - 1, true);
        }
      }
    }
  }

  // Handle window resize to update starmap positioning
  function handleWindowResize() {
    const isMobile = window.innerWidth <= 768;

    // Reset scroll state and lock scrolling unless already in vertical mode
    if (!isVerticalScrolling) {
      lockScroll();
    }

    // Recalculate starmap position for new viewport dimensions
    if (!isMobile) {
      updateStarmapPosition();
    }

    // Remove existing event listeners
    window.removeEventListener("wheel", handleWheelScroll);
    window.removeEventListener("scroll", handleRegularScroll);
    document.removeEventListener("touchstart", handleTouchStart);
    document.removeEventListener("touchend", handleTouchEnd);

    // Re-add appropriate event listeners
    if (isMobile) {
      document.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      });
      document.addEventListener("touchend", handleTouchEnd, { passive: true });
    }

    // Both desktop and mobile need wheel/scroll listeners
    window.addEventListener("wheel", handleWheelScroll, { passive: false });
    window.addEventListener("scroll", handleRegularScroll, { passive: true });
  }

  // Add event listeners — both desktop and mobile need wheel/scroll
  const isMobile = window.innerWidth <= 768;

  window.addEventListener("wheel", handleWheelScroll, { passive: false });
  window.addEventListener("scroll", handleRegularScroll, { passive: true });
  window.addEventListener("resize", handleWindowResize, { passive: true });

  // Mobile touch events
  if (isMobile) {
    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
  }

  // Debug: log what element receives clicks/touches (remove after fixing)
  document.addEventListener("click", function (e) {
    const el = e.target;
    const tag = el.tagName;
    const cls = el.className;
    const id = el.id;
    console.log(`[DEBUG CLICK] target: <${tag}> id="${id}" class="${cls}"`);
    // Also check what elements are at this point
    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    console.log("[DEBUG CLICK] elements at point:", elements.map(function(el) {
      return el.tagName + (el.id ? "#" + el.id : "") + (el.className ? "." + String(el.className).split(" ").join(".") : "");
    }));
  }, true); // useCapture to see events before they're stopped

  // Initialize
  initializeTimeline();

  console.log(
    "=== TIMELINE COMPLETE: Horizontal scroll through constellations with vertical transition ===",
  );
});
