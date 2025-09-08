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
  function updateStarmapPosition() {
    const starmapContainer = document.getElementById("starmap-container");
    const timelineSection = document.getElementById("timeline-section");

    if (starmapContainer && timelineSection) {
      // Timeline moves horizontally through ages (each age is 100vw)
      const timelineTransform = -(currentAgeIndex * 100);

      // Starmap positioning: Each age shows 1/12th of the single starmap
      // The center starmap (middle of 3) should move so constellations align with Earth
      // Age 0: Show leftmost constellation (0% of starmap)
      // Age 11: Show rightmost constellation (100% of starmap)
      const constellationProgress = currentAgeIndex / 11; // 0 to 1 across 12 ages

      // Move the center starmap within its container
      // Each age should move exactly 1/12th of the starmap width (150vw / 12 = 12.5vw)
      // Earth is at 30% from left, so we need to offset starmap accordingly
      const earthOffsetPercent = 30; // Earth's left position as percentage of viewport
      const initialOffset = -150 + earthOffsetPercent; // Start position adjusted for wider starmap
      const starmapStepSize = 150 / 12; // 12.5vw per age (1/12th of starmap width)
      const starmapTransform =
        initialOffset - currentAgeIndex * starmapStepSize;

      timelineSection.style.transform = `translateX(${timelineTransform}vw)`;
      starmapContainer.style.transform = `translateX(${starmapTransform}vw)`;

      console.log(
        `Age ${currentAgeIndex + 1}/${agesData.length}: Timeline at ${timelineTransform}vw, Starmap at ${starmapTransform}vw (constellation ${(constellationProgress * 100).toFixed(1)}%)`,
      );
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
    progressCurrent.textContent = `${index + 1} of ${agesData.length}`;

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

  function handleWheelScroll(event) {
    if (isTransitioning) return;

    if (!isVerticalScrolling) {
      event.preventDefault();

      if (event.deltaY > 0) {
        // Scroll forward through ages
        if (currentAgeIndex < agesData.length - 1) {
          updateAge(currentAgeIndex + 1, true);
        } else if (!hasCompletedAllAges) {
          // Completed all ages - enable vertical scrolling
          hasCompletedAllAges = true;
          isVerticalScrolling = true;
          console.log(
            "All ages completed! Enabling vertical scroll for footer.",
          );

          // Restore normal scrolling
          document.body.style.overflow = "auto";

          // Scroll down to show footer
          window.scrollTo({
            top: window.innerHeight,
            behavior: "smooth",
          });
        }
      } else {
        // Scroll backward through ages
        if (currentAgeIndex > 0) {
          updateAge(currentAgeIndex - 1, true);
        }
      }
    }
  }

  // Handle vertical scrolling after completing timeline
  function handleRegularScroll() {
    if (isVerticalScrolling) {
      const scrollY = window.scrollY;
      const timelineViewport = document.querySelector(".timeline-viewport");

      if (scrollY > 0 && timelineViewport) {
        // Push timeline up to show footer
        const pushUpProgress = Math.min(scrollY / window.innerHeight, 1);
        const translateY = pushUpProgress * -100;
        timelineViewport.style.transform = `translateY(${translateY}vh)`;
      }

      // Allow scrolling back into timeline
      if (scrollY === 0 && currentAgeIndex === agesData.length - 1) {
        isVerticalScrolling = false;
        hasCompletedAllAges = false;
        document.body.style.overflow = "hidden";
        if (timelineViewport) {
          timelineViewport.style.transform = "translateY(0)";
        }
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

    // Set up starmap container with proper structure for seamless continuity
    const starmapContainer = document.getElementById("starmap-container");
    if (starmapContainer) {
      // Position container so center starmap is visible and ready to scroll
      // Adjust initial position to align Age of Capricorn with Earth's horizontal position
      const earthOffsetPercent = 30; // Match Earth's left position
      const initialPosition = -150 + earthOffsetPercent; // Adjusted for wider starmap
      starmapContainer.style.transform = `translateX(${initialPosition}vw)`;

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
      "Timeline initialized with horizontal scrolling through 12 ages",
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
