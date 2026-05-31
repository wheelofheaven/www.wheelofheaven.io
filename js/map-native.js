(function () {
    "use strict";

    const root = document.querySelector("[data-map-root]");
    if (!root) return;

    const stage = document.getElementById("map-stage");
    const zoomInBtn = document.getElementById("map-zoom-in");
    const zoomOutBtn = document.getElementById("map-zoom-out");
    const interactiveItems = root.querySelectorAll("[data-map-title]");
    const ageItems = root.querySelectorAll("[data-map-age]");
    const nodeItems = root.querySelectorAll("[data-node-id]");

    function setActiveAge(ageId) {
        if (!ageId) return;

        root.dataset.activeAge = ageId;

        ageItems.forEach((item) => {
            item.classList.toggle("is-active", item.dataset.mapAge === ageId);
        });

        nodeItems.forEach((item) => {
            const related = item.dataset.nodeAge === ageId || item.dataset.nodeAge === "core";
            item.classList.toggle("is-related", related);
        });
    }

    function setActiveNode(node) {
        if (!node) return;

        const ageId = node.dataset.nodeAge;
        if (ageId && ageId !== "core") {
            setActiveAge(ageId);
        } else {
            nodeItems.forEach((item) => {
                item.classList.toggle("is-related", item.dataset.nodeAge === "core");
            });
        }

        nodeItems.forEach((item) => {
            item.classList.toggle("is-selected", item === node);
        });
    }

    interactiveItems.forEach((item) => {
        item.addEventListener("mouseenter", () => {
            if (item.dataset.nodeId) setActiveNode(item);
            else if (item.dataset.mapAge) setActiveAge(item.dataset.mapAge);
        });

        item.addEventListener("focus", () => {
            if (item.dataset.nodeId) setActiveNode(item);
            else if (item.dataset.mapAge) setActiveAge(item.dataset.mapAge);
        });
    });

    function selectorValue(value) {
        if (window.CSS && CSS.escape) return CSS.escape(value);
        return value.replace(/[^a-zA-Z0-9_-]/g, "\\$&");
    }

    function activateFromHash() {
        const hash = decodeURIComponent(window.location.hash.replace(/^#/, ""));
        if (!hash) return false;

        const node = root.querySelector('[data-node-id="' + selectorValue(hash) + '"]');
        if (node) {
            setActiveNode(node);
            node.scrollIntoView({ block: "center", inline: "center" });
            return true;
        }

        const age = root.querySelector('[data-map-age="' + selectorValue(hash) + '"]');
        if (age) {
            setActiveAge(hash);
            age.scrollIntoView({ block: "center", inline: "center" });
            return true;
        }

        return false;
    }

    function centerStageHorizontally() {
        if (!stage) return;

        const maxScrollLeft = stage.scrollWidth - stage.clientWidth;
        if (maxScrollLeft > 0) {
            stage.scrollLeft = maxScrollLeft / 2;
        }
    }

    const zoomLevels = [0.75, 1, 1.25, 1.5, 1.75, 2];
    let zoomIndex = zoomLevels.indexOf(1);

    function updateZoomButtons() {
        if (zoomOutBtn) zoomOutBtn.disabled = zoomIndex === 0;
        if (zoomInBtn) zoomInBtn.disabled = zoomIndex === zoomLevels.length - 1;
    }

    function setZoom(nextIndex) {
        if (!stage || nextIndex === zoomIndex || nextIndex < 0 || nextIndex >= zoomLevels.length) return;

        const previousWidth = stage.scrollWidth;
        const previousHeight = stage.scrollHeight;
        const centerX = (stage.scrollLeft + stage.clientWidth / 2) / previousWidth;
        const centerY = (stage.scrollTop + stage.clientHeight / 2) / previousHeight;

        zoomIndex = nextIndex;
        root.style.setProperty("--map-zoom", zoomLevels[zoomIndex]);
        updateZoomButtons();

        requestAnimationFrame(() => {
            stage.scrollLeft = centerX * stage.scrollWidth - stage.clientWidth / 2;
            stage.scrollTop = centerY * stage.scrollHeight - stage.clientHeight / 2;
        });
    }

    if (zoomOutBtn) zoomOutBtn.addEventListener("click", () => setZoom(zoomIndex - 1));
    if (zoomInBtn) zoomInBtn.addEventListener("click", () => setZoom(zoomIndex + 1));
    updateZoomButtons();

    function scheduleStageCenter() {
        requestAnimationFrame(() => {
            requestAnimationFrame(centerStageHorizontally);
        });
        window.setTimeout(centerStageHorizontally, 120);
        window.setTimeout(centerStageHorizontally, 360);
    }

    const defaultAge = root.dataset.activeAge || "age-of-aquarius";
    const defaultAgeItem = root.querySelector('.map-age[data-map-age="' + defaultAge + '"]');
    if (defaultAgeItem) setActiveAge(defaultAge);

    if (!activateFromHash()) scheduleStageCenter();
    window.addEventListener("load", scheduleStageCenter, { once: true });
    window.addEventListener("resize", scheduleStageCenter);
    window.addEventListener("hashchange", activateFromHash);
})();
