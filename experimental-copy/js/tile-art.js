// the dashboard tile thumbnails: one chunky, tilted object per guide, drawn as
// inline SVG so css can color it. each thumbnail uses two palette colors, set
// per tile in site.css: --thumb-main (the band, and the cut-out details) and
// --thumb-accent (the object). --thumb-side is the accent's shaded side.
//
// how the depth works: the object's outline is drawn 6 times, each copy 1px
// further down and right, in the side color. together they read as a solid
// edge, and the accent-colored face sits on top. corners are cut at an angle
// instead of rounded, and the whole object is tilted, so nothing looks flat.

const DEPTH = [1, 2, 3, 4, 5, 6];

// outline: the object's silhouette (one path). details: what sits on its face
function art(id, tilt, outline, details) {
  const side = DEPTH.map((n) => `<use href="#tile-art-${id}" x="${n}" y="${n}"/>`).join("");
  return `<svg class="glyph tile-art" viewBox="0 0 96 96" aria-hidden="true" focusable="false">
    <defs><path id="tile-art-${id}" d="${outline}"/></defs>
    <g transform="rotate(${tilt} 48 48)">
      <g class="side">${side}</g>
      <use class="face" href="#tile-art-${id}"/>
      ${details}
    </g></svg>`;
}

export const TILE_ART = {
  // a passport: booklet with a cut corner, an emblem and two lines of text
  entry: art("entry", -12,
    "M26 12H60L66 18V78H26Z",
    `<path class="cut-line" d="M46 26L56 32V44L46 50L36 44V32Z"/>
     <path class="cut" d="M36 58H56V63H36ZM40 68H52V73H40Z"/>`),

  // a bank card with a coin on its corner
  money: art("money", 10,
    "M10 28H72L78 34V66H10Z",
    `<path class="cut" d="M10 37H78V46H10ZM18 53H32V60H18Z"/>
     <path class="face coin" d="M60 14H70L77 21V31L70 38H60L53 31V21Z"/>
     <path class="cut" d="M65 20L71 26L65 32L59 26Z"/>`),

  // a phone with signal chevrons on its screen
  phones: art("phones", -10,
    "M30 8H58L64 14V76L58 82H30L24 76V14Z",
    `<path class="cut" d="M30 16H58V68H30Z"/>
     <path class="lit-line" d="M35 40L44 31L53 40M38.5 49L44 43.5L49.5 49"/>
     <path class="face" d="M41 54H47V60H41Z"/>
     <path class="cut" d="M39 73H49V76.5H39Z"/>`),

  // a first-aid case with a handle and a cross
  health: art("health", 8,
    "M12 32H70L76 38V76H12ZM30 32V20H58V32H51V27H37V32Z",
    `<path class="cut" d="M39 40H49V49H58V59H49V68H39V59H30V49H39Z"/>`),

  // a paper plane, with its fold
  there: art("there", -6,
    "M8 44L82 12L60 82L42 58Z",
    `<path class="cut-line thin" d="M82 12L42 58"/>
     <path class="side" d="M42 58L47 76L54 65Z"/>`),

  // the front of a train: windscreen, two lights and its feet on the track
  around: art("around", -8,
    "M24 10H62L70 20V68H64V78H54V68H32V78H22V68H16V20Z",
    `<path class="cut" d="M24 22H41V42H24ZM45 22H62V42H45ZM24 52H33V59H24ZM53 52H62V59H53Z"/>`),

  // a shield with a check mark
  safety: art("safety", 9,
    "M45 8L76 18V46L45 82L14 46V18Z",
    `<path class="cut-line thick" d="M31 43L41 53L60 31"/>`),

  // two speech bubbles: how people talk and what's polite
  culture: art("culture", -9,
    "M8 14H62L68 20V52H38L24 66V52H8Z",
    `<path class="cut" d="M19 30H26V37H19ZM34 30H41V37H34ZM49 30H56V37H49Z"/>
     <path class="face coin" d="M46 46H78L84 52V72H70V82L60 72H46Z"/>`),
};
