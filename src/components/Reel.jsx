import { lenClass } from "../constants";

function Reel({ tag, display, spinning, locked, onPeek, peekLoading }) {
  const showQ = display === "?";
  return (
    <div className="reel-unit">
      <div className="reel-tag">{tag}</div>
      <div
        className={`reel-card ${spinning ? "spinning" : ""} ${locked ? "locked" : ""}`}
      >
        <div className="scan" />
        <div className="glow-edge" />
        <div
          className={`reel-content ${showQ ? "qmark" : locked ? "result" : ""} ${lenClass(display)}`}
        >
          <span>{display}</span>
        </div>
      </div>
      {onPeek && (
        <button className="peek-btn" onClick={onPeek} disabled={peekLoading}>
          {peekLoading ? "…" : "🎲 peek"}
        </button>
      )}
    </div>
  );
}

export default Reel;
