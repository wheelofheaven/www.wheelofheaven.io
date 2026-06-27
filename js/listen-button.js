// Listen-to-this-page feature
//
// Three engines, tried in this order:
//   - "prerecorded": pre-rendered ElevenLabs audio play for the current
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
// UI for it; if the manifest exists for this page, you get the audio play.
// Engine preference is persisted in localStorage under `woh:listen:engine`.
//
// Playback is unit-based: the page is split into an ordered list of reading
// units. On library-book pages each unit is one verse paragraph (carrying its
// DOM id `c{ch}p{n}`); elsewhere units are sentence-sized chunks of the page
// text with no id. All three engines report the index of the unit currently
// being read, which drives the reading highlight (library pages) and the
// progress bar.

(function () {
    const triggers = Array.from(document.querySelectorAll('.listen-trigger'));
    if (!triggers.length) return;
    const trigger = triggers[0];

    const player = document.getElementById('audioPlayer');
    const playPauseBtn = document.getElementById('audioPlayPause');
    const closeBtn = document.getElementById('audioClose');
    const progressFill = document.getElementById('audioProgressFill');
    const progressHandle = document.getElementById('audioProgressHandle');
    const timeCurrent = document.getElementById('audioTimeCurrent');
    const timeTotal = document.getElementById('audioTimeTotal');
    const titleEl = document.querySelector('.audio-player__title-text');
    // v4.3 — chapter title + jump overlay
    const chapterTextEl = document.querySelector('.audio-player__chapter-text');
    const titleButton = document.getElementById('audioTitle');
    const chapterMenu = document.getElementById('audioChapterMenu');
    const titleBookRow = document.querySelector('.audio-player__title-row--book');
    const titleChapterRow = document.querySelector('.audio-player__title-row--chapter');
    const engineToggle = document.getElementById('audioEngineToggle');
    const engineLabel = document.getElementById('audioEngineLabel');
    const loadingEl = document.getElementById('audioLoading');
    const loadingLabel = document.getElementById('audioLoadingLabel');

    const STORAGE_KEY = 'woh:listen:engine';
    const hasWebSpeech = 'speechSynthesis' in window;

    if (!hasWebSpeech && !window.WebAssembly) {
        triggers.forEach((t) => { t.style.display = 'none'; });
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
        // v4.4 — keep the play-button progress ring in sync too.
        if (playPauseBtn) playPauseBtn.style.setProperty('--progress', percent.toFixed(2));
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

    // --- Engine: Prerecorded (ElevenLabs audio play served from assets CDN) ---
    //
    // Probes `{ASSETS_BASE}/audio/{lang}/{slug}/manifest.json` for the current
    // page; if a chapter listed in the manifest matches the units we're about
    // to speak, streams the MP3 and drives onUnitStart from the timing sidecar
    // against audio.currentTime. Returns null from probe() when no audio play
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

    // v4 — Immersive Mode: ambient bed on a second <audio> element, synced
    // to the voice track. Persisted across sessions in localStorage under
    // `woh:listen:immersive`. **On by default** during the v4 rollout so
    // chapters with an ambient_url surface it without hidden settings; a
    // user can disable per-session in DevTools via:
    //     localStorage.setItem('woh:listen:immersive', '0')
    // A first-class UI toggle in the audio player bar is planned but not
    // shipped yet.
    const IMMERSIVE_STORAGE_KEY = 'woh:listen:immersive';
    function isImmersiveEnabled() {
        try {
            const v = localStorage.getItem(IMMERSIVE_STORAGE_KEY);
            return v === null ? true : v === '1';
        } catch (e) { return true; }
    }
    function setImmersiveEnabled(v) {
        try { localStorage.setItem(IMMERSIVE_STORAGE_KEY, v ? '1' : '0'); }
        catch (e) {}
    }

    function createPrerecordedEngine() {
        let audioEl = null;
        let ambientEl = null;               // v4: second <audio> for ambient bed
        let ambientDriftTimer = null;       // v4: setInterval handle for sync correction
        let timing = null;
        let stopped = false;
        let cbs = null;
        let unitIdxByParaN = null;
        let lastUnitIdx = -1;
        // Word-highlight state. Reset whenever the active paragraph changes.
        let currentParaSpans = null;        // NodeList of .library-book__word for the active paragraph
        let currentParaWords = null;        // timing words[] for the active paragraph
        let currentWordSpan = null;         // span currently carrying --reading
        let prevWordSpan = null;            // v4.3: span carrying --reading-prev (trail)
        let wordMismatchLogged = false;     // throttle the warn to once per session
        // v4.2: chapter sequencing — manifest + book context persist across
        // chapter swaps so onended can auto-advance to the next chapter.
        let manifestRef = null;
        let bookSlugRef = null;
        let bookLangRef = null;
        let unitListRef = null;
        let currentChapter = null;

        async function probe(unitList) {
            const ctx = detectBookContext(unitList);
            if (!ctx) return null;
            const lang = audioLangCode(detectPageLang());
            const manifest = await fetchManifest(ctx.slug, lang);
            if (!manifest || !manifest.chapters || !manifest.chapters.length) return null;
            const availableChapters = new Set(manifest.chapters.map((c) => c.n));
            const targetChapter = ctx.chapters.find((n) => availableChapters.has(n));
            if (!targetChapter) return null;
            return {
                chapter: targetChapter,
                manifest: manifest,
                slug: ctx.slug,
                lang: lang,
            };
        }

        // v4.2: Load and play a specific chapter, swapping the audio + ambient
        // elements in place. Used by speak() for the initial chapter and by
        // the onended handler for auto-advance. Returns true if it started
        // playback, false if no manifest entry exists for the chapter (book
        // is finished).
        async function playChapter(chapterN) {
            if (stopped) return false;
            const chapEntry = manifestRef.chapters.find((c) => c.n === chapterN);
            if (!chapEntry) return false;
            try {
                // Revalidate: timing sidecars keep stable, unhashed names and
                // are regenerated on every render. force-cache would pin a
                // stale sidecar against re-rendered audio (the ¶-seek drift
                // bug). no-cache => conditional GET, cheap 304 when unchanged.
                const r = await fetch(`${ASSETS_BASE}/${chapEntry.timing_url}`, { cache: 'no-cache' });
                if (!r.ok) return false;
                timing = await r.json();
            } catch (e) { return false; }

            currentChapter = chapterN;
            lastUnitIdx = -1;
            currentParaSpans = null;
            currentParaWords = null;
            if (currentWordSpan) {
                currentWordSpan.classList.remove('library-book__word--reading');
                currentWordSpan = null;
            }
            if (prevWordSpan) {
                prevWordSpan.classList.remove('library-book__word--reading-prev');
                prevWordSpan = null;
            }
            unitIdxByParaN = {};
            unitListRef.forEach((u, i) => {
                if (!u.id) return;
                const m = u.id.match(/^c(\d+)p(\d+)$/);
                if (m && parseInt(m[1], 10) === chapterN) {
                    unitIdxByParaN[parseInt(m[2], 10)] = i;
                }
            });
            teardownAudio();
            wireAudio({
                audioUrl: `${ASSETS_BASE}/${chapEntry.audio_url}`,
                formats: chapEntry.formats || null,
                ambientUrl: chapEntry.ambient_url ? `${ASSETS_BASE}/${chapEntry.ambient_url}` : null,
            });
            // v4.3: notify the controller of the chapter change so it can
            // update the title row + chapter-menu highlight.
            if (cbs.onChapterChange) {
                cbs.onChapterChange({
                    n: chapterN,
                    title: chapEntry.title || `Chapter ${chapterN}`,
                });
            }
            try {
                await audioEl.play();
                return true;
            } catch (err) {
                console.error('prerecorded play failed:', err);
                return false;
            }
        }

        // v4.2: Construct audioEl + ambientEl and wire all event handlers.
        // Extracted from speak() so playChapter() can call it per-chapter swap.
        function wireAudio(data) {
            audioEl = new Audio();
            if (data.formats && data.formats.length) {
                for (const f of data.formats) {
                    const s = document.createElement('source');
                    s.src = `${ASSETS_BASE}/${f.url}`;
                    s.type = f.type;
                    audioEl.appendChild(s);
                }
                // .load() ensures the browser actually picks a source.
                // Without it, .play() may work but currentTime / duration
                // stay degraded — breaking word-highlight and progress.
                audioEl.load();
            } else {
                audioEl.src = data.audioUrl;
            }
            audioEl.preload = 'auto';

            if (data.ambientUrl && isImmersiveEnabled()) {
                ambientEl = new Audio(data.ambientUrl);
                ambientEl.preload = 'auto';
                ambientEl.loop = false;
                ambientEl.onerror = () => {
                    console.warn('listen-button: ambient track failed; voice continues');
                    ambientEl = null;
                };
            }

            audioEl.onplay = () => {
                if (stopped) return;
                if (ambientEl) {
                    ambientEl.currentTime = audioEl.currentTime;
                    ambientEl.play().catch(() => {});
                }
                cbs.onStart && cbs.onStart();
            };
            audioEl.onpause = () => {
                if (stopped || audioEl.ended) return;
                if (ambientEl) ambientEl.pause();
                cbs.onPause && cbs.onPause();
            };
            audioEl.onseeked = () => {
                if (ambientEl) ambientEl.currentTime = audioEl.currentTime;
            };
            audioEl.ontimeupdate = () => {
                if (stopped || !audioEl) return;
                const t = audioEl.currentTime;
                if (audioEl.duration && cbs.onProgress) {
                    cbs.onProgress(t / audioEl.duration, t, audioEl.duration);
                }
                let current = null;
                for (const p of timing.paragraphs) {
                    if (t >= p.start && t < p.end) { current = p; break; }
                }
                if (!current) return;
                const idx = unitIdxByParaN[current.n];
                if (idx !== undefined && idx !== lastUnitIdx) {
                    cbs.onUnitStart && cbs.onUnitStart(idx);
                    lastUnitIdx = idx;
                    if (currentWordSpan) {
                        currentWordSpan.classList.remove('library-book__word--reading');
                        currentWordSpan = null;
                    }
                    // v4.3 trail: clear any --reading-prev when paragraph
                    // changes so we don't leave a stale span behind.
                    if (prevWordSpan) {
                        prevWordSpan.classList.remove('library-book__word--reading-prev');
                        prevWordSpan = null;
                    }
                    currentParaWords = current.words || null;
                    currentParaSpans = null;
                    if (currentParaWords && unitListRef[idx] && unitListRef[idx].id) {
                        const spans = wrapParagraphWords(unitListRef[idx].id);
                        if (spans && spans.length === currentParaWords.length) {
                            currentParaSpans = spans;
                        } else if (spans && !wordMismatchLogged) {
                            console.warn(
                                'listen-button: word count mismatch on',
                                unitListRef[idx].id,
                                '— display:', spans.length,
                                'audio:', currentParaWords.length,
                                '(falling back to paragraph-only highlight)'
                            );
                            wordMismatchLogged = true;
                        }
                    }
                }
                if (currentParaSpans && currentParaWords) {
                    let wIdx = -1;
                    for (let i = 0; i < currentParaWords.length; i++) {
                        const w = currentParaWords[i];
                        if (t >= w.start && t < w.end) { wIdx = i; break; }
                    }
                    const next = wIdx >= 0 ? currentParaSpans[wIdx] : null;
                    if (next !== currentWordSpan) {
                        // v4.3 trail: the word that was the leading word
                        // becomes the trailing word; the word that WAS
                        // trailing (if any) goes back to default colour.
                        if (prevWordSpan && prevWordSpan !== next) {
                            prevWordSpan.classList.remove('library-book__word--reading-prev');
                        }
                        if (currentWordSpan && currentWordSpan !== next) {
                            currentWordSpan.classList.remove('library-book__word--reading');
                            currentWordSpan.classList.add('library-book__word--reading-prev');
                            prevWordSpan = currentWordSpan;
                        }
                        if (next) {
                            // If `next` was the trailing word, remove that
                            // marker before promoting it to leading.
                            next.classList.remove('library-book__word--reading-prev');
                            next.classList.add('library-book__word--reading');
                        }
                        currentWordSpan = next;
                    }
                }
            };
            audioEl.onended = () => {
                if (stopped) return;
                if (ambientEl) ambientEl.pause();
                // v4.2: auto-advance to the next chapter if one exists.
                const next = manifestRef.chapters.find((c) => c.n > currentChapter);
                if (next) {
                    playChapter(next.n).then((ok) => {
                        if (!ok && !stopped) cbs.onEnd && cbs.onEnd();
                    });
                    return;
                }
                cbs.onEnd && cbs.onEnd();
            };
            audioEl.onerror = (e) => {
                console.error('prerecorded audio error:', e);
                if (ambientEl) ambientEl.pause();
                cbs.onEnd && cbs.onEnd();
            };

            if (ambientEl) {
                ambientDriftTimer = setInterval(() => {
                    if (stopped || !audioEl || !ambientEl) return;
                    if (audioEl.paused) return;
                    const dt = Math.abs(ambientEl.currentTime - audioEl.currentTime);
                    if (dt > 0.15) ambientEl.currentTime = audioEl.currentTime;
                }, 5000);
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
            // v4: tear down the ambient second track in lockstep.
            if (ambientDriftTimer) {
                clearInterval(ambientDriftTimer);
                ambientDriftTimer = null;
            }
            if (ambientEl) {
                ambientEl.pause();
                ambientEl.onerror = null;
                ambientEl = null;
            }
        }

        return {
            name: 'prerecorded',
            probe,
            async load() {},
            async speak(unitList, callbacks, probeData) {
                cbs = callbacks;
                stopped = false;
                const data = probeData || (await probe(unitList));
                if (!data) throw new Error('prerecorded: no audio available');
                manifestRef = data.manifest;
                bookSlugRef = data.slug;
                bookLangRef = data.lang;
                unitListRef = unitList;
                const ok = await playChapter(data.chapter);
                if (!ok) throw new Error('prerecorded: failed to load first chapter');
            },
            pause() {
                if (audioEl) audioEl.pause();
            },
            // v4.1 — drag-to-seek support. Controller passes a 0..1 ratio
            // from a click/drag on the progress bar; we map it directly to
            // audioEl.currentTime. Ambient track follows via onseeked.
            seek(ratio) {
                if (!audioEl || !audioEl.duration) return;
                const r = Math.max(0, Math.min(1, ratio));
                audioEl.currentTime = r * audioEl.duration;
            },
            // v4.3 — direct jump to a chapter by manifest number. Used by
            // the chapter-jump overlay. Reuses the same playChapter() path
            // as initial speak() and auto-advance, so behavior stays uniform.
            jumpToChapter(n) {
                if (!manifestRef) return;
                playChapter(n);
            },
            // Seeks playback to the paragraph identified by `c{ch}p{n}`.
            // If the paragraph is in the currently-loaded chapter, sets
            // audio.currentTime directly; otherwise loads the right chapter
            // via playChapter() first and then seeks inside it. Returns true
            // when a seek was attempted, false if there's no engine context
            // or the id doesn't resolve. Used by the click-to-seek
            // paragraph handler wired below.
            async seekToParagraph(id) {
                if (!manifestRef || !id) return false;
                const m = id.match(/^c(\d+)p(\d+)$/);
                if (!m) return false;
                const targetChap = parseInt(m[1], 10);
                const targetPara = parseInt(m[2], 10);
                if (targetChap !== currentChapter) {
                    const ok = await playChapter(targetChap);
                    if (!ok || stopped) return false;
                }
                if (!audioEl || !timing) return false;
                const p = timing.paragraphs.find((p) => p.n === targetPara);
                if (!p) return false;
                audioEl.currentTime = p.start;
                if (audioEl.paused) {
                    try { await audioEl.play(); } catch (_e) {}
                }
                return true;
            },
            // v4.3 — expose the manifest + current chapter so the controller
            // can populate the chapter-jump menu and mark the active row.
            getManifest() { return manifestRef; },
            getCurrentChapter() { return currentChapter; },
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
                if (prevWordSpan) {
                    prevWordSpan.classList.remove('library-book__word--reading-prev');
                }
                currentWordSpan = null;
                prevWordSpan = null;
                currentParaSpans = null;
                currentParaWords = null;
                // v4.2: clear chapter-sequencing state too.
                manifestRef = null;
                unitListRef = null;
                currentChapter = null;
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

    // --- v5: Cinematic view --------------------------------------------------
    //
    // A fullscreen presentation mode for prerecorded audio plays: scene images
    // as a crossfading slideshow behind the current sentence, rendered as a
    // caption — so the page reads like a video. It is a pure *consumer* of the
    // prerecorded engine's existing callbacks (onChapterChange → which chapter,
    // onProgress → current second) plus a per-chapter `c{n}.cinematic.json`
    // sidecar built by data-cinematics/audiobook/build_timeline.py. No
    // playback path changes. When a scene image isn't published yet it falls
    // back to a gradient backdrop, so the whole mode works before any art
    // exists. Visual spec mirrors data-cinematics/audiobook/style/<book>.json.

    const CINEMATIC_IMG_BASE = `${ASSETS_BASE}/images/cinematic`;

    function createCinematicView() {
        const root = document.getElementById('cinematicView');
        const captionEl = document.getElementById('cinematicCaption');
        const speakerEl = document.getElementById('cinematicSpeaker');
        const textEl = document.getElementById('cinematicText');
        const layers = root ? Array.from(root.querySelectorAll('.cinematic__bg')) : [];
        if (!root || !captionEl || !textEl || layers.length < 2) {
            // Page has no cinematic overlay (non-library, or partial absent).
            const noop = () => {};
            return { enabled: false, isOpen: () => false, open: noop, close: noop,
                     toggle: noop, onChapter: async () => {}, onTime: noop, setPlaying: noop };
        }

        let open = false;
        let data = null;            // cinematic.json for the loaded chapter
        let slug = null;
        let lang = null;
        let fetchToken = 0;         // guards against out-of-order chapter loads
        let activeLayer = layers[0];
        let currentSceneKey = null;
        let currentCaptionIdx = -1;

        function bookContext() {
            const el = document.querySelector('[data-book-slug]');
            return {
                slug: el ? el.dataset.bookSlug : null,
                lang: audioLangCode(detectPageLang()),
            };
        }

        async function loadChapter(n) {
            const ctx = bookContext();
            if (!ctx.slug) { data = null; return; }
            slug = ctx.slug;
            lang = ctx.lang;
            currentSceneKey = null;
            currentCaptionIdx = -1;
            const token = ++fetchToken;
            try {
                const url = `${ASSETS_BASE}/audio/${lang}/${slug}/c${n}.cinematic.json`;
                const r = await fetch(url, { cache: 'no-cache' });
                if (token !== fetchToken) return;   // superseded by a newer load
                data = r.ok ? await r.json() : null;
            } catch (e) {
                if (token === fetchToken) data = null;
            }
        }

        function setLayerImage(layer, image) {
            layer.classList.remove('cinematic__bg--fallback', 'cinematic__bg--kenburns');
            if (!image) {
                layer.style.backgroundImage = '';
                layer.classList.add('cinematic__bg--fallback');
                return;
            }
            const url = `${CINEMATIC_IMG_BASE}/${slug}/${image}.jpg`;
            // Probe first so a missing still degrades to the gradient instead
            // of flashing a broken image. (Scene art is Phase 1b.)
            const probe = new Image();
            probe.onload = () => {
                layer.style.backgroundImage = `url("${url}")`;
                // Restart the Ken Burns drift for the new still.
                layer.classList.remove('cinematic__bg--kenburns');
                void layer.offsetWidth;
                layer.classList.add('cinematic__bg--kenburns');
            };
            probe.onerror = () => {
                layer.style.backgroundImage = '';
                layer.classList.add('cinematic__bg--fallback');
            };
            probe.src = url;
        }

        function renderScene(t) {
            if (!data || !data.scenes) return;
            let scene = null;
            for (const s of data.scenes) {
                if (t >= s.start && t < s.end) { scene = s; break; }
            }
            const key = scene ? scene.scene : 'default';
            if (key === currentSceneKey) return;
            currentSceneKey = key;
            const incoming = activeLayer === layers[0] ? layers[1] : layers[0];
            setLayerImage(incoming, scene ? scene.image : null);
            incoming.classList.add('is-active');
            activeLayer.classList.remove('is-active');
            activeLayer = incoming;
        }

        function renderCaption(t) {
            if (!data || !data.captions) return;
            let idx = -1;
            for (let i = 0; i < data.captions.length; i++) {
                const cap = data.captions[i];
                if (t >= cap.start && t < cap.end) { idx = i; break; }
            }
            if (idx === currentCaptionIdx) return;
            currentCaptionIdx = idx;
            const cap = idx >= 0 ? data.captions[idx] : null;
            if (!cap) {
                captionEl.classList.remove('is-visible');
                return;
            }
            textEl.textContent = cap.text;
            const showSpeaker = !!cap.speaker && cap.kind !== 'body';
            speakerEl.textContent = showSpeaker ? cap.speaker : '';
            speakerEl.hidden = !showSpeaker;
            // Re-trigger the fade-in transition for the new line.
            captionEl.classList.remove('is-visible');
            void captionEl.offsetWidth;
            captionEl.classList.add('is-visible');
        }

        return {
            enabled: true,
            isOpen() { return open; },
            open() {
                if (open) return;
                open = true;
                root.classList.add('cinematic--open');
                root.setAttribute('aria-hidden', 'false');
                root.removeAttribute('inert');
                document.body.classList.add('has-cinematic');
            },
            close() {
                if (!open) return;
                open = false;
                root.classList.remove('cinematic--open');
                root.setAttribute('aria-hidden', 'true');
                root.setAttribute('inert', '');
                document.body.classList.remove('has-cinematic');
            },
            toggle() { this.isOpen() ? this.close() : this.open(); },
            // Called from onChapterChange — fetch that chapter's timeline.
            async onChapter(n) { await loadChapter(n); },
            // Called from onProgress with the chapter-local current second.
            onTime(seconds) {
                if (!open || typeof seconds !== 'number') return;
                renderScene(seconds);
                renderCaption(seconds);
            },
            setPlaying(playing) {
                root.classList.toggle('cinematic--playing', !!playing);
                const btn = document.getElementById('cinematicPlayPause');
                if (btn) btn.setAttribute('aria-label', playing ? labelPause : labelPlay);
            },
        };
    }

    const cinematic = createCinematicView();

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
            startTitleCycle();
            cinematic.setPlaying(true);
        },
        onUnitStart,
        // v4.1 — onProgress is emitted by engines that have a real
        // continuous timeline (currently only the prerecorded engine).
        // Studio/system engines stay paragraph-discrete via onUnitStart.
        // We snap the visual progress bar to the real audio position
        // here, so it advances smoothly between paragraph boundaries
        // and reflects user seeks immediately.
        onProgress: (ratio, currentSeconds, totalSeconds) => {
            const percent = Math.max(0, Math.min(ratio, 1)) * 100;
            progressFill.style.width = `${percent}%`;
            progressHandle.style.left = `${percent}%`;
            // v4.4 — also drive the play button's circular progress ring.
            // The SVG fill's stroke-dashoffset reads --progress 0..100
            // from the .audio-player__play element.
            if (playPauseBtn) playPauseBtn.style.setProperty('--progress', percent.toFixed(2));
            if (typeof currentSeconds === 'number') {
                timeCurrent.textContent = formatTime(currentSeconds);
            }
            if (typeof totalSeconds === 'number' && totalSeconds && !Number.isNaN(totalSeconds)) {
                timeTotal.textContent = formatTime(totalSeconds);
            }
            // v5 — drive the cinematic scene/caption off the same real clock.
            cinematic.onTime(currentSeconds);
        },
        onPause: () => {
            isPaused = true;
            updatePlayState(false);
            cinematic.setPlaying(false);
        },
        onResume: () => {
            isPaused = false;
            updatePlayState(true);
            cinematic.setPlaying(true);
        },
        // v4.3 — prerecorded engine emits this when chapter changes (initial
        // load, auto-advance, or user jump). Update the chapter-title row +
        // re-render the chapter menu to reflect the new active row.
        onChapterChange: ({ n, title }) => {
            if (chapterTextEl) chapterTextEl.textContent = title;
            renderChapterMenu();
            // v5 — load the cinematic timeline for the new chapter.
            cinematic.onChapter(n);
        },
        onEnd: () => {
            isPlaying = false;
            isPaused = false;
            setProgressFraction(1);
            clearHighlight();
            updatePlayState(false);
            stopTitleCycle();
            cinematic.setPlaying(false);
        },
    };

    // v4.3 — title row crossfade. Two stacked rows (book + chapter)
    // alternate visibility every 5 s during playback so both names
    // surface without competing for fixed space. Stops on engine end.
    let titleCycleTimer = null;
    function startTitleCycle() {
        if (!titleBookRow || !titleChapterRow) return;
        stopTitleCycle();
        let showingBook = true;
        titleCycleTimer = setInterval(() => {
            // Skip the swap if the chapter row has no text yet (initial load).
            if (chapterTextEl && !chapterTextEl.textContent) return;
            showingBook = !showingBook;
            titleBookRow.classList.toggle('is-active', showingBook);
            titleChapterRow.classList.toggle('is-active', !showingBook);
        }, 5000);
    }
    function stopTitleCycle() {
        if (titleCycleTimer) {
            clearInterval(titleCycleTimer);
            titleCycleTimer = null;
        }
        // Reset to book-title visible.
        if (titleBookRow) titleBookRow.classList.add('is-active');
        if (titleChapterRow) titleChapterRow.classList.remove('is-active');
    }

    // v4.3 — chapter jump overlay. Reads the active engine's manifest +
    // current chapter to render one button per chapter. Click → engine
    // jumps + closes the menu.
    function renderChapterMenu() {
        if (!chapterMenu || !currentEngine) return;
        if (typeof currentEngine.getManifest !== 'function') {
            chapterMenu.hidden = true;
            return;
        }
        const manifest = currentEngine.getManifest();
        const cur = typeof currentEngine.getCurrentChapter === 'function'
            ? currentEngine.getCurrentChapter() : null;
        if (!manifest || !manifest.chapters || !manifest.chapters.length) {
            chapterMenu.hidden = true;
            return;
        }
        chapterMenu.innerHTML = '';
        manifest.chapters.forEach((c) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'audio-player__chapter-item';
            if (c.n === cur) btn.classList.add('is-current');
            btn.setAttribute('role', 'menuitem');
            const num = document.createElement('span');
            num.className = 'audio-player__chapter-item-num';
            num.textContent = String(c.n);
            const name = document.createElement('span');
            name.className = 'audio-player__chapter-item-name';
            name.textContent = c.title || `Chapter ${c.n}`;
            const dur = document.createElement('span');
            dur.className = 'audio-player__chapter-item-dur';
            dur.textContent = formatTime(c.duration_seconds || 0);
            btn.appendChild(num);
            btn.appendChild(name);
            btn.appendChild(dur);
            btn.addEventListener('click', () => {
                closeChapterMenu();
                if (currentEngine && typeof currentEngine.jumpToChapter === 'function') {
                    currentEngine.jumpToChapter(c.n);
                }
            });
            chapterMenu.appendChild(btn);
        });
    }
    function openChapterMenu() {
        if (!chapterMenu || !titleButton) return;
        renderChapterMenu();
        if (!chapterMenu.children.length) return;
        chapterMenu.hidden = false;
        // Next frame so the opacity transition runs.
        requestAnimationFrame(() => chapterMenu.classList.add('is-open'));
        titleButton.setAttribute('aria-expanded', 'true');
        chapterMenu.setAttribute('aria-hidden', 'false');
    }
    function closeChapterMenu() {
        if (!chapterMenu || !titleButton) return;
        chapterMenu.classList.remove('is-open');
        titleButton.setAttribute('aria-expanded', 'false');
        chapterMenu.setAttribute('aria-hidden', 'true');
        // After transition, hide entirely so it's not in the tab order.
        setTimeout(() => {
            if (!chapterMenu.classList.contains('is-open')) chapterMenu.hidden = true;
        }, 200);
    }

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

    triggers.forEach((t) => {
        t.addEventListener('click', () => {
            if (!isPlaying && !isPaused) speak();
            else showPlayer();
        });
    });
    playPauseBtn.addEventListener('click', togglePlayPause);
    closeBtn.addEventListener('click', stop);
    if (engineToggle) engineToggle.addEventListener('click', toggleEngine);

    // v4.1 — drag-to-seek on the progress bar. Click anywhere on the
    // progress strip (or drag the handle) and the engine seeks to the
    // corresponding position. Only works for engines that implement
    // .seek(ratio) — currently just prerecorded; studio/system silently
    // ignore (they have no real timeline to seek within).
    const progressBar = document.getElementById('audioProgress');
    if (progressBar) {
        let isDragging = false;
        const positionRatio = (clientX) => {
            const rect = progressBar.getBoundingClientRect();
            const x = clientX - rect.left;
            return Math.max(0, Math.min(1, x / rect.width));
        };
        const seekTo = (clientX) => {
            if (!currentEngine || typeof currentEngine.seek !== 'function') return;
            const ratio = positionRatio(clientX);
            currentEngine.seek(ratio);
            // Snap the visual fill immediately for tactile feedback —
            // the engine will catch up via onProgress on the next tick.
            const pct = ratio * 100;
            progressFill.style.width = `${pct}%`;
            progressHandle.style.left = `${pct}%`;
            if (playPauseBtn) playPauseBtn.style.setProperty('--progress', pct.toFixed(2));
        };
        progressBar.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            isDragging = true;
            progressBar.setPointerCapture(e.pointerId);
            seekTo(e.clientX);
        });
        progressBar.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            seekTo(e.clientX);
        });
        const endDrag = (e) => {
            if (!isDragging) return;
            isDragging = false;
            try { progressBar.releasePointerCapture(e.pointerId); } catch (_) {}
        };
        progressBar.addEventListener('pointerup', endDrag);
        progressBar.addEventListener('pointercancel', endDrag);
    }

    // v4.3 — title click opens the chapter-jump overlay (when the engine
    // exposes a manifest, i.e. the prerecorded engine is active).
    if (titleButton && chapterMenu) {
        titleButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (chapterMenu.classList.contains('is-open')) closeChapterMenu();
            else openChapterMenu();
        });
        document.addEventListener('click', (e) => {
            if (!chapterMenu.classList.contains('is-open')) return;
            if (chapterMenu.contains(e.target) || titleButton.contains(e.target)) return;
            closeChapterMenu();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && chapterMenu.classList.contains('is-open')) {
                closeChapterMenu();
                titleButton.focus();
            }
        });
    }

    // v5 — cinematic view wiring. The toggle opens the fullscreen scene +
    // caption presentation; if nothing is playing yet it also starts playback
    // (the prerecorded engine's onChapterChange then loads the timeline). The
    // overlay's own play/pause reuses the main control path; exit / Escape
    // close it; Space toggles playback while it's open.
    if (cinematic.enabled) {
        const cinematicToggle = document.getElementById('audioCinematicToggle');
        const cinematicExit = document.getElementById('cinematicExit');
        const cinematicPlayPause = document.getElementById('cinematicPlayPause');
        if (cinematicToggle) {
            cinematicToggle.addEventListener('click', () => {
                showPlayer();
                cinematic.open();
                if (!isPlaying && !isPaused) speak();
            });
        }
        if (cinematicExit) {
            cinematicExit.addEventListener('click', () => cinematic.close());
        }
        if (cinematicPlayPause) {
            cinematicPlayPause.addEventListener('click', togglePlayPause);
        }
        document.addEventListener('keydown', (e) => {
            if (!cinematic.isOpen()) return;
            if (e.key === 'Escape') {
                cinematic.close();
            } else if (e.key === ' ' || e.code === 'Space') {
                e.preventDefault();
                togglePlayPause();
            }
        });
    }

    if (hasWebSpeech && speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => {};
    }

    window.addEventListener('beforeunload', stop);

    // --- Library-book: eager audio probe + click-to-seek --------------------
    //
    // On book pages we hide the listen UI by default and reveal it only when
    // the manifest probe confirms a prerecorded audio play exists for this
    // book + language (CSS rule keyed on `body.woh-audio-available`). We
    // also wire a delegated click handler that seeks the player to the
    // paragraph the reader taps while playback is in flight.
    const libraryBookRoot = document.querySelector('.library-book');
    if (libraryBookRoot) {
        (async () => {
            const units = getReadingUnits();
            if (!units.length) return;
            const data = await tryPrerecorded(units);
            if (!data) return;
            document.body.classList.add('woh-audio-available');
            // Unhide any trigger explicitly carrying `hidden` (the featured
            // title-area button). Sidebar / FAB triggers reveal via CSS.
            triggers.forEach((t) => {
                if (t.hasAttribute('hidden')) t.removeAttribute('hidden');
            });
            document.dispatchEvent(new CustomEvent('woh:listen-available'));
        })();

        // Public entry point for the per-paragraph "play from here" button in
        // the actions pill (templates/macros/library.html). If the prerecorded
        // engine is already running, just seek; otherwise start playback and
        // then seek once the engine is live. Resolves to true when a seek was
        // attempted.
        window.WohListen = {
            available() { return document.body.classList.contains('woh-audio-available'); },
            async playFromParagraph(id) {
                if (!id) return false;
                if ((isPlaying || isPaused) && currentEngine && currentEngine.name === 'prerecorded'
                    && typeof currentEngine.seekToParagraph === 'function') {
                    return currentEngine.seekToParagraph(id);
                }
                await speak();
                if (currentEngine && currentEngine.name === 'prerecorded'
                    && typeof currentEngine.seekToParagraph === 'function') {
                    return currentEngine.seekToParagraph(id);
                }
                return false;
            },
        };

        // Click-to-seek — when the player is open and the prerecorded engine
        // is driving playback, tapping a paragraph jumps audio to its start.
        // Plain selectParagraph keeps working underneath; we don't stop the
        // event so the verse still gets its selected-state highlight.
        document.addEventListener('click', (e) => {
            // Don't hijack clicks on the inline commentary button, share, or
            // anything inside an open commentary popover.
            if (e.target.closest('button, .library-book__commentary-popover')) return;
            const para = e.target.closest('.library-book__paragraph');
            if (!para || !para.id) return;
            if (!isPlaying && !isPaused) return;
            if (!currentEngine || currentEngine.name !== 'prerecorded') return;
            if (typeof currentEngine.seekToParagraph !== 'function') return;
            currentEngine.seekToParagraph(para.id);
        });
    }
})();
