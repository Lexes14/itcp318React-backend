const blockedWords = [
  "anak ng putang ina",
  "anak ng puta",
  "son of a bitch",
  "motherfucker",
  "putangina",
  "putang ina",
  "tangina",
  "tang ina",
  "tarantado",
  "walanghiya",
  "siraulo",
  "hinayupak",
  "bullshit",
  "fucking",
  "asshole",
  "bitch",
  "punyeta",
  "pakyu",
  "bwisit",
  "buwisit",
  "leche",
  "letse",
  "lintik",
  "hayop",
  "kupal",
  "gago",
  "gaga",
  "bobo",
  "tanga",
  "ulol",
  "inutil",
  "engot",
  "peste",
  "salot",
  "demonyo",
  "puta",
  "fuck",
  "shit",
  "damn",
];

const escaped = blockedWords
  .sort((a, b) => b.length - a.length)
  .map((word) =>
    word
      .split(" ")
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("\\s+"),
  );
const blockedPattern = new RegExp(
  `(?<![\\p{L}\\p{N}_])(?:${escaped.join("|")})(?![\\p{L}\\p{N}_])`,
  "giu",
);

const maskProfanity = (value = "") =>
  String(value).replace(blockedPattern, (match) =>
    match.replace(/[^\s]/gu, "*"),
  );

module.exports = { maskProfanity, blockedWords };
