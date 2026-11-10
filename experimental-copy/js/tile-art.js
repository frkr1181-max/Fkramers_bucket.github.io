// the dashboard tile thumbnails: one chunky, tilted object per guide, drawn as
// inline SVG so css can color it. each thumbnail uses two palette colors, set
// per tile in site.css: --thumb-main (the band, and the cut-out details) and
// --thumb-accent (the object). --thumb-side is the accent's shaded side.
//
// how the depth works: the object's outline is drawn 6 times, each copy 1px
// further down and right, in the side color. together they read as a solid
// edge, and the accent-colored face sits on top.
//
// how the roundness works: every shape below is drawn with plain corners, and
// site.css gives it a thick stroke in its own color with round joins. that
// rounds every corner by 3px, to match the site's round cards and buttons.

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

// a second, smaller object sitting on the first: a band-colored rim (halo)
// keeps the two apart, since both are the accent color
const onTop = (d) => `<path class="halo" d="${d}"/><path class="face" d="${d}"/>`;

export const TILE_ART = {
  // a passport: booklet with a round emblem and two lines of text
  entry: art("entry", -12,
    "M29 15H63V75H29Z",
    `<circle class="cut-line" cx="46" cy="37" r="9"/>
     <path class="cut-line" d="M37 57H55M41 67H51"/>`),

  // a bank card with a coin on its corner
  money: art("money", 10,
    "M13 31H75V63H13Z",
    `<path class="cut" d="M10 38H78V46H10Z"/>
     <path class="cut soft" d="M20 54H31V58H20Z"/>
     <circle class="cut" cx="65" cy="25" r="16"/>
     <circle class="face" cx="65" cy="25" r="12.5"/>
     <circle class="cut" cx="65" cy="25" r="4.5"/>`),

  // a phone with signal curves on its screen
  phones: art("phones", -10,
    "M30 12H58V78H30Z",
    `<path class="cut soft" d="M33 18H55V66H33Z"/>
     <path class="lit-line" d="M35 40Q44 30 53 40M39 48Q44 42.5 49 48"/>
     <circle class="face" cx="44" cy="56" r="3.5"/>
     <path class="cut-line thin" d="M40 73.5H48"/>`),

  // a first-aid case with a handle and a cross
  health: art("health", 8,
    "M15 35H73V73H15ZM30 35V19H58V35H52V25H36V35Z",
    `<path class="cut soft" d="M41 43H47V51H55V57H47V65H41V57H33V51H41Z"/>`),

  // an airliner seen from above, nose up: body, swept wings, tail, cockpit window
  there: art("there", 10,
    "M45 8Q52 14 52 24V30L82 44V52L52 46V66L62 74V80L45 76L28 80V74L38 66V46L8 52V44L38 30V24Q38 14 45 8Z",
    `<path class="cut-line thin" d="M41 22Q45 17 49 22"/>
     <path class="cut-line thin" d="M45 31V44"/>`),

  // the front of a train: round roof, windscreen, two lights, feet on the track
  around: art("around", -8,
    "M21 30Q21 13 38 13H50Q67 13 67 30V65H21ZM27 65V75H35V65ZM53 65V75H61V65Z",
    `<path class="cut soft" d="M28 27H40V41H28ZM48 27H60V41H48Z"/>
     <circle class="cut" cx="32" cy="54" r="4"/><circle class="cut" cx="56" cy="54" r="4"/>`),

  // a padlock: round shackle on top, body with a keyhole
  safety: art("safety", 9,
    "M20 34H70V78H20ZM30 34V24Q30 8 45 8Q60 8 60 24V34H52V24Q52 16 45 16Q38 16 38 24V34Z",
    `<circle class="cut" cx="45" cy="48" r="5.5"/>
     <path class="cut-line" d="M45 50V60"/>`),

  // two speech bubbles: how people talk and what's polite
  culture: art("culture", -9,
    "M11 17H63V49H38L27 60V49H11Z",
    `<circle class="cut" cx="24" cy="33" r="4"/><circle class="cut" cx="37" cy="33" r="4"/><circle class="cut" cx="50" cy="33" r="4"/>
     ${onTop("M50 50H80V68H70V77L61 68H50Z")}`),
};
