import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import P5 from "p5";

function drawStar(p, x, y, outer, inner) {
  p.beginShape();
  for (let a = 0; a < p.TWO_PI; a += p.HALF_PI) {
    p.vertex(x + Math.cos(a) * outer, y + Math.sin(a) * outer);
    p.vertex(x + Math.cos(a + p.PI / 4) * inner, y + Math.sin(a + p.PI / 4) * inner);
  }
  p.endShape(p.CLOSE);
}

const BackgroundSketch = forwardRef(function BackgroundSketch(_props, ref) {
  const containerRef = useRef(null);
  const p5Ref = useRef(null);

  useImperativeHandle(ref, () => ({
    burst(x, y) {
      if (!p5Ref.current) return;
      const p = p5Ref.current;
      const stars = Array.from({ length: 60 }).map(() => ({
        x,
        y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 1.5) * 12,
        life: 50,
        outer: 2 + Math.random() * 6,
        inner: 1 + Math.random() * 3,
      }));
      const anim = () => {
        p.push();
        p.blendMode(p.ADD);
        stars.forEach((s) => {
          const alpha = Math.max(0, s.life * 5);
          p.fill(255, 200, 80, alpha);
          p.noStroke();
          drawStar(p, s.x, s.y, s.outer, s.inner);
          p.fill(255, 240, 180, alpha * 0.2);
          drawStar(p, s.x, s.y, s.outer * 2.5, s.inner * 2.5);
          s.x += s.vx;
          s.y += s.vy;
          s.vy += 0.25;
          s.life -= 1;
        });
        p.pop();
        if (stars.some((s) => s.life > 0)) requestAnimationFrame(anim);
      };
      anim();
    },
  }));

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const sketch = (p) => {
      let stars = [];

      p.setup = () => {
        const c = p.createCanvas(window.innerWidth, window.innerHeight);
        c.parent(containerRef.current);
        const count = reduceMotion ? 25 : 80;
        stars = Array.from({ length: count }).map(() => ({
          x: Math.random() * (window.innerWidth + 100) - 50,
          y: Math.random() * window.innerHeight,
          speed: 0.4 + Math.random() * 1.2,
          phase: Math.random() * Math.PI * 2,
          baseOuter: 2 + Math.random() * 8,
          baseInner: 1 + Math.random() * 4,
          wobble: Math.random() * 0.4,
        }));
      };

      p.draw = () => {
        p.clear();
        p.blendMode(p.ADD);
        stars.forEach((s) => {
          const pulse = 0.5 + 0.5 * Math.sin(p.frameCount * 0.03 + s.phase);
          const outer = s.baseOuter * (0.6 + 0.4 * pulse);
          const inner = s.baseInner * (0.6 + 0.4 * pulse);
          const alpha = 60 + 160 * pulse;

          p.fill(255, 190 + 65 * pulse, 80 + 100 * pulse, alpha);
          p.noStroke();
          drawStar(p, s.x, s.y, outer, inner);

          p.fill(255, 220, 150, alpha * 0.12);
          drawStar(p, s.x, s.y, outer * 3, inner * 3);

          s.x += Math.sin(p.frameCount * 0.01 + s.phase) * s.wobble;
          s.y += s.speed;

          if (s.y > window.innerHeight + 40) {
            s.y = -40;
            s.x = Math.random() * (window.innerWidth + 100) - 50;
            s.speed = 0.4 + Math.random() * 1.2;
          }
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
        opacity: 0.75,
        pointerEvents: "none",
      }}
    />
  );
});

export default BackgroundSketch;
