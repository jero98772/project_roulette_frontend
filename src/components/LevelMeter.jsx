function LevelMeter({ level }) {
  return (
    <div className="level-meter">
      <div className="reel-tag">LEVEL</div>
      <div className="gem-stack">
        {[1, 2, 3, 4, 5].map((n) => (
          <div
            key={n}
            className={`gem ${level >= n ? "on" : ""} ${n === 5 ? "c5" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}

export default LevelMeter;
