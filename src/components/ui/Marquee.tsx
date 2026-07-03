const ITEMS = [
  "100% Pure",
  "Cold Pressed",
  "Unrefined",
  "Chemical Free",
  "Made in Pakistan",
  "Cash on Delivery",
  "Nationwide Delivery",
  "Natural Wellness",
  "Black Seed Oil",
  "Nigella Sativa",
];

export function Marquee() {
  const track = (
    <>
      {ITEMS.map((t, j) => (
        <span key={`a-${t}`}>
          <span className={`m-item${j % 4 === 0 ? " hi" : ""}`}>{t}</span>
          <span className="m-sep">·</span>
        </span>
      ))}
      {ITEMS.map((t, j) => (
        <span key={`b-${t}`}>
          <span className={`m-item${j % 4 === 0 ? " hi" : ""}`}>{t}</span>
          <span className="m-sep">·</span>
        </span>
      ))}
    </>
  );

  return (
    <div className="marquee">
      <div className="m-track">{track}</div>
    </div>
  );
}
