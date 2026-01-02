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
      earth_texture: "/images/earth/earth-ocean-mist.png",
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
      earth_texture: "/images/earth/earth-ocean-mist.png",
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
      earth_texture: "/images/earth/earth-ocean-blue.png",
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
      earth_texture: "/images/earth/earth-pangeae-arid.png",
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
      earth_texture: "/images/earth/earth-pangeae-green.png",
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
      earth_texture: "/images/earth/earth-pangeae-green.png",
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
      earth_texture: "/images/earth/earth-pangeae-green.png",
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
      earth_texture: "/images/earth/earth-pangeae-green.png",
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
      earth_texture: "/images/earth/earth-ocean-blue.png",
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
      earth_texture: "/images/earth/earth-ocean-blue.png",
    },
    {
      name: "Age of Aries",
      symbol: "♈",
      color: "lavender",
      start: "−2370",
      end: "−210",
      event: "Events of Moses and Exodus",
      earth_texture: "/images/earth/earth-ocean-blue.png",
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
      earth_texture: "/images/earth/earth-ocean-blue.png",
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
      earth_texture: "/images/earth/earth-ocean-blue.png",
    },
  ];

  // Color mapping
  // Earth texture management
  let currentEarthTexture = null;

  function updateEarthTexture(newTexturePath) {
    const earthPattern = document.querySelector("#earthTexture image");

    if (
      earthPattern &&
      newTexturePath &&
      newTexturePath !== currentEarthTexture
    ) {
      // Instant texture change
      earthPattern.setAttribute("href", newTexturePath);
      currentEarthTexture = newTexturePath;
      console.log("Earth texture updated to:", newTexturePath);
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

  // Update starmap position based on current age - align constellations with Earth
  function updateStarmapPosition(customPosition = null) {
    const starmapContainer = document.getElementById("starmap-container");
    const timelineContent = document.getElementById("timeline-content");

    if (starmapContainer && timelineContent) {
      // Use custom position if provided (for smooth scrolling), otherwise use current age index
      const position =
        customPosition !== null ? customPosition : currentAgeIndex;

      // Timeline moves horizontally through ages (each age is 100vw)
      const timelineTransform = -(position * 100);

      // Starmap positioning: Each age shows 1/12th of the single starmap
      // The center starmap (middle of 3) should move so constellations align with Earth
      // Position 0: Show leftmost constellation (0% of starmap)
      // Position 11: Show rightmost constellation (100% of starmap)
      const constellationProgress = position / 11; // 0 to 1 across 12 ages

      // Move the center starmap within its container
      // Each age should move exactly 1/13th of the starmap width (150vw / 13 ≈ 11.54vw)
      // Earth is at 30% from left, so we need to offset starmap accordingly
      const earthOffsetPercent = 30; // Earth's left position as percentage of viewport
      const starmapRightShift = 20; // Additional 20% shift to the right
      const initialOffset = -150 + earthOffsetPercent + starmapRightShift; // Start position adjusted for wider starmap
      const starmapStepSize = 150 / 13; // ~11.54vw per age (1/13th of starmap width)
      const starmapTransform = initialOffset - position * starmapStepSize;

      const isMobile = window.innerWidth <= 768;

      if (!isMobile) {
        timelineContent.style.transform = `translateX(${timelineTransform}vw)`;

        // Responsive starmap transforms based on viewport size
        const isTablet = window.innerWidth <= 1200 && window.innerWidth > 768;

        let verticalOffset = "-10vh";
        if (isTablet) {
          verticalOffset = "-5vh";
        }

        starmapContainer.style.transform = `translate3d(${starmapTransform}vw, ${verticalOffset}, 0)`;
      }

      if (customPosition === null) {
        console.log(
          `Age ${currentAgeIndex + 1}/${agesData.length}: Timeline at ${timelineTransform}vw, Starmap at ${starmapTransform}vw`,
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

    // Reposition elements after card content changes
    setTimeout(() => {
      positionElementsBelowCard();
    }, 50);
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

  // Navigation button handlers
  if (navPrev) {
    navPrev.addEventListener("click", (e) => {
      e.preventDefault();
      if (currentAgeIndex > 0) {
        updateAge(currentAgeIndex - 1, true);
      }
    });
  }

  if (navNext) {
    navNext.addEventListener("click", (e) => {
      e.preventDefault();
      if (currentAgeIndex < agesData.length - 1) {
        updateAge(currentAgeIndex + 1, true);
      }
    });
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

  // Keep Earth stationary for constellation alignment
  if (earthContainer) {
    earthContainer.style.transform = `translate(-50%, -50%)`;
  }

  // Timeline progression state
  let hasCompletedAllAges = false;
  let isVerticalScrolling = false;
  let scrollResistanceCount = 0;
  const SCROLL_RESISTANCE_THRESHOLD = 50; // Require 50 scroll attempts at end

  // Simple scroll weight system with time-based throttling
  let scrollAccumulator = 0;
  const SCROLL_WEIGHT_THRESHOLD = 5; // Require 5 scroll events to change age
  let lastScrollTime = 0;
  const SCROLL_THROTTLE_MS = 200; // Minimum time between scroll counts (ms)

  function handleWheelScroll(event) {
    // Skip all wheel handling on mobile
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      return; // Let mobile use normal scrolling
    }

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
          document.body.style.overflow = "auto";
          document.body.style.height = "200vh";

          // Immediately hide the fixed elements before scrolling
          const starmapBg = document.querySelector(".starmap-background");
          const earthEl = document.querySelector(".earth-container");
          const sunriseEl = document.querySelector(".earth-sunrise");
          const ageCardEl = document.querySelector(".age-card-container");
          const timelineSec = document.querySelector(".timeline-section");

          if (starmapBg) {
            starmapBg.style.opacity = "0";
            starmapBg.style.transform = "translateY(-50vh)";
          }
          if (earthEl) earthEl.style.opacity = "0";
          if (sunriseEl) sunriseEl.style.opacity = "0";
          if (ageCardEl) {
            ageCardEl.style.opacity = "0";
            ageCardEl.style.transform = "translateY(-50vh)";
          }
          if (timelineSec) {
            timelineSec.style.transform = "translateY(-100vh)";
          }

          // Scroll to the world ages section
          window.scrollTo({
            top: window.innerHeight,
            behavior: "smooth",
          });
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
  function handleRegularScroll() {
    if (isVerticalScrolling) {
      const scrollY = window.scrollY;
      const timelineSection = document.querySelector(".timeline-section");
      const worldAgesSection = document.querySelector(".world-ages-section");
      const starmapBackground = document.querySelector(".starmap-background");
      const earthContainerEl = document.querySelector(".earth-container");
      const earthSunrise = document.querySelector(".earth-sunrise");
      const ageCardContainer = document.querySelector(".age-card-container");

      // Only update styles when scrolling back UP (towards timeline)
      // The initial transition to world-ages is handled when enabling vertical scroll
      if (scrollY > 0 && scrollY < window.innerHeight && timelineSection && worldAgesSection) {
        // User is scrolling back towards the timeline
        const pushUpProgress = Math.min(scrollY / window.innerHeight, 1);
        const timelineTransform = pushUpProgress * -100;
        timelineSection.style.transform = `translateY(${timelineTransform}vh)`;

        // Also transition the fixed elements to avoid black gap
        // Fade out and move up the fixed elements in sync with timeline section
        const fixedOpacity = 1 - pushUpProgress;
        const fixedTransform = pushUpProgress * -50; // Move up slower than timeline

        if (starmapBackground) {
          starmapBackground.style.opacity = fixedOpacity;
          starmapBackground.style.transform = `translateY(${fixedTransform}vh)`;
        }
        if (earthContainerEl) {
          earthContainerEl.style.opacity = fixedOpacity;
        }
        if (earthSunrise) {
          earthSunrise.style.opacity = fixedOpacity;
        }
        if (ageCardContainer) {
          ageCardContainer.style.opacity = fixedOpacity;
          ageCardContainer.style.transform = `translateY(${fixedTransform}vh)`;
        }
      }

      // Allow scrolling back into timeline
      if (scrollY <= 10) {
        // Small threshold for easier return
        isVerticalScrolling = false;
        hasCompletedAllAges = false;
        scrollResistanceCount = 0; // Reset resistance counter
        scrollAccumulator = 0; // Reset scroll accumulator
        lastScrollTime = 0; // Reset scroll throttle
        document.body.style.overflow = "hidden";
        document.body.style.height = "auto";

        if (timelineSection) {
          timelineSection.style.transform = "translateY(0)";
        }

        // Reset fixed elements
        if (starmapBackground) {
          starmapBackground.style.opacity = "1";
          starmapBackground.style.transform = "";
        }
        if (earthContainerEl) {
          earthContainerEl.style.opacity = "1";
        }
        if (earthSunrise) {
          earthSunrise.style.opacity = "1";
        }
        if (ageCardContainer) {
          ageCardContainer.style.opacity = "1";
          ageCardContainer.style.transform = "";
        }

        console.log("Returned to timeline - horizontal scrolling re-enabled");
        // World Ages section returns to natural position in document flow
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

  // Initialize timeline
  function initializeTimeline() {
    // Only prevent scrolling on desktop
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) {
      document.body.style.overflow = "hidden";
    }

    // World Ages section is positioned naturally after timeline section
    // No initial transform needed - it's part of normal document flow

    // Set up starmap container with proper structure for seamless continuity
    const starmapContainer = document.getElementById("starmap-container");
    if (starmapContainer) {
      const isMobile = window.innerWidth <= 768;

      if (isMobile) {
        // Mobile: Simple static positioning
        starmapContainer.style.transform = "none";
        starmapContainer.style.position = "static";

        // Show only center starmap on mobile
        const starmapLayers =
          starmapContainer.querySelectorAll(".starmap-layer");
        starmapLayers.forEach((layer, index) => {
          if (
            layer.classList.contains("starmap-layer--left") ||
            layer.classList.contains("starmap-layer--right")
          ) {
            layer.style.display = "none";
          } else {
            layer.style.display = "block";
            layer.style.objectFit = "cover";
            layer.style.objectPosition = "center center";
            layer.style.position = "absolute";
            layer.style.top = "0";
            layer.style.left = "0";
            layer.style.width = "100%";
            layer.style.height = "100%";
          }
        });
      } else {
        // Desktop/Tablet: Complex positioning
        const isTablet = window.innerWidth <= 1200;
        let verticalOffset = isTablet ? "-5vh" : "-10vh";

        starmapContainer.style.transform = `translate3d(-120vw, ${verticalOffset}, 0)`;

        const starmapLayers =
          starmapContainer.querySelectorAll(".starmap-layer");
        starmapLayers.forEach((layer) => {
          layer.style.display = "block";
          if (isTablet) {
            layer.style.objectFit = "contain";
            layer.style.objectPosition = "center center";
          } else {
            layer.style.objectFit = "cover";
            layer.style.objectPosition = "center 20%";
          }
        });
      }
    }

    // Initialize with first age
    updateAge(0, false);

    // Populate world age cards with images
    populateWorldAgeCards();

    console.log(
      "Timeline section initialized: horizontal scroll through 13 ages (including 'In the beginning...'), then reveal World Ages section",
    );
  }

  // Handle mobile touch navigation
  let touchStartX = 0;

  function handleTouchStart(event) {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;

    touchStartX = event.touches[0].clientX;
  }

  function handleTouchEnd(event) {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;

    const touchEndX = event.changedTouches[0].clientX;
    const swipeDistance = touchStartX - touchEndX;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0 && currentAgeIndex < agesData.length - 1) {
        // Swipe left - next age
        updateAge(currentAgeIndex + 1, true);
      } else if (swipeDistance < 0 && currentAgeIndex > 0) {
        // Swipe right - previous age
        updateAge(currentAgeIndex - 1, true);
      }
    }
  }

  // Handle window resize to update starmap positioning
  function handleWindowResize() {
    const starmapContainer = document.getElementById("starmap-container");
    const isMobile = window.innerWidth <= 768;

    // Update body scrolling based on viewport
    if (isMobile) {
      document.body.style.overflow = "auto";
      document.body.style.height = "auto";
      isVerticalScrolling = false;
      hasCompletedAllAges = false;
    } else {
      document.body.style.overflow = "hidden";
      document.body.style.height = "100vh";
    }

    if (starmapContainer) {
      if (isMobile) {
        // Mobile setup
        starmapContainer.style.transform = "none";
        const starmapLayers =
          starmapContainer.querySelectorAll(".starmap-layer");
        starmapLayers.forEach((layer, index) => {
          if (
            layer.classList.contains("starmap-layer--left") ||
            layer.classList.contains("starmap-layer--right")
          ) {
            layer.style.display = "none";
          } else {
            layer.style.display = "block";
            layer.style.objectFit = "cover";
            layer.style.objectPosition = "center center";
          }
        });
      } else {
        // Desktop setup
        updateStarmapPosition();
        const starmapLayers =
          starmapContainer.querySelectorAll(".starmap-layer");
        const isTablet = window.innerWidth <= 1200;

        starmapLayers.forEach((layer) => {
          layer.style.display = "block";
          if (isTablet) {
            layer.style.objectFit = "contain";
            layer.style.objectPosition = "center center";
          } else {
            layer.style.objectFit = "cover";
            layer.style.objectPosition = "center 20%";
          }
        });
      }
    }

    // Remove existing event listeners
    window.removeEventListener("wheel", handleWheelScroll);
    window.removeEventListener("scroll", handleRegularScroll);
    document.removeEventListener("touchstart", handleTouchStart);
    document.removeEventListener("touchend", handleTouchEnd);

    // Re-add appropriate event listeners
    if (!isMobile) {
      window.addEventListener("wheel", handleWheelScroll, { passive: false });
      window.addEventListener("scroll", handleRegularScroll, { passive: true });
    } else {
      document.addEventListener("touchstart", handleTouchStart, {
        passive: true,
      });
      document.addEventListener("touchend", handleTouchEnd, { passive: true });
    }
  }

  // Add event listeners based on device type
  const isMobile = window.innerWidth <= 768;

  if (!isMobile) {
    window.addEventListener("wheel", handleWheelScroll, { passive: false });
    window.addEventListener("scroll", handleRegularScroll, { passive: true });
  }

  window.addEventListener("resize", handleWindowResize, { passive: true });

  // Mobile touch events
  if (isMobile) {
    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });
  }

  // Initialize
  initializeTimeline();

  console.log(
    "=== TIMELINE COMPLETE: Horizontal scroll through constellations with vertical transition ===",
  );
});
