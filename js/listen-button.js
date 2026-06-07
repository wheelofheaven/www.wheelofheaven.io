// Listen-to-this-page feature
//
// Three engines, tried in this order:
//   - "prerecorded": pre-rendered ElevenLabs audiobook for the current
//                    library book + language + chapter, if a manifest is
//                    published at assets.wheelofheaven.world. Highest
//                    fidelity; paragraph highlight driven by a timing
//                    sidecar against audio.currentTime.
//   - "studio":      neural TTS generated in-browser, selected per-language:
//                       en, de, fr, es, ru, ko       → MMS-TTS via transformers.js v4
//                       zh, zh-Hant                  → Piper
//                       anything else / load failure → silently falls back to system
//   - "system":      browser SpeechSynthesis — instant, free, quality varies by OS
//
// The user toggle ("System" / "Studio") chooses between the two GENERATED
// engines. The prerecorded engine is preferred silently when available — no
// UI for it; if the manifest exists for this page, you get the audiobook.
// Engine preference is persisted in localStorage under `woh:listen:engine`.
//
// Playback is unit-based: the page is split into an ordered list of reading
// units. On library-book pages each unit is one verse paragraph (carrying its
// DOM id `c{ch}p{n}`); elsewhere units are sentence-sized chunks of the page
// text with no id. All three engines report the index of the unit currently
// being read, which drives the reading highlight (library pages) and the
// progress bar.

