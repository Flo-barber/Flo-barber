// Équipe du salon (présentée en timeline sur la page d'accueil).
// Pour éditer : ajoute / retire une entrée ci-dessous.
//   name  : prénom / nom affiché
//   role  : intitulé bilingue { fr, en }
//   bio   : courte présentation bilingue { fr, en }
//   image : chemin d'une photo dans /public (ex. "/barbers/flo.jpg").
//           ⚠️ Ici on pointe vers des photos de démo du dossier /catalogue —
//           à REMPLACER par de vraies photos de portrait des barbiers.
const barbers = [
  {
    name: "Flo",
    role: { fr: "Fondateur & Master Barber", en: "Founder & Master Barber" },
    bio: {
      fr: "À l'origine de Flo Barber, il façonne le style de la maison depuis le premier coup de ciseaux.",
      en: "The founder of Flo Barber — shaping the house style since the very first cut.",
    },
    image: "/catalogue/fade-classique-1.jpg",
  },
  {
    name: "Karim",
    role: { fr: "Barbier senior", en: "Senior Barber" },
    bio: {
      fr: "Spécialiste du dégradé net et de la barbe sculptée au rasoir.",
      en: "Specialist in clean fades and razor-sculpted beards.",
    },
    image: "/catalogue/pompadour-1.jpg",
  },
  {
    name: "Antoine",
    role: { fr: "Barbier coiffeur", en: "Barber & Stylist" },
    bio: {
      fr: "Coupes modernes et texturées, toujours à l'écoute du style de chacun.",
      en: "Modern, textured cuts — always tuned to each client's style.",
    },
    image: "/catalogue/crop-francais-1.jpg",
  },
  {
    name: "Sofiane",
    role: { fr: "Barbier & rasage traditionnel", en: "Barber & Traditional Shave" },
    bio: {
      fr: "Le rituel du coupe-chou et de la serviette chaude, pour un rasage de près.",
      en: "The straight-razor and hot-towel ritual, for the closest shave.",
    },
    image: "/catalogue/buzz-cut-1.jpg",
  },
];

export default barbers;
