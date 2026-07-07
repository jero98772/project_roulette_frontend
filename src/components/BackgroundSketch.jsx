import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import P5 from "p5";

const BackgroundSketch = forwardRef(function BackgroundSketch(_props, ref) {
  const containerRef = useRef(null);
  const p5Ref = useRef(null);

  useImperativeHandle(ref, () => ({
    burst(x, y) {
      if (!p5Ref.current) return;
      const p = p5Ref.current;
      const glyphs = "{}<>;01=>λ#!::++//[]".split("");
      const particles = Array.from({ length: 60 }).map(() => ({
        x,
        y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 1.2) * 8,
        life: 60,
        g: glyphs[Math.floor(Math.random() * glyphs.length)],
      }));
      const anim = () => {
        p.push();
        particles.forEach((pt) => {
          p.fill(255, 183, 3, Math.max(0, pt.life * 4));
          p.text(pt.g, pt.x, pt.y);
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.vy += 0.25;
          pt.life -= 1.4;
        });
        p.pop();
        if (particles.some((pt) => pt.life > 0)) requestAnimationFrame(anim);
      };
      anim();
    },
  }));

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const sketch = (p) => {
      let cols = [];
      const glyphs = "{}<>;01=>λ#!::++//[]".split("");

      p.setup = () => {
        const c = p.createCanvas(window.innerWidth, window.innerHeight);
        c.parent(containerRef.current);
        p.textFont("JetBrains Mono");
        p.textSize(14);
        const count = Math.floor(window.innerWidth / 26);
        cols = Array.from({ length: count }).map((_, i) => ({
          x: i * 26 + 10,
          y: Math.random() * -window.innerHeight,
          speed: reduceMotion ? 0 : 0.4 + Math.random() * 0.8,
        }));
      };

      p.draw = () => {
        p.clear();
        p.fill(57, 255, 136, 55);
        cols.forEach((col) => {
          const g = glyphs[Math.floor(Math.random() * glyphs.length)];
          p.text(g, col.x, col.y);
          col.y += col.speed;
          if (col.y > window.innerHeight) col.y = Math.random() * -100;
        });
      };

      p.windowResized = () => {
        p.resizeCanvas(window.innerWidth, window.innerHeight);
      };
    };

    const instance = new P5(sketch);
    p5Ref.current = instance;

    return () => {
      instance.remove();
      p5Ref.current = null;
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        opacity: 0.55,
        pointerEvents: "none",
      }}
    />
  );
});

export default BackgroundSketch;
