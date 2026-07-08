import { useState, useEffect, useRef } from "react";
import { apiGet, apiPost } from "./api";
import { LEVEL_LABELS, randGlyph } from "./constants";
import BackgroundSketch from "./components/BackgroundSketch";
import Reel from "./components/Reel";
import LevelMeter from "./components/LevelMeter";
import TypedText from "./components/TypedText";

async function checkApi() {
  try {
    await apiGet("/catalog/programming-languages");
    return "ok";
  } catch {
    return "bad";
  }
}

function App() {
  const [mode, setMode] = useState("random");
  const [apiOk, setApiOk] = useState(null);
  const [error, setError] = useState(null);

  const [levelChoice, setLevelChoice] = useState(3);

  const [catalogs, setCatalogs] = useState({ languages: [], technologies: [], addons: [] });
  const [catalogsLoaded, setCatalogsLoaded] = useState(false);
  const [valueForm, setValueForm] = useState({ programming_language: "", technologies: "", addons: "", level: 3 });
  const [extras, setExtras] = useState([]);
  const [peekLoading, setPeekLoading] = useState({});

  const [spinning, setSpinning] = useState(false);
  const [leverPulled, setLeverPulled] = useState(false);
  const [reelDisplay, setReelDisplay] = useState(["?", "?", "?"]);
  const [reelLocked, setReelLocked] = useState([false, false, false]);
  const [resultLevel, setResultLevel] = useState(0);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);

  const bgRef = useRef(null);
  const cabinetRef = useRef(null);
  const flickerTimers = useRef([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const status = await checkApi();
      if (mounted) {
        setApiOk(status === "ok");
        if (status === "bad") setError(null);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (mode === "value" && !catalogsLoaded) {
      (async () => {
        try {
          const [langs, techs, addons] = await Promise.all([
            apiGet("/catalog/programming-languages"),
            apiGet("/catalog/technologies"),
            apiGet("/catalog/addons"),
          ]);
          setCatalogs({ languages: langs, technologies: techs, addons });
          setCatalogsLoaded(true);
          setApiOk(true);
        } catch {
          setError("Couldn't load the catalog from the API — check that it's running on 127.0.0.1:9600.");
          setApiOk(false);
        }
      })();
    }
  }, [mode, catalogsLoaded]);

  const clearFlicker = () => {
    flickerTimers.current.forEach((id) => clearInterval(id));
    flickerTimers.current = [];
  };

  const startFlicker = () => {
    clearFlicker();
    [0, 1, 2].forEach((i) => {
      const id = setInterval(() => {
        setReelDisplay((prev) => {
          const next = [...prev];
          next[i] = randGlyph();
          return next;
        });
      }, 70);
      flickerTimers.current.push(id);
    });
  };

  const settleReels = (finalValues) => {
    finalValues.forEach((val, i) => {
      setTimeout(() => {
        clearInterval(flickerTimers.current[i]);
        setReelDisplay((prev) => {
          const n = [...prev];
          n[i] = val;
          return n;
        });
        setReelLocked((prev) => {
          const n = [...prev];
          n[i] = true;
          return n;
        });
      }, 500 + i * 550);
    });
  };

  const fireWinBurst = () => {
    if (cabinetRef.current && bgRef.current) {
      const rect = cabinetRef.current.getBoundingClientRect();
      bgRef.current.burst(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2
      );
    }
  };

  const runPull = async () => {
    if (spinning) return;
    setError(null);
    setResult(null);
    setResultLevel(0);
    setReelLocked([false, false, false]);
    setReelDisplay(["?", "?", "?"]);
    setSpinning(true);
    setLeverPulled(true);
    setTimeout(() => setLeverPulled(false), 480);
    startFlicker();

    const minSpinMs = 500 + 2 * 550 + 700;
    let data;

    try {
      if (mode === "random") {
        data = await apiPost("/ensemble_project/generate_project_totally_random");
      } else if (mode === "level") {
        data = await apiPost("/ensemble_project/generate_project_by_level", {
          level: levelChoice,
        });
      } else {
        const payload = {
          programming_language: valueForm.programming_language,
          technologies: valueForm.technologies,
          addons: valueForm.addons,
          extras,
          level: { level: valueForm.level },
        };
        data = await apiPost("/ensemble_project/generate_project_by_value", payload);
      }
      setApiOk(true);
    } catch {
      setApiOk(false);
      setError("Couldn't reach the API at 127.0.0.1:9600. Make sure the server is running.");
      clearFlicker();
      setSpinning(false);
      return;
    }

    const finalValues = [
      data.programming_language ?? "?",
      data.technologies ?? "?",
      data.addons ?? "?",
    ];

    const doSettle = () => {
      settleReels(finalValues);
      setTimeout(() => {
        clearFlicker();
        setSpinning(false);
        setResultLevel(data.level ?? 0);
        setResult(data);
        setHistory((prev) =>
          [{ ...data, ts: Date.now() }, ...prev].slice(0, 6)
        );
        fireWinBurst();
      }, minSpinMs + 300);
    };

    setTimeout(doSettle, 250);
  };

  const doPeek = async (field, endpoint) => {
    setPeekLoading((prev) => ({ ...prev, [field]: true }));
    try {
      const val = await apiGet(`/catalog/${endpoint}/random`);
      setValueForm((prev) => ({
        ...prev,
        [field]:
          typeof val === "string" ? val : val.name || JSON.stringify(val),
      }));
    } catch {
      setError("Peek failed — API unreachable at 127.0.0.1:9600.");
    }
    setPeekLoading((prev) => ({ ...prev, [field]: false }));
  };

  const addExtraRow = () => {
    setExtras((prev) => [
      ...prev,
      { programming_language: "", technologies: "", addons: "" },
    ]);
  };

  const updateExtra = (idx, field, val) => {
    setExtras((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, [field]: val } : row))
    );
  };

  const removeExtra = (idx) =>
    setExtras((prev) => prev.filter((_, i) => i !== idx));

  const canValueSpin =
    mode !== "value" ||
    (valueForm.programming_language &&
      valueForm.technologies &&
      valueForm.addons);

  return (
    <>
      <BackgroundSketch ref={bgRef} />

      <div className="app-wrap">
        <div className="marquee">
          <div className="eyebrow">// ENSEMBLE PROJECT GENERATOR</div>
          <h1>PROJECT JACKPOT</h1>
          <p>
            Pull the lever. Get a language, a stack, and an addon you didn't ask
            for — plus a brief telling you what to build with them.
          </p>
          <div className="api-status">
            <span
              className={`api-dot ${apiOk === true ? "ok" : apiOk === false ? "bad" : ""}`}
            />
            {apiOk === true && "API connected · 127.0.0.1:9600"}
            {apiOk === false && "API unreachable · 127.0.0.1:9600"}
            {apiOk === null && "checking API…"}
            <button onClick={checkApi}>retry</button>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError(null)}>dismiss</button>
          </div>
        )}

        <div className="mode-tabs">
          {[
            ["random", "🎰 TOTALLY RANDOM"],
            ["level", "📊 BY LEVEL"],
            ["value", "🛠 BY VALUE"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={`mode-tab ${mode === key ? "active" : ""}`}
              onClick={() => setMode(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "level" && (
          <div className="config-panel">
            <h3>DIFFICULTY</h3>
            <div className="level-picker">
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className={`level-pill ${levelChoice === n ? "sel" : ""}`}
                  onClick={() => setLevelChoice(n)}
                >
                  <div className="num">{n}</div>
                  <div className="lbl">{LEVEL_LABELS[n]}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {mode === "value" && (
          <div className="config-panel">
            <h3>PICK YOUR OWN COMBO</h3>
            <div className="value-grid">
              <div className="field">
                <label>PROGRAMMING LANGUAGE</label>
                <div className="field-row">
                  <select
                    value={valueForm.programming_language}
                    onChange={(e) =>
                      setValueForm((f) => ({
                        ...f,
                        programming_language: e.target.value,
                      }))
                    }
                  >
                    <option value="">select…</option>
                    {catalogs.languages.map((o) => (
                      <option key={o.id} value={o.name}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="dice-btn"
                    disabled={peekLoading.programming_language}
                    onClick={() => doPeek("programming_language", "programming-languages")}
                  >
                    🎲
                  </button>
                </div>
              </div>
              <div className="field">
                <label>TECHNOLOGY</label>
                <div className="field-row">
                  <select
                    value={valueForm.technologies}
                    onChange={(e) =>
                      setValueForm((f) => ({
                        ...f,
                        technologies: e.target.value,
                      }))
                    }
                  >
                    <option value="">select…</option>
                    {catalogs.technologies.map((o) => (
                      <option key={o.id} value={o.name}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="dice-btn"
                    disabled={peekLoading.technologies}
                    onClick={() => doPeek("technologies", "technologies")}
                  >
                    🎲
                  </button>
                </div>
              </div>
              <div className="field">
                <label>ADDON</label>
                <div className="field-row">
                  <select
                    value={valueForm.addons}
                    onChange={(e) =>
                      setValueForm((f) => ({ ...f, addons: e.target.value }))
                    }
                  >
                    <option value="">select…</option>
                    {catalogs.addons.map((o) => (
                      <option key={o.id} value={o.name}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="dice-btn"
                    disabled={peekLoading.addons}
                    onClick={() => doPeek("addons", "addons")}
                  >
                    🎲
                  </button>
                </div>
              </div>
            </div>

            <div className="field" style={{ marginTop: "12px" }}>
              <label>
                LEVEL: {valueForm.level} —{" "}
                {LEVEL_LABELS[valueForm.level]}
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={valueForm.level}
                onChange={(e) =>
                  setValueForm((f) => ({
                    ...f,
                    level: Number(e.target.value),
                  }))
                }
                style={{ width: "100%" }}
              />
            </div>

            <div className="extras-block">
              <h3>EXTRA COMBOS (optional)</h3>
              {extras.map((row, idx) => (
                <div className="extra-row" key={idx}>
                  <select
                    value={row.programming_language}
                    onChange={(e) =>
                      updateExtra(idx, "programming_language", e.target.value)
                    }
                  >
                    <option value="">language…</option>
                    {catalogs.languages.map((o) => (
                      <option key={o.id} value={o.name}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={row.technologies}
                    onChange={(e) =>
                      updateExtra(idx, "technologies", e.target.value)
                    }
                  >
                    <option value="">technology…</option>
                    {catalogs.technologies.map((o) => (
                      <option key={o.id} value={o.name}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={row.addons}
                    onChange={(e) =>
                      updateExtra(idx, "addons", e.target.value)
                    }
                  >
                    <option value="">addon…</option>
                    {catalogs.addons.map((o) => (
                      <option key={o.id} value={o.name}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                  <button
                    className="remove-extra"
                    onClick={() => removeExtra(idx)}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button className="add-extra" onClick={addExtraRow}>
                + add extra combo
              </button>
            </div>
          </div>
        )}

        <div className="cabinet" ref={cabinetRef}>
          <div className="machine-row">
            <div className="reels-cluster">
              <Reel
                tag="LANGUAGE"
                display={reelDisplay[0]}
                spinning={spinning && !reelLocked[0]}
                locked={reelLocked[0]}
              />
              <Reel
                tag="STACK"
                display={reelDisplay[1]}
                spinning={spinning && !reelLocked[1]}
                locked={reelLocked[1]}
              />
              <Reel
                tag="ADDON"
                display={reelDisplay[2]}
                spinning={spinning && !reelLocked[2]}
                locked={reelLocked[2]}
              />
            </div>
            <LevelMeter level={resultLevel} />
            <div className="lever-container">
              <div
                className={`lever-assembly ${leverPulled ? "pulled" : ""} ${spinning || !canValueSpin ? "disabled" : ""}`}
                onClick={() => canValueSpin && runPull()}
              >
                <div className="lever-ball" />
                <div className="lever-rod" />
              </div>
              <div className="lever-base" />
              <div className="pull-label">
                {spinning
                  ? "SPINNING…"
                  : canValueSpin
                    ? "PULL"
                    : "PICK A COMBO FIRST"}
              </div>
            </div>
          </div>
        </div>

        {spinning && (
          <div className="loading-message">
            We work with a llm it can take a time , we need to genera 5 candidates,
            select the valid candidates and generate the description for the proyect,
            Thanks for wait , you will suffer :)
          </div>
        )}

        {result && (
          <div className="payout-tray">
            <div className="top-line">
              <h2>🏆 YOUR PROJECT</h2>
              <span className="lvl-badge">
                LVL {result.level} ·{" "}
                {LEVEL_LABELS[result.level] || "custom"}
              </span>
            </div>
            <div className="desc-text">
              <TypedText
                key={result.description || "empty"}
                text={result.description || "No description returned."}
              />
            </div>

            {result.extras && result.extras.length > 0 && (
              <>
                <div className="bonus-title">
                  BONUS COMBOS ({result.extras.length})
                </div>
                <div className="bonus-cards">
                  {result.extras.map((ex, i) => (
                    <div
                      className="bonus-card"
                      style={{ animationDelay: `${i * 0.15}s` }}
                      key={i}
                    >
                      <div className="row">
                        <span>lang</span>
                        <b>{ex.programming_language}</b>
                      </div>
                      <div className="row">
                        <span>stack</span>
                        <b>{ex.technologies}</b>
                      </div>
                      <div className="row">
                        <span>addon</span>
                        <b>{ex.addons}</b>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <button
              className="copy-btn"
              onClick={() =>
                navigator.clipboard.writeText(
                  JSON.stringify(result, null, 2)
                )
              }
            >
              📋 copy as JSON
            </button>
          </div>
        )}

        {!result && !spinning && (
          <div className="empty-hint">
            Pull the lever to generate your first project.
          </div>
        )}

        {history.length > 0 && (
          <div className="history-strip">
            <h4>PAST PULLS</h4>
            <div className="history-row">
              {history.map((h, i) => (
                <div
                  className="ticket"
                  key={h.ts || i}
                  onClick={() => setResult(h)}
                >
                  <b>
                    {h.programming_language} · {h.technologies}
                  </b>
                  LVL {h.level} · {h.addons}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default App;