(function () {
    const trigger = document.getElementById('listenTrigger');
    if (!trigger) return;

    const player = document.getElementById('audioPlayer');
    const playPauseBtn = document.getElementById('audioPlayPause');
    const closeBtn = document.getElementById('audioClose');
    const progressFill = document.getElementById('audioProgressFill');
    const progressHandle = document.getElementById('audioProgressHandle');
    const timeCurrent = document.getElementById('audioTimeCurrent');
    const timeTotal = document.getElementById('audioTimeTotal');
    const titleEl = document.querySelector('.audio-player__title-text');
    const engineToggle = document.getElementById('audioEngineToggle');
    const engineLabel = document.getElementById('audioEngineLabel');
    const loadingEl = document.getElementById('audioLoading');
    const loadingLabel = document.getElementById('audioLoadingLabel');

    const STORAGE_KEY = 'woh:listen:engine';
    const hasWebSpeech = 'speechSynthesis' in window;

    if (!hasWebSpeech && !window.WebAssembly) {
        trigger.style.display = 'none';
        return;
    }

    // --- Language routing ----------------------------------------------------

    // Returns the page's primary language tag as ['family', 'fullTag'].
    // e.g. zh-Hant → ['zh', 'zh-Hant'], en-US → ['en', 'en-US'].
    function detectPageLang() {
        const raw = (document.documentElement.lang || 'en').trim();
        const family = raw.split('-')[0].toLowerCase();
        return { family, tag: raw };
    }

    // MMS-TTS (Meta MMS / VITS) model per language family — the languages
    // transformers.js can synthesize directly with no romanization step.
    // Each model IS the language; output is { audio: Float32Array,
    // sampling_rate: 16000 }. Japanese and Chinese aren't in this set
    // (Chinese is handled by Piper below; Japanese falls back to system).
    const MMS_MODELS = {
        en: 'Xenova/mms-tts-eng',
        de: 'Xenova/mms-tts-deu',
        fr: 'Xenova/mms-tts-fra',
        es: 'Xenova/mms-tts-spa',
        ru: 'Xenova/mms-tts-rus',
        ko: 'Xenova/mms-tts-kor',
    };

    // Which studio sub-engine handles this language, or null if unsupported
    // (in which case studio silently falls back to the system voice).
    function studioEngineFor({ family, tag }) {
        if (MMS_MODELS[family]) return 'mms';
        if (family === 'zh') return 'piper';
        return null;
    }

    // Default Piper voice ID per language. These follow rhasspy's naming
    // convention; verify with `piper-tts-web` when testing.
    const PIPER_VOICES = {
        'zh-CN': 'zh_CN-huayan-medium',
        'zh-Hant': 'zh_CN-huayan-medium',     // no zh_TW voice in piper-voices as of writing; falls through to Mandarin
        'zh': 'zh_CN-huayan-medium',
    };

    function piperVoiceFor({ family, tag }) {
        return PIPER_VOICES[tag] || PIPER_VOICES[family] || 'zh_CN-huayan-medium';
    }

    // --- State ---------------------------------------------------------------

    let currentEngine = null;
    let engineName = localStorage.getItem(STORAGE_KEY) || 'system';
    let isPlaying = false;
    let isPaused = false;
    let estimatedDuration = 0;
    // Once a studio model fails/hangs in this session, route to the system
    // voice without flipping the user's saved preference. Reset when the user
    // explicitly toggles the engine, so they can retry.
    let studioFailedThisSession = false;

    // Unit-based playback state. playQueue holds the ordered reading units for
    // the current session; each is { id, text } where id is a paragraph DOM id
    // on library pages or null elsewhere. lastHighlightedId tracks the verse
    // currently carrying the reading highlight so we can clear it.
    let playQueue = [];
    let lastHighlightedId = null;

    // --- DOM helpers ---------------------------------------------------------

    // Flat page-text extraction, used as the non-library fallback and as the
    // basis for sentence chunking.
    function getContentText() {
        const selectors = [
            '.wiki__content',
            '.article__content',
            '.essentials__content',
            '.resources__content',
            '.library-book__content',
            '.library__content',
            'article .content',
            'article',
        ];
        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (!el) continue;
            const clone = el.cloneNode(true);
            clone
                .querySelectorAll(
                    'script, style, nav, .toc, .breadcrumbs, .listen-trigger, .audio-player, sup, .wiki-cite'
                )
                .forEach((n) => n.remove());
            return (clone.textContent || clone.innerText).replace(/\s+/g, ' ').trim();
        }
        return '';
    }

    // Build the ordered list of reading units for the current page.
    //   - Library books → one unit per verse paragraph, carrying its DOM id so
    //     the unit can be highlighted and scrolled to as it plays. Only the
    //     primary reading line is spoken (translation, or original when there
    //     is no translation); the inline commentary button, citation marks,
    //     interlinear and reference lines are excluded.
    //   - Everything else → sentence-sized chunks of the flat page text, with
    //     id null (no highlight, but still drives unit-based progress).
    function getReadingUnits() {
        const libContent = document.querySelector('.library-book__content');
        if (libContent) {
            const units = [];
            libContent.querySelectorAll('.library-book__paragraph').forEach((p) => {
                if (!p.id) return;
                let text = '';
                const translation = p.querySelector('.library-book__para-translation');
                if (translation) {
                    const clone = translation.cloneNode(true);
                    clone
                        .querySelectorAll('.library-book__commentary-link, button, sup')
                        .forEach((n) => n.remove());
                    text = (clone.textContent || '').replace(/\s+/g, ' ').trim();
                }
                if (!text) {
                    const original = p.querySelector('.library-book__para-original');
                    if (original) text = (original.textContent || '').replace(/\s+/g, ' ').trim();
                }
                if (text) units.push({ id: p.id, text });
            });
            if (units.length) return units;
        }

        const blob = getContentText();
        if (!blob) return [];
        return chunkText(blob).map((t) => ({ id: null, text: t }));
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Bar + current-time reflect the fraction of units completed. We don't know
    // real audio duration for the studio engines, so progress advances at unit
    // boundaries rather than via a wall-clock timer — honest, if stepwise.
    function setProgressFraction(fraction) {
        const percent = Math.max(0, Math.min(fraction, 1)) * 100;
        progressFill.style.width = `${percent}%`;
        progressHandle.style.left = `${percent}%`;
        timeCurrent.textContent = formatTime((fraction || 0) * estimatedDuration);
    }

    // --- Reading highlight (library pages) -----------------------------------

    function clearHighlight() {
        if (!lastHighlightedId) return;
        const prev = document.getElementById(lastHighlightedId);
        if (prev) prev.classList.remove('library-book__paragraph--reading');
        lastHighlightedId = null;
    }

    function highlightUnit(id) {
        clearHighlight();
        if (!id) return;
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.add('library-book__paragraph--reading');
        lastHighlightedId = id;
        // Auto-scroll only when the verse isn't comfortably in view, so we
        // don't yank the page on every boundary while the reader is already
        // looking at the right place.
        const rect = el.getBoundingClientRect();
        const fullyVisible = rect.top >= 80 && rect.bottom <= window.innerHeight - 120;
        if (!fullyVisible) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function showPlayer() {
        player.classList.add('audio-player--visible');
        player.setAttribute('aria-hidden', 'false');
        // `inert` mirrors aria-hidden but also removes the panel from the
        // tab order. Without it, the play/pause/close buttons remain
        // focusable even while the player is visually offscreen.
        player.removeAttribute('inert');
        document.body.classList.add('has-audio-player');
    }

    function hidePlayer() {
        player.classList.remove('audio-player--visible');
        player.setAttribute('aria-hidden', 'true');
        player.setAttribute('inert', '');
        document.body.classList.remove('has-audio-player');
    }

    const labelPlay = player.dataset.labelPlay || 'Play';
    const labelPause = player.dataset.labelPause || 'Pause';
    const labelThisPage = player.dataset.labelThisPage || 'This page';

    function updatePlayState(playing) {
        if (playing) {
            player.classList.add('audio-player--playing');
            player.classList.remove('audio-player--paused');
            playPauseBtn.setAttribute('aria-label', labelPause);
        } else {
            player.classList.remove('audio-player--playing');
            player.classList.add('audio-player--paused');
            playPauseBtn.setAttribute('aria-label', labelPlay);
        }
    }

    function showLoading(message) {
        if (!loadingEl) return;
        loadingLabel.textContent = message;
        loadingEl.classList.add('audio-player__loading--visible');
        player.classList.add('audio-player--loading');
    }

    function hideLoading() {
        if (!loadingEl) return;
        loadingEl.classList.remove('audio-player__loading--visible');
        player.classList.remove('audio-player--loading');
    }

    function setEngineLabel() {
        if (engineLabel) {
            engineLabel.textContent = engineName === 'studio' ? 'Studio voice' : 'System voice';
        }
        if (engineToggle) {
            engineToggle.setAttribute(
                'aria-label',
                engineName === 'studio'
                    ? 'Switch to system voice'
                    : 'Switch to studio voice'
            );
            engineToggle.classList.toggle('audio-player__engine--studio', engineName === 'studio');
        }
    }

    // --- Shared chunker ------------------------------------------------------

    function chunkText(text, maxChars = 480) {
        const sentences = text.match(/[^.!?。！？]+[.!?。！？]+|\s*[^.!?。！？]+$/g) || [text];
        const chunks = [];
        let buf = '';
        for (const s of sentences) {
            const piece = s.trim();
            if (!piece) continue;
            if ((buf + ' ' + piece).trim().length > maxChars && buf) {
                chunks.push(buf.trim());
                buf = piece;
            } else {
                buf = buf ? buf + ' ' + piece : piece;
            }
        }
        if (buf.trim()) chunks.push(buf.trim());
        return chunks;
    }

    // --- Engine: System (Web Speech) -----------------------------------------
    //
    // Speaks one utterance per unit, chaining on `onend`, so the controller
    // learns which unit is playing (onUnitStart) and can highlight it.

    function createSystemEngine() {
        let units = [];
        let index = 0;
        let stopped = false;
        let cbs = null;

        function pickVoice(utterance) {
            const lang = detectPageLang();
            const voices = window.speechSynthesis.getVoices();
            const langMatch = voices.find((v) => v.lang.toLowerCase().startsWith(lang.family));
            if (langMatch) utterance.voice = langMatch;
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
        }

        function speakNext() {
            if (stopped) return;
            if (index >= units.length) {
                cbs.onEnd();
                return;
            }
            const i = index++;
            const utterance = new SpeechSynthesisUtterance(units[i].text);
            pickVoice(utterance);
            utterance.onstart = () => {
                if (i === 0) cbs.onStart();
                cbs.onUnitStart(i);
            };
            utterance.onend = () => speakNext();
            utterance.onerror = (e) => {
                if (e.error === 'canceled' || e.error === 'interrupted') return;
                console.error('Speech synthesis error:', e);
                speakNext();
            };
            window.speechSynthesis.speak(utterance);
        }

        return {
            name: 'system',
            async load() {},
            speak(unitList, callbacks) {
                window.speechSynthesis.cancel();
                units = unitList;
                index = 0;
                stopped = false;
                cbs = callbacks;
                speakNext();
            },
            pause() { window.speechSynthesis.pause(); },
            resume() { window.speechSynthesis.resume(); },
            stop() {
                stopped = true;
                window.speechSynthesis.cancel();
            },
        };
    }

    // --- Shared chunked-playback runner --------------------------------------
    // Both studio engines share the same loop; only the per-unit generator
    // differs. Generation is *pipelined*: the moment a unit starts playing we
    // kick off generation of the next one, so its audio is ready when the
    // current unit ends. Without this, neural generation (seconds per verse)
    // serialized behind playback leaves an audible gap where the reading
    // highlight sits idle on a finished verse. Reports the index of each unit
    // as it begins via callbacks.onUnitStart.

    function createChunkedRunner({ generate, label }) {
        let audioEl = null;
        let units = [];
        let index = 0;            // next unit to play
        let callbacksRef = null;
        let stopped = false;
        let nextResultPromise = null; // prefetched generation for units[index]

        // Never rejects — resolves to { blob } or { error } so a prefetched
        // promise can sit unawaited for a moment without an unhandled rejection.
        function generateAt(i) {
            if (i < 0 || i >= units.length) return null;
            return generate(units[i].text).then(
                (blob) => ({ blob }),
                (error) => ({ error })
            );
        }

        async function playNext() {
            if (stopped) return;
            if (index >= units.length) {
                callbacksRef?.onEnd();
                return;
            }
            const i = index++;
            const resultPromise = nextResultPromise || generateAt(i);
            nextResultPromise = null;

            const result = await resultPromise;
            if (stopped) return;
            if (!result || result.error) {
                console.error(`${label} generation error:`, result && result.error);
                callbacksRef?.onEnd();
                return;
            }

            // Start generating the next unit while this one plays.
            nextResultPromise = generateAt(index);

            const url = URL.createObjectURL(result.blob);
            if (audioEl) {
                audioEl.pause();
                try { URL.revokeObjectURL(audioEl.src); } catch (_) {}
            }
            audioEl = new Audio(url);
            audioEl.onended = () => {
                URL.revokeObjectURL(url);
                playNext();
            };
            audioEl.onerror = (e) => {
                console.error(`${label} audio playback error:`, e);
                callbacksRef?.onEnd();
            };
            if (i === 0) callbacksRef?.onStart();
            callbacksRef?.onUnitStart(i);
            try {
                await audioEl.play();
            } catch (err) {
                console.error(`${label} playback start error:`, err);
                callbacksRef?.onEnd();
            }
        }

        return {
            start(unitList, callbacks) {
                callbacksRef = callbacks;
                stopped = false;
                units = unitList;
                index = 0;
                nextResultPromise = null;
                return playNext();
            },
            pause() { if (audioEl) audioEl.pause(); },
            resume() { if (audioEl) audioEl.play(); },
            stop() {
                stopped = true;
                nextResultPromise = null;
                if (audioEl) {
                    audioEl.pause();
                    try { URL.revokeObjectURL(audioEl.src); } catch (_) {}
                    audioEl = null;
                }
                units = [];
                index = 0;
            },
        };
    }

    // Reject if a model download/init doesn't settle in time, so a hung
    // studio load falls back to the system voice instead of spinning forever.
    function withTimeout(promise, ms, label) {
        return new Promise((resolve, reject) => {
            const t = setTimeout(
                () => reject(new Error(`${label} timed out after ${ms}ms`)),
                ms
            );
            promise.then(
                (v) => { clearTimeout(t); resolve(v); },
                (e) => { clearTimeout(t); reject(e); }
            );
        });
    }

    // --- Engine: MMS-TTS (Meta MMS / VITS via transformers.js v4) ------------

    function createMmsEngine() {
        let pipe = null;
        let runner = null;

        async function ensureLoaded() {
            if (pipe) return;
            const model = MMS_MODELS[detectPageLang().family];
            showLoading('Loading studio voice…');
            const { pipeline } = await import(
                /* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4/+esm'
            );
            // dtype 'q8' resolves to onnx/model_quantized.onnx (~36 MB) — much
            // smaller than the fp32 default, with no audible quality loss here.
            pipe = await pipeline('text-to-speech', model, {
                dtype: 'q8',
                progress_callback: (p) => {
                    if (p && p.status === 'progress' && typeof p.progress === 'number') {
                        showLoading(`Loading studio voice… ${Math.round(p.progress)}%`);
                    }
                },
            });
            hideLoading();
        }

        async function generate(text) {
            // MMS/VITS models are single-language and take no speaker embedding.
            const out = await pipe(text);
            return floatToWavBlob(out.audio, out.sampling_rate);
        }

        return {
            name: 'mms',
            async load() { await withTimeout(ensureLoaded(), 120000, 'studio voice'); },
            async speak(unitList, callbacks) {
                try {
                    await withTimeout(ensureLoaded(), 120000, 'studio voice');
                    runner = createChunkedRunner({ generate, label: 'MMS' });
                    await runner.start(unitList, callbacks);
                } catch (err) {
                    console.error('MMS engine failed:', err);
                    hideLoading();
                    callbacks.onEnd();
                    throw err;
                }
            },
            pause() { runner?.pause(); },
            resume() { runner?.resume(); },
            stop() { runner?.stop(); },
        };
    }

    // --- Engine: Piper (via @mintplex-labs/piper-tts-web) --------------------

    function createPiperEngine() {
        let piper = null;
        let runner = null;

        async function ensureLoaded() {
            if (piper) return;
            showLoading('Loading studio voice (Piper)…');
            piper = await import(
                /* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/@mintplex-labs/piper-tts-web/+esm'
            );
            hideLoading();
        }

        async function generate(text) {
            const voiceId = piperVoiceFor(detectPageLang());
            // piper-tts-web's predict() resolves to a WAV Blob. (Older guesses
            // assumed a ReadableStream; normalize either way to be safe.)
            const out = await piper.predict({ text, voiceId });
            return out instanceof Blob ? out : await new Response(out).blob();
        }

        return {
            name: 'piper',
            async load() { await withTimeout(ensureLoaded(), 120000, 'studio voice'); },
            async speak(unitList, callbacks) {
                try {
                    await withTimeout(ensureLoaded(), 120000, 'studio voice');
                    runner = createChunkedRunner({ generate, label: 'Piper' });
                    await runner.start(unitList, callbacks);
                } catch (err) {
                    console.error('Piper engine failed:', err);
                    hideLoading();
                    callbacks.onEnd();
                    throw err;
                }
            },
            pause() { runner?.pause(); },
            resume() { runner?.resume(); },
            stop() { runner?.stop(); },
        };
    }

    // --- Engine: Prerecorded (ElevenLabs audiobook served from assets CDN) ---
    //
    // Probes `{ASSETS_BASE}/audio/{lang}/{slug}/manifest.json` for the current
    // page; if a chapter listed in the manifest matches the units we're about
    // to speak, streams the MP3 and drives onUnitStart from the timing sidecar
    // against audio.currentTime. Returns null from probe() when no audiobook
    // is published for this page — caller falls back to studio/system.

    const ASSETS_BASE = (window.WOH_ASSETS_BASE || 'https://assets.wheelofheaven.world').replace(/\/$/, '');

    // The audio language code matches data-library: en, fr, de, es, ru, ja,
    // ko, zh, zh-Hant. Most match family directly; zh-Hant is the one full-tag
    // form we keep distinct.
    function audioLangCode({ family, tag }) {
        if (tag === 'zh-Hant') return 'zh-Hant';
        return family;
    }

    // Reads the book slug from a `data-book-slug` attribute on .library-book
    // (set by the template) and the visible chapter range from the units the
    // controller is about to play.
    function detectBookContext(unitList) {
        const root = document.querySelector('[data-book-slug]');
        if (!root) return null;
        const slug = root.dataset.bookSlug;
        if (!slug) return null;
        // Collect chapter numbers from the unit IDs (c{ch}p{n}).
        const chapters = new Set();
        for (const u of unitList) {
            if (!u.id) continue;
            const m = u.id.match(/^c(\d+)p\d+$/);
            if (m) chapters.add(parseInt(m[1], 10));
        }
        return { slug, chapters: [...chapters].sort((a, b) => a - b) };
    }

    // Per-page manifest cache so the player doesn't refetch.
    let manifestCache = null;
    async function fetchManifest(slug, lang) {
        if (manifestCache && manifestCache.slug === slug && manifestCache.lang === lang) {
            return manifestCache.data;
        }
        const url = `${ASSETS_BASE}/audio/${lang}/${slug}/manifest.json`;
        try {
            const r = await fetch(url, { cache: 'no-cache' });
            if (!r.ok) {
                manifestCache = { slug, lang, data: null };
                return null;
            }
            const data = await r.json();
            manifestCache = { slug, lang, data };
            return data;
        } catch (e) {
            manifestCache = { slug, lang, data: null };
            return null;
        }
    }

    // Lazily wrap each whitespace-separated word in a paragraph's
    // translation text into <span class="library-book__word">. Returns the
    // ordered NodeList of word spans, or null if the paragraph DOM isn't
    // present. Idempotent: subsequent calls return the existing spans.
    // Skips text inside the commentary button so the wrap doesn't fight
    // the commentary popover.
    function wrapParagraphWords(unitId) {
        if (!unitId) return null;
        const para = document.getElementById(unitId);
        if (!para) return null;
        const target = para.querySelector('.library-book__para-translation') || para;
        const existing = target.querySelectorAll('.library-book__word');
        if (existing.length > 0) return existing;
        const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
        const textNodes = [];
        let n;
        while ((n = walker.nextNode())) {
            if (n.parentElement && n.parentElement.closest('.library-book__commentary-link')) continue;
            textNodes.push(n);
        }
        textNodes.forEach((tn) => {
            const text = tn.nodeValue;
            if (!text || !text.trim()) return;
            const parts = text.split(/(\s+)/);
            const frag = document.createDocumentFragment();
            parts.forEach((p) => {
                if (!p) return;
                if (/^\s+$/.test(p)) {
                    frag.appendChild(document.createTextNode(p));
                } else {
                    const span = document.createElement('span');
                    span.className = 'library-book__word';
                    span.textContent = p;
                    frag.appendChild(span);
                }
            });
            tn.parentNode.replaceChild(frag, tn);
        });
        return target.querySelectorAll('.library-book__word');
    }

    function createPrerecordedEngine() {
        let audioEl = null;
        let timing = null;
        let stopped = false;
        let cbs = null;
        let unitIdxByParaN = null;
        let lastUnitIdx = -1;
        // Word-highlight state. Reset whenever the active paragraph changes.
        let currentParaSpans = null;        // NodeList of .library-book__word for the active paragraph
        let currentParaWords = null;        // timing words[] for the active paragraph
        let currentWordSpan = null;         // span currently carrying --reading
        let wordMismatchLogged = false;     // throttle the warn to once per session

        // Returns { audioUrl, timing, chapters } if any chapter the units span
        // has pre-recorded audio, otherwise null. When multiple chapters appear
        // in the unit list (rare — library pages usually show one), the first
        // chapter wins; the rest fall through to the generative engines for
        // a later run.
        async function probe(unitList) {
            const ctx = detectBookContext(unitList);
            if (!ctx) return null;
            const lang = audioLangCode(detectPageLang());
            const manifest = await fetchManifest(ctx.slug, lang);
            if (!manifest || !manifest.chapters || !manifest.chapters.length) return null;
            const availableChapters = new Set(manifest.chapters.map((c) => c.n));
            const targetChapter = ctx.chapters.find((n) => availableChapters.has(n));
            if (!targetChapter) return null;
            const chapEntry = manifest.chapters.find((c) => c.n === targetChapter);
            const timingUrl = `${ASSETS_BASE}/${chapEntry.timing_url}`;
            try {
                const r = await fetch(timingUrl, { cache: 'force-cache' });
                if (!r.ok) return null;
                const timingData = await r.json();
                return {
                    audioUrl: `${ASSETS_BASE}/${chapEntry.audio_url}`,
                    timing: timingData,
                    chapter: targetChapter,
                };
            } catch (e) {
                return null;
            }
        }

        function teardownAudio() {
            if (!audioEl) return;
            audioEl.pause();
            audioEl.onended = null;
            audioEl.ontimeupdate = null;
            audioEl.onerror = null;
            audioEl.onplay = null;
            audioEl.onpause = null;
            audioEl = null;
        }

        return {
            name: 'prerecorded',
            probe,
            async load() {},
            async speak(unitList, callbacks, probeData) {
                cbs = callbacks;
                stopped = false;
                lastUnitIdx = -1;
                const data = probeData || (await probe(unitList));
                if (!data) throw new Error('prerecorded: no audio available');
                timing = data.timing;
                // Build a map from paragraph number → index in unitList so we
                // can call onUnitStart with the controller's view of position.
                unitIdxByParaN = {};
                unitList.forEach((u, i) => {
                    if (!u.id) return;
                    const m = u.id.match(/^c(\d+)p(\d+)$/);
                    if (m && parseInt(m[1], 10) === data.chapter) {
                        unitIdxByParaN[parseInt(m[2], 10)] = i;
                    }
                });

                teardownAudio();
                audioEl = new Audio(data.audioUrl);
                audioEl.preload = 'auto';

                audioEl.onplay = () => {
                    if (stopped) return;
                    cbs.onStart && cbs.onStart();
                };
                audioEl.onpause = () => {
                    if (stopped || audioEl.ended) return;
                    cbs.onPause && cbs.onPause();
                };
                audioEl.ontimeupdate = () => {
                    if (stopped || !audioEl) return;
                    const t = audioEl.currentTime;
                    // Find the paragraph currently being read. timing is small
                    // (dozens to hundreds of entries) so linear search is fine.
                    let current = null;
                    for (const p of timing.paragraphs) {
                        if (t >= p.start && t < p.end) {
                            current = p;
                            break;
                        }
                    }
                    if (!current) return;
                    const idx = unitIdxByParaN[current.n];
                    if (idx !== undefined && idx !== lastUnitIdx) {
                        cbs.onUnitStart && cbs.onUnitStart(idx);
                        lastUnitIdx = idx;
                        // Set up word-level highlighting for this paragraph.
                        if (currentWordSpan) {
                            currentWordSpan.classList.remove('library-book__word--reading');
                            currentWordSpan = null;
                        }
                        currentParaWords = current.words || null;
                        currentParaSpans = null;
                        if (currentParaWords && unitList[idx] && unitList[idx].id) {
                            const spans = wrapParagraphWords(unitList[idx].id);
                            if (spans && spans.length === currentParaWords.length) {
                                currentParaSpans = spans;
                            } else if (spans && !wordMismatchLogged) {
                                console.warn(
                                    'listen-button: word count mismatch on',
                                    unitList[idx].id,
                                    '— display:', spans.length,
                                    'audio:', currentParaWords.length,
                                    '(falling back to paragraph-only highlight)'
                                );
                                wordMismatchLogged = true;
                            }
                        }
                    }
                    // Word-level highlight inside the active paragraph.
                    if (currentParaSpans && currentParaWords) {
                        let wIdx = -1;
                        for (let i = 0; i < currentParaWords.length; i++) {
                            const w = currentParaWords[i];
                            if (t >= w.start && t < w.end) { wIdx = i; break; }
                        }
                        const next = wIdx >= 0 ? currentParaSpans[wIdx] : null;
                        if (next !== currentWordSpan) {
                            if (currentWordSpan) {
                                currentWordSpan.classList.remove('library-book__word--reading');
                            }
                            if (next) next.classList.add('library-book__word--reading');
                            currentWordSpan = next;
                        }
                    }
                };
                audioEl.onended = () => {
                    if (stopped) return;
                    cbs.onEnd && cbs.onEnd();
                };
                audioEl.onerror = (e) => {
                    console.error('prerecorded audio error:', e);
                    cbs.onEnd && cbs.onEnd();
                };

                try {
                    await audioEl.play();
                } catch (err) {
                    console.error('prerecorded play failed:', err);
                    throw err;
                }
            },
            pause() {
                if (audioEl) audioEl.pause();
            },
            resume() {
                if (audioEl) audioEl.play();
            },
            stop() {
                stopped = true;
                teardownAudio();
                unitIdxByParaN = null;
                lastUnitIdx = -1;
                if (currentWordSpan) {
                    currentWordSpan.classList.remove('library-book__word--reading');
                }
                currentWordSpan = null;
                currentParaSpans = null;
                currentParaWords = null;
            },
        };
    }

    // --- Engine resolver (studio = mms | piper, picked per language) ---------

    function getEngine() {
        if (currentEngine && currentEngine.name === engineDescriptor()) return currentEngine;
        if (currentEngine) currentEngine.stop();

        const sub = engineDescriptor();
        if (sub === 'mms') currentEngine = createMmsEngine();
        else if (sub === 'piper') currentEngine = createPiperEngine();
        else currentEngine = createSystemEngine();
        return currentEngine;
    }

    // Resolve which concrete engine should run right now. Studio routes to a
    // language-specific sub-engine, but once studio has failed this session we
    // pin to system so retries don't loop back into the broken studio load.
    function engineDescriptor() {
        if (engineName !== 'studio' || studioFailedThisSession) return 'system';
        return studioEngineFor(detectPageLang()) || 'system';
    }

    // --- Float32 PCM → WAV blob helper (MMS-TTS output) ----------------------

    function floatToWavBlob(samples, sampleRate) {
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);
        const writeStr = (offset, s) => {
            for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
        };
        writeStr(0, 'RIFF');
        view.setUint32(4, 36 + samples.length * 2, true);
        writeStr(8, 'WAVE');
        writeStr(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeStr(36, 'data');
        view.setUint32(40, samples.length * 2, true);
        let offset = 44;
        for (let i = 0; i < samples.length; i++, offset += 2) {
            const s = Math.max(-1, Math.min(1, samples[i]));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        }
        return new Blob([buffer], { type: 'audio/wav' });
    }

    // --- Playback control ----------------------------------------------------

    function onUnitStart(i) {
        const unit = playQueue[i];
        if (unit) highlightUnit(unit.id);
        // Fraction reflects the start of unit i; bar advances per unit.
        const total = playQueue.length || 1;
        setProgressFraction(i / total);
    }

    // Cached prerecorded engine + probe result. Probe is async; we run it once
    // per session so the next speak() can route to it without re-fetching the
    // manifest. Falsy probeData means "not available — fall through to studio".
    let prerecordedEngine = null;
    let prerecordedProbed = false;
    let prerecordedData = null;

    async function tryPrerecorded(unitList) {
        if (!prerecordedEngine) prerecordedEngine = createPrerecordedEngine();
        if (!prerecordedProbed) {
            try {
                prerecordedData = await prerecordedEngine.probe(unitList);
            } catch (_e) {
                prerecordedData = null;
            }
            prerecordedProbed = true;
        }
        return prerecordedData;
    }

    const callbackBundle = {
        onStart: () => {
            isPlaying = true;
            isPaused = false;
            updatePlayState(true);
        },
        onUnitStart,
        onPause: () => {
            isPaused = true;
            updatePlayState(false);
        },
        onResume: () => {
            isPaused = false;
            updatePlayState(true);
        },
        onEnd: () => {
            isPlaying = false;
            isPaused = false;
            setProgressFraction(1);
            clearHighlight();
            updatePlayState(false);
        },
    };

    async function speak() {
        playQueue = getReadingUnits();
        if (!playQueue.length) return;

        const totalWords = playQueue.reduce(
            (n, u) => n + u.text.split(/\s+/).length,
            0
        );
        estimatedDuration = (totalWords / 150) * 60;

        const pageTitle = document.title.split('|')[0].trim() || labelThisPage;
        titleEl.textContent = pageTitle;
        timeTotal.textContent = formatTime(estimatedDuration);
        setProgressFraction(0);

        showPlayer();

        // 1. Prerecorded first if available — highest fidelity, no generation
        // cost, paragraph highlight via timing sidecar.
        const probeData = await tryPrerecorded(playQueue);
        if (probeData) {
            currentEngine = prerecordedEngine;
            try {
                await prerecordedEngine.speak(playQueue, callbackBundle, probeData);
                return;
            } catch (err) {
                console.error('prerecorded failed, falling through:', err);
                // fall through to generated engines
            }
        }

        // 2. Studio/system as before.
        let engine = getEngine();
        try {
            await engine.speak(playQueue, callbackBundle);
        } catch (_err) {
            // Studio engine failed/timed out (CDN block, WASM unsupported,
            // incompatible model, slow link). Pin to system for the rest of
            // the session — without flipping the user's saved preference — and
            // replay. The session flag stops getEngine() from re-selecting the
            // broken studio engine on the retry.
            if (hasWebSpeech && engine.name !== 'system') {
                studioFailedThisSession = true;
                currentEngine = null;
                await speak();
            }
        }
    }

    function togglePlayPause() {
        if (!isPlaying && !isPaused) {
            speak();
        } else if (isPlaying && !isPaused) {
            (currentEngine || getEngine()).pause();
            isPaused = true;
            updatePlayState(false);
        } else if (isPaused) {
            (currentEngine || getEngine()).resume();
            isPaused = false;
            isPlaying = true;
            updatePlayState(true);
        }
    }

    function stop() {
        if (currentEngine) currentEngine.stop();
        isPlaying = false;
        isPaused = false;
        clearHighlight();
        hidePlayer();
        hideLoading();
        setProgressFraction(0);
        timeCurrent.textContent = '0:00';
    }

    function toggleEngine() {
        const wasPlaying = isPlaying || isPaused;
        if (wasPlaying) {
            if (currentEngine) currentEngine.stop();
            isPlaying = false;
            isPaused = false;
            updatePlayState(false);
        }
        engineName = engineName === 'studio' ? 'system' : 'studio';
        if (engineName === 'studio' && !window.WebAssembly) engineName = 'system';
        localStorage.setItem(STORAGE_KEY, engineName);
        currentEngine = null;
        // Explicit toggle is a fresh intent — let studio be retried even if it
        // failed earlier this session.
        studioFailedThisSession = false;
        setEngineLabel();
        if (wasPlaying) speak();
    }

    // --- Wire up -------------------------------------------------------------

    setEngineLabel();

    trigger.addEventListener('click', () => {
        if (!isPlaying && !isPaused) speak();
        else showPlayer();
    });
    playPauseBtn.addEventListener('click', togglePlayPause);
    closeBtn.addEventListener('click', stop);
    if (engineToggle) engineToggle.addEventListener('click', toggleEngine);

    if (hasWebSpeech && speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => {};
    }

    window.addEventListener('beforeunload', stop);
})();
