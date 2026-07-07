import { useState, useEffect } from "react";

function TypedText({ text }) {
  const [shown, setShown] = useState("");

  useEffect(() => {
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 14);
    return () => clearInterval(id);
  }, [text]);

  return (
    <span>
      {shown}
      <span className="caret">|</span>
    </span>
  );
}

export default TypedText;
