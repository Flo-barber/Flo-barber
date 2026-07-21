// =============================================================
//  DONNÉES DES SALONS FLO BARBER
// -------------------------------------------------------------
//  Pour ajouter / modifier un salon, éditez simplement ce tableau.
//  Chaque salon a besoin de :
//    id        : identifiant unique (chaîne)
//    name      : nom du salon
//    address   : adresse complète (rue)
//    postalCode: code postal
//    city      : ville
//    phone     : téléphone (optionnel)
//    lat, lng  : coordonnées GPS (latitude / longitude)
//    planityUrl: lien de réservation Planity (à renseigner à la main)
//    hours     : horaires (texte libre, optionnel)
//    image     : URL/chemin d'une photo (optionnel)
//
//  Astuce pour trouver les coordonnées GPS d'une adresse :
//    https://www.latlong.net  ou  clic droit sur Google Maps.
// =============================================================

export const salons = [
  {
    id: "colombiers",
    name: "Flo Barber — Colombiers",
    address: "2 Rue des Anciennes Carrières",
    postalCode: "34440",
    city: "Colombiers",
    phone: "",
    lat: 43.3116,
    lng: 3.1477,
    planityUrl: "https://www.planity.com/flo-barber-34440-colombiers-7f1",
    hours: "Mar–Sam : 8h–12h / 13h–19h",
    image: "",
  },
  {
    id: "narbonne",
    name: "Flo Barber — Narbonne",
    address: "15 Boulevard Frédéric Mistral",
    postalCode: "11100",
    city: "Narbonne",
    phone: "",
    lat: 43.1836,
    lng: 3.0036,
    planityUrl: "https://www.planity.com/",
    hours: "Mar–Sam : 9h – 19h",
    image: "",
  },
];

export default salons;
