// Timeline Controller for Wheel of Heaven
// Manages the immersive timeline experience with Earth animation and Age transitions

class TimelineController {
    constructor(agesData) {
        this.agesData = agesData;
        this.currentAgeIndex = 0;
        this.isScrolling = false;
        this.scrollTimeout = null;

        this.initElements();
        this.initEventListeners();
        this.populateAgeSelector();
        this.updateAge(0);
        this.startEarthRotation();
    }

    initElements() {
        this.card = document.getElementById('timeline-card');
        this.symbol = document.getElementById('age-symbol');
        this.name = document.getElementById('age-name');
        this.dates = document.getElementById('age-dates');
        this.description = document.getElementById('age-description');
        this.cta = document.getElementById('age-cta');
        this.progressFill = document.getElementById('progress-fill');
        this.currentAgeSpan = document.getElementById('current-age');
        this.prevButton = document.getElementById('prev-age');
        this.nextButton = document.getElementById('next-age');
        this.ageSelector = document.getElementById('age-selector');
        this.earth = document.querySelector('.timeline__earth-globe');
        this.timeline = document.querySelector('.timeline');
    }

    initEventListeners() {
        // Scroll handling for age transitions
        let ticking = false;
        window.addEventListener('wheel', (e) => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.handleScroll(e);
                    ticking = false;
                });
                ticking = true;
            }
        });

        // Touch/swipe handling for mobile
        let startY = 0;
        let endY = 0;

        this.timeline.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
        });

        this.timeline.addEventListener('touchend', (e) => {
            endY = e.changedTouches[0].clientY;
            this.handleSwipe(startY, endY);
        });

        // Navigation buttons
        this.prevButton.addEventListener('click', () => this.previousAge());
        this.nextButton.addEventListener('click', () => this.nextAge());

        // Age selector dropdown
        this.ageSelector.addEventListener('change', (e) => {
            if (e.target.value !== '') {
                this.updateAge(parseInt(e.target.value));
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.previousAge();
            } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                e.preventDefault();
                this.nextAge();
            } else if (e.key === 'Home') {
                e.preventDefault();
                this.updateAge(0);
            } else if (e.key === 'End') {
                e.preventDefault();
                this.updateAge(this.agesData.length - 1);
            }
        });

        // Resize handler for responsive behavior
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Visibility change handler to pause/resume animations
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimations();
            } else {
                this.resumeAnimations();
            }
        });
    }

    handleScroll(e) {
        if (this.isScrolling) return;

        // Prevent default scrolling until all ages are shown
        if (this.currentAgeIndex < this.agesData.length - 1) {
            e.preventDefault();
        }

        // Determine scroll direction
        const delta = e.deltaY;

        if (delta > 0 && this.currentAgeIndex < this.agesData.length - 1) {
            // Scroll down - next age
            this.nextAge();
        } else if (delta < 0 && this.currentAgeIndex > 0) {
            // Scroll up - previous age
            this.previousAge();
        }
    }

    handleSwipe(startY, endY) {
        const threshold = 50; // Minimum swipe distance
        const diff = startY - endY;

        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                // Swipe up - next age
                this.nextAge();
            } else {
                // Swipe down - previous age
                this.previousAge();
            }
        }
    }

    nextAge() {
        if (this.currentAgeIndex < this.agesData.length - 1) {
            this.updateAge(this.currentAgeIndex + 1);
        }
    }

    previousAge() {
        if (this.currentAgeIndex > 0) {
            this.updateAge(this.currentAgeIndex - 1);
        }
    }

    updateAge(index) {
        if (index < 0 || index >= this.agesData.length) return;

        this.isScrolling = true;
        const age = this.agesData[index];

        // Add transition class
        this.card.classList.add('timeline__card--transitioning');

        // Announce to screen readers
        this.announceAgeChange(age);

        setTimeout(() => {
            // Update content
            this.symbol.textContent = age.symbol;
            this.name.textContent = age.name;
            this.dates.textContent = this.formatDates(age.start, age.end);
            this.description.textContent = age.event;
            this.cta.href = age.link;

            // Update background color using the color mapping
            const colorValue = this.getColorValue(age.color);
            if (colorValue) {
                document.documentElement.style.setProperty('--timeline-bg-color', colorValue);
            }

            // Update progress
            const progress = ((index + 1) / this.agesData.length) * 100;
            this.progressFill.style.width = `${progress}%`;
            this.currentAgeSpan.textContent = index + 1;

            // Update navigation buttons
            this.prevButton.disabled = index === 0;
            this.nextButton.disabled = index === this.agesData.length - 1;

            // Update selector
            this.ageSelector.value = index;

            // Update URL hash for deep linking
            this.updateURL(age);

            this.currentAgeIndex = index;

            // Remove transition class
            this.card.classList.remove('timeline__card--transitioning');

            // Reset scrolling flag
            setTimeout(() => {
                this.isScrolling = false;
            }, 600);
        }, 300);
    }

    formatDates(start, end) {
        const startYear = Math.abs(parseInt(start));
        const endYear = Math.abs(parseInt(end));

        if (parseInt(start) < 0 && parseInt(end) < 0) {
            return `${startYear.toLocaleString()} BCE - ${endYear.toLocaleString()} BCE`;
        } else if (parseInt(start) < 0 && parseInt(end) > 0) {
            return `${startYear.toLocaleString()} BCE - ${endYear.toLocaleString()} CE`;
        } else {
            return `${startYear.toLocaleString()} CE - ${endYear.toLocaleString()} CE`;
        }
    }

    getColorValue(colorName) {
        // Map color names to CSS variables
        const colorMap = {
            'mauve': 'var(--color-mauve-900)',
            'blue': 'var(--color-blue-900)',
            'cyan': 'var(--color-cyan-900)',
            'teal': 'var(--color-teal-900)',
            'mint': 'var(--color-mint-900)',
            'green': 'var(--color-green-900)',
            'yellow': 'var(--color-yellow-900)',
            'pink': 'var(--color-pink-900)',
            'soft-pink': 'var(--color-soft-pink-900)',
            'lavender': 'var(--color-lavender-900)'
        };

        return colorMap[colorName] || colorMap['mauve'];
    }

    populateAgeSelector() {
        this.agesData.forEach((age, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = age.name;
            this.ageSelector.appendChild(option);
        });
    }

    startEarthRotation() {
        if (this.earth) {
            this.earth.style.animation = 'earthRotate 60s linear infinite';
        }
    }

    pauseAnimations() {
        if (this.earth) {
            this.earth.style.animationPlayState = 'paused';
        }

        const stars = document.querySelector('.timeline__stars');
        const sunrise = document.querySelector('.timeline__earth-sunrise::before');

        if (stars) {
            stars.style.animationPlayState = 'paused';
        }
    }

    resumeAnimations() {
        if (this.earth) {
            this.earth.style.animationPlayState = 'running';
        }

        const stars = document.querySelector('.timeline__stars');

        if (stars) {
            stars.style.animationPlayState = 'running';
        }
    }

    handleResize() {
        // Adjust layout for mobile/desktop transitions
        const isMobile = window.innerWidth <= 768;

        if (isMobile !== this.wasMobile) {
            this.wasMobile = isMobile;
            // Re-initialize layout if needed
            setTimeout(() => {
                this.updateAge(this.currentAgeIndex);
            }, 100);
        }
    }

    updateURL(age) {
        // Update URL hash for bookmarking and sharing
        const ageSlug = age.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        history.replaceState(null, null, `#${ageSlug}`);
    }

    announceAgeChange(age) {
        // Create announcement for screen readers
        const announcement = `Now showing ${age.name}, ${this.formatDates(age.start, age.end)}`;

        // Create or update aria-live region
        let liveRegion = document.getElementById('timeline-live-region');
        if (!liveRegion) {
            liveRegion = document.createElement('div');
            liveRegion.id = 'timeline-live-region';
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            liveRegion.style.position = 'absolute';
            liveRegion.style.left = '-10000px';
            liveRegion.style.width = '1px';
            liveRegion.style.height = '1px';
            liveRegion.style.overflow = 'hidden';
            document.body.appendChild(liveRegion);
        }

        liveRegion.textContent = announcement;
    }

    // Public API methods
    goToAge(index) {
        this.updateAge(index);
    }

    goToAgeByName(name) {
        const index = this.agesData.findIndex(age =>
            age.name.toLowerCase() === name.toLowerCase()
        );
        if (index !== -1) {
            this.updateAge(index);
        }
    }

    getCurrentAge() {
        return this.agesData[this.currentAgeIndex];
    }

    // Initialize from URL hash if present
    initializeFromURL() {
        const hash = window.location.hash.slice(1);
        if (hash) {
            const ageIndex = this.agesData.findIndex(age => {
                const ageSlug = age.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                return ageSlug === hash;
            });

            if (ageIndex !== -1) {
                this.updateAge(ageIndex);
                return;
            }
        }

        // Default to first age
        this.updateAge(0);
    }
}

// Global timeline instance
let timelineInstance = null;

// Initialize timeline when DOM is loaded
function initializeTimeline(agesData) {
    if (timelineInstance) {
        return timelineInstance;
    }

    timelineInstance = new TimelineController(agesData);
    timelineInstance.initializeFromURL();

    // Expose to global scope for external access
    window.Timeline = {
        goToAge: (index) => timelineInstance.goToAge(index),
        goToAgeByName: (name) => timelineInstance.goToAgeByName(name),
        getCurrentAge: () => timelineInstance.getCurrentAge(),
        next: () => timelineInstance.nextAge(),
        previous: () => timelineInstance.previousAge()
    };

    return timelineInstance;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TimelineController, initializeTimeline };
}
