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
  const progressFill = document.getElementById("progress-fill");
  const progressCurrent = document.getElementById("progress-current");
  const earthContainer = document.querySelector(".earth-container");
  const navPrev = document.getElementById("nav-prev");
  const navNext = document.getElementById("nav-next");
  const selectorTrigger = document.getElementById("age-selector-trigger");
  const selectorDropdown = document.getElementById("age-selector-dropdown");

  let currentAgeIndex = 0;
  let isTransitioning = false;

  // Age data
  const agesData = [
    {
      name: "In the beginning...",
      symbol: "✦",
      color: "yellow",
      start: "−∞",
      end: "−21810",
      event:
        "Before time began, in the vast expanse of the cosmos, the Elohim civilization flourished. Advanced beings who mastered science and creation, they would soon discover our world and begin the greatest experiment in galactic history.",
      link: "/timeline/in-the-beginning",
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
    },
    {
      name: "Age of Aries",
      symbol: "♈",
      color: "lavender",
      start: "−2370",
      end: "−210",
      event: "Events of Moses and Exodus",
      link: "/timeline/age-of-aries",
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
    },
  ];

  // Color mapping
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

      timelineContent.style.transform = `translateX(${timelineTransform}vw)`;
      starmapContainer.style.transform = `translateX(${starmapTransform}vw)`;

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

    ageTimespan.innerHTML = `
      <span class="age-card__start">${startYear.toLocaleString()}${startSuffix}</span>
      <span class="age-card__separator">→</span>
      <span class="age-card__end">${endYear.toLocaleString()}${endSuffix}</span>
    `;

    // Update colors
    ageCard.style.setProperty("--age-color", color);
    ageCard.style.borderColor = color;

    const linkElement = ageCard.querySelector(".age-card__link");
    if (linkElement) {
      linkElement.style.background = `linear-gradient(135deg, ${color}, ${color}99)`;
    }

    // Update progress
    const progress = ((index + 1) / agesData.length) * 100;
    progressFill.style.width = progress + "%";
    progressFill.style.background = `linear-gradient(90deg, ${color}, ${color}cc)`;
    progressCurrent.textContent = `${index} of 12`;

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

  // Age selector dropdown
  if (selectorTrigger && selectorDropdown) {
    selectorTrigger.addEventListener("click", () => {
      selectorDropdown.classList.toggle("age-selector__dropdown--open");
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".age-selector")) {
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

      if (scrollY > 0 && timelineSection && worldAgesSection) {
        // Push timeline section up as World Ages section comes into view
        const pushUpProgress = Math.min(scrollY / window.innerHeight, 1);
        const timelineTransform = pushUpProgress * -100;
        timelineSection.style.transform = `translateY(${timelineTransform}vh)`;
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

        console.log("Returned to timeline - horizontal scrolling re-enabled");
        // World Ages section returns to natural position in document flow
      }
    }
  }

  // Position elements below age-card dynamically
  function positionElementsBelowCard() {
    const ageCardContainer = document.querySelector(".age-card-container");
    const ageProgress = document.querySelector(".age-progress");
    const timelineNav = document.querySelector(".timeline-nav");

    if (ageCardContainer && ageProgress && timelineNav) {
      const cardRect = ageCardContainer.getBoundingClientRect();
      const cardBottom = cardRect.bottom;
      const cardRight = cardRect.right;
      const viewportHeight = window.innerHeight;

      // Position age-progress below the card
      const progressTop = cardBottom + 20; // 20px gap
      ageProgress.style.top = `${progressTop}px`;
      ageProgress.style.right = `${window.innerWidth - cardRight}px`;

      // Position timeline-nav below age-progress
      const progressRect = ageProgress.getBoundingClientRect();
      const navTop = progressRect.bottom + 15; // 15px gap
      timelineNav.style.top = `${navTop}px`;
      timelineNav.style.right = `${window.innerWidth - cardRight}px`;

      // On mobile, center the elements
      if (window.innerWidth <= 768) {
        const cardLeft = cardRect.left;
        const cardWidth = cardRect.width;
        const cardCenter = cardLeft + cardWidth / 2;

        ageProgress.style.left = `${cardCenter}px`;
        ageProgress.style.right = "auto";
        ageProgress.style.transform = "translateX(-50%)";

        timelineNav.style.left = `${cardCenter}px`;
        timelineNav.style.right = "auto";
        timelineNav.style.transform = "translateX(-50%)";
      }
    }
  }

  // Initialize timeline
  function initializeTimeline() {
    // Prevent default scrolling initially
    document.body.style.overflow = "hidden";

    // World Ages section is positioned naturally after timeline section
    // No initial transform needed - it's part of normal document flow

    // Set up starmap container with proper structure for seamless continuity
    const starmapContainer = document.getElementById("starmap-container");
    if (starmapContainer) {
      // Position container so center starmap is visible and ready to scroll
      // Start with center starmap positioned to show its leftmost constellation
      starmapContainer.style.transform = "translateX(-120vw)";

      // Ensure all starmap images are properly sized and positioned
      const starmapLayers = starmapContainer.querySelectorAll(".starmap-layer");
      starmapLayers.forEach((layer, index) => {
        layer.style.objectFit = "cover";
        layer.style.objectPosition = "center center";
      });
    }

    // Initialize with first age
    updateAge(0, false);

    // Position elements below card initially
    setTimeout(() => {
      positionElementsBelowCard();
    }, 100);

    console.log(
      "Timeline section initialized: horizontal scroll through 13 ages (including 'In the beginning...'), then reveal World Ages section",
    );
  }

  // Add event listeners
  window.addEventListener("wheel", handleWheelScroll, { passive: false });
  window.addEventListener("scroll", handleRegularScroll, { passive: true });
  window.addEventListener("resize", positionElementsBelowCard, {
    passive: true,
  });

  // Initialize
  initializeTimeline();

  console.log(
    "=== TIMELINE COMPLETE: Horizontal scroll through constellations with vertical transition ===",
  );
});
