// =============================================================
//  Contenu légal (RGPD) — politique de confidentialité & mentions légales.
//  ⚠️ Remplacez les champs entre [CROCHETS] par vos informations réelles,
//  et faites relire par un professionnel avant mise en production.
//
//  Format d'un bloc : chaîne = paragraphe ; { h: "Titre" } = sous-titre ;
//  { ul: ["…", "…"] } = liste à puces.
// =============================================================

// Champs à personnaliser (repris dans les deux langues).
// ⚠️ Ce sont les informations de l'ENTREPRISE FLO BARBER (l'exploitant des salons),
// qui est le RESPONSABLE DU TRAITEMENT et l'éditeur du site — pas celles du
// développeur/agence (qui est, au plus, sous-traitant au sens de l'art. 28 RGPD).
export const COMPANY = {
  name: "[NOM DE LA SOCIÉTÉ]",
  legalForm: "[FORME JURIDIQUE — ex. SARL]",
  capital: "[CAPITAL SOCIAL]",
  address: "[ADRESSE DU SIÈGE SOCIAL]",
  siret: "[SIRET]",
  rcs: "[VILLE + N° RCS]",
  vat: "[N° TVA INTRACOMMUNAUTAIRE]",
  director: "[NOM DU DIRECTEUR DE LA PUBLICATION]",
  email: "[EMAIL DE CONTACT]",
  phone: "[TÉLÉPHONE]",
};

export const legal = {
  privacy: {
    fr: {
      title: "Politique de confidentialité",
      updated: "Dernière mise à jour : [JJ/MM/AAAA]",
      blocks: [
        `Chez Flo Barber, nous accordons une grande importance à la protection de vos données personnelles. La présente politique explique quelles données nous collectons, pourquoi, et quels sont vos droits, conformément au Règlement général sur la protection des données (RGPD) et à la loi Informatique et Libertés.`,
        { h: "1. Responsable du traitement" },
        `Le responsable du traitement est ${COMPANY.name} (${COMPANY.legalForm}), ${COMPANY.address}, SIRET ${COMPANY.siret}. Pour toute question relative à vos données : ${COMPANY.email}.`,
        { h: "2. Données que nous collectons" },
        {
          ul: [
            "Compte client : nom, prénom, adresse e-mail, numéro de téléphone (facultatif) et mot de passe (stocké chiffré par notre prestataire).",
            "Programme de fidélité : votre solde de points et l'historique de vos transactions (montant payé, points crédités, date).",
            "Données techniques : un cookie de session nécessaire à votre authentification lorsque vous êtes connecté.",
            "Recherche de salon : la ville ou le code postal que vous saisissez sont envoyés au service de géocodage OpenStreetMap (Nominatim) pour localiser le salon le plus proche.",
          ],
        },
        { h: "3. Finalités et bases légales" },
        {
          ul: [
            "Création et gestion de votre compte et du programme de fidélité — base légale : exécution du contrat et votre consentement.",
            "Sécurité du service et prévention de la fraude — base légale : intérêt légitime.",
            "Respect de nos obligations légales et comptables — base légale : obligation légale.",
          ],
        },
        { h: "4. Destinataires et sous-traitants" },
        `Vos données ne sont jamais vendues. Elles sont traitées par des prestataires agissant pour notre compte :`,
        {
          ul: [
            "Supabase — hébergement de la base de données et de l'authentification.",
            "Google (Google Wallet) — uniquement si vous ajoutez votre carte de fidélité à Google Wallet (nom, identifiant et solde de points).",
            "OpenStreetMap / Nominatim — géocodage de votre recherche de salon.",
            "Planity — réservation en ligne (vous êtes redirigé vers leur site).",
            "Vercel — hébergement du site web.",
          ],
        },
        { h: "5. Transferts hors Union européenne" },
        `Certains prestataires (Google, Vercel) peuvent traiter des données aux États-Unis. Ces transferts sont encadrés par des garanties appropriées (clauses contractuelles types de la Commission européenne et/ou EU-US Data Privacy Framework).`,
        { h: "6. Durée de conservation" },
        {
          ul: [
            "Données de compte : conservées tant que votre compte est actif, puis supprimées sur votre demande ou après [X] d'inactivité.",
            "Données de transactions : conservées [X ans] pour répondre à nos obligations comptables.",
          ],
        },
        { h: "7. Cookies" },
        `Le site utilise uniquement des cookies techniques strictement nécessaires à votre connexion (cookies de session). Nous n'utilisons aucun cookie de traçage, de mesure d'audience ou de publicité. Aucun consentement n'est donc requis pour ces cookies.`,
        { h: "8. Vos droits" },
        `Conformément au RGPD, vous disposez des droits d'accès, de rectification, d'effacement, de portabilité, d'opposition et de limitation, ainsi que du droit de retirer votre consentement à tout moment.`,
        {
          ul: [
            "Vous pouvez supprimer votre compte et toutes les données associées directement depuis la page « Mon compte ».",
            `Pour exercer vos autres droits, contactez-nous à ${COMPANY.email}.`,
            "Vous pouvez introduire une réclamation auprès de la CNIL (www.cnil.fr).",
          ],
        },
        { h: "9. Sécurité" },
        `Nous mettons en œuvre des mesures techniques et organisationnelles appropriées : mots de passe chiffrés, cloisonnement des accès à la base de données (Row Level Security), connexions chiffrées (HTTPS).`,
        { h: "10. Contact" },
        `Pour toute question relative à cette politique ou à vos données : ${COMPANY.email}.`,
      ],
    },
    en: {
      title: "Privacy Policy",
      updated: "Last updated: [DD/MM/YYYY]",
      blocks: [
        `At Flo Barber, we take the protection of your personal data seriously. This policy explains what data we collect, why, and what your rights are, in accordance with the General Data Protection Regulation (GDPR).`,
        { h: "1. Data controller" },
        `The data controller is ${COMPANY.name} (${COMPANY.legalForm}), ${COMPANY.address}, business ID ${COMPANY.siret}. For any question about your data: ${COMPANY.email}.`,
        { h: "2. Data we collect" },
        {
          ul: [
            "Customer account: name, e-mail address, phone number (optional) and password (stored encrypted by our provider).",
            "Loyalty program: your points balance and your transaction history (amount paid, points credited, date).",
            "Technical data: a session cookie required to authenticate you while you are signed in.",
            "Salon search: the city or postal code you enter is sent to the OpenStreetMap (Nominatim) geocoding service to locate the nearest salon.",
          ],
        },
        { h: "3. Purposes and legal bases" },
        {
          ul: [
            "Creating and managing your account and the loyalty program — legal basis: performance of the contract and your consent.",
            "Service security and fraud prevention — legal basis: legitimate interest.",
            "Compliance with our legal and accounting obligations — legal basis: legal obligation.",
          ],
        },
        { h: "4. Recipients and processors" },
        `Your data is never sold. It is processed by providers acting on our behalf:`,
        {
          ul: [
            "Supabase — database hosting and authentication.",
            "Google (Google Wallet) — only if you add your loyalty card to Google Wallet (name, identifier and points balance).",
            "OpenStreetMap / Nominatim — geocoding of your salon search.",
            "Planity — online booking (you are redirected to their site).",
            "Vercel — website hosting.",
          ],
        },
        { h: "5. Transfers outside the European Union" },
        `Some providers (Google, Vercel) may process data in the United States. These transfers are covered by appropriate safeguards (European Commission standard contractual clauses and/or the EU-US Data Privacy Framework).`,
        { h: "6. Retention period" },
        {
          ul: [
            "Account data: kept as long as your account is active, then deleted on your request or after [X] of inactivity.",
            "Transaction data: kept for [X years] to meet our accounting obligations.",
          ],
        },
        { h: "7. Cookies" },
        `The site only uses technical cookies strictly necessary for your login (session cookies). We do not use any tracking, analytics or advertising cookies. No consent is therefore required for these cookies.`,
        { h: "8. Your rights" },
        `Under the GDPR, you have the rights of access, rectification, erasure, portability, objection and restriction, as well as the right to withdraw your consent at any time.`,
        {
          ul: [
            "You can delete your account and all associated data directly from the “My account” page.",
            `To exercise your other rights, contact us at ${COMPANY.email}.`,
            "You may lodge a complaint with the French data protection authority (CNIL, www.cnil.fr).",
          ],
        },
        { h: "9. Security" },
        `We implement appropriate technical and organisational measures: encrypted passwords, database access isolation (Row Level Security), encrypted connections (HTTPS).`,
        { h: "10. Contact" },
        `For any question about this policy or your data: ${COMPANY.email}.`,
      ],
    },
  },

  mentions: {
    fr: {
      title: "Mentions légales",
      updated: "Dernière mise à jour : [JJ/MM/AAAA]",
      blocks: [
        { h: "Éditeur du site" },
        `${COMPANY.name}, ${COMPANY.legalForm} au capital de ${COMPANY.capital}, dont le siège social est situé ${COMPANY.address}. SIRET : ${COMPANY.siret} — RCS : ${COMPANY.rcs} — TVA intracommunautaire : ${COMPANY.vat}. Directeur de la publication : ${COMPANY.director}. Contact : ${COMPANY.email} — ${COMPANY.phone}.`,
        { h: "Hébergement" },
        `Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis (vercel.com). La base de données et l'authentification sont fournies par Supabase (supabase.com).`,
        { h: "Propriété intellectuelle" },
        `L'ensemble des contenus du site (textes, images, logos, marque Flo Barber) est protégé par le droit de la propriété intellectuelle. Toute reproduction non autorisée est interdite.`,
        { h: "Responsabilité" },
        `${COMPANY.name} s'efforce d'assurer l'exactitude des informations publiées mais ne saurait être tenue responsable des erreurs ou d'une indisponibilité du service. La réservation est assurée par un service tiers (Planity).`,
        { h: "Données personnelles" },
        `Le traitement de vos données personnelles est décrit dans notre politique de confidentialité.`,
      ],
    },
    en: {
      title: "Legal notice",
      updated: "Last updated: [DD/MM/YYYY]",
      blocks: [
        { h: "Publisher" },
        `${COMPANY.name}, ${COMPANY.legalForm} with a share capital of ${COMPANY.capital}, registered office at ${COMPANY.address}. Business ID: ${COMPANY.siret} — Trade register: ${COMPANY.rcs} — VAT: ${COMPANY.vat}. Publication director: ${COMPANY.director}. Contact: ${COMPANY.email} — ${COMPANY.phone}.`,
        { h: "Hosting" },
        `The site is hosted by Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA (vercel.com). The database and authentication are provided by Supabase (supabase.com).`,
        { h: "Intellectual property" },
        `All content on the site (text, images, logos, the Flo Barber brand) is protected by intellectual property law. Any unauthorised reproduction is prohibited.`,
        { h: "Liability" },
        `${COMPANY.name} strives to ensure the accuracy of the information published but cannot be held liable for errors or service unavailability. Booking is handled by a third-party service (Planity).`,
        { h: "Personal data" },
        `The processing of your personal data is described in our privacy policy.`,
      ],
    },
  },

  terms: {
    fr: {
      title: "Conditions générales de vente et d'utilisation",
      updated: "Dernière mise à jour : [JJ/MM/AAAA]",
      blocks: [
        { h: "1. Objet" },
        `Les présentes conditions régissent l'utilisation du site Flo Barber, la vente en ligne de produits de coiffure et de soin, le programme de fidélité, ainsi que la localisation des salons. En créant un compte ou en passant commande, vous les acceptez sans réserve. L'éditeur est identifié dans les mentions légales.`,
        { h: "2. Compte client" },
        `La création d'un compte nécessite des informations exactes. Vous êtes responsable de la confidentialité de vos identifiants. Vous pouvez supprimer votre compte à tout moment depuis l'espace « Mon compte ».`,
        { h: "3. Programme de fidélité" },
        {
          ul: [
            "Le cumul de points est réservé aux titulaires d'un compte. Règle : 1 € dépensé = 1 point, en salon (crédité par le salon via le scan de votre carte) comme en ligne.",
            "Les points sont personnels, non cessibles et non convertibles en espèces.",
            "Les modalités d'utilisation des points (paliers de récompense, valeur, durée de validité) sont précisées ici : [À DÉFINIR].",
            "Flo Barber peut faire évoluer le programme ; les points acquis restent utilisables selon les conditions en vigueur à leur acquisition.",
          ],
        },
        { h: "4. Produits" },
        `Les produits sont présentés avec la plus grande exactitude possible ; les photographies ne sont pas contractuelles. Les offres sont valables dans la limite des stocks disponibles.`,
        { h: "5. Prix" },
        `Les prix sont indiqués en euros toutes taxes comprises, hors frais de livraison. Le prix applicable est celui affiché au moment de la validation de la commande. Flo Barber se réserve le droit de modifier ses prix à tout moment.`,
        { h: "6. Commande" },
        `La commande est validée après acceptation des présentes conditions et confirmation du paiement. Un e-mail de confirmation récapitule la commande. Flo Barber peut refuser ou annuler une commande en cas de litige, de rupture de stock ou de soupçon de fraude.`,
        { h: "7. Paiement" },
        `Le paiement s'effectue par les moyens proposés lors de la commande [MOYENS DE PAIEMENT À PRÉCISER], via un prestataire de paiement sécurisé. La commande est débitée à sa validation.`,
        { h: "8. Livraison" },
        `Les produits sont livrés à l'adresse indiquée, dans les délais et zones précisés lors de la commande [DÉLAIS / ZONES / FRAIS À PRÉCISER]. Les risques sont transférés au client à la réception.`,
        { h: "9. Droit de rétractation" },
        `Conformément à l'article L221-18 du Code de la consommation, vous disposez de 14 jours à compter de la réception pour vous rétracter, sans motif. Pour l'exercer, contactez-nous à ${COMPANY.email}. Le remboursement intervient dans les 14 jours. Exception (art. L221-28) : les produits d'hygiène ou cosmétiques descellés après livraison ne peuvent être repris pour des raisons d'hygiène.`,
        { h: "10. Garanties légales" },
        `Les produits bénéficient de la garantie légale de conformité (2 ans) et de la garantie des vices cachés, dans les conditions prévues par la loi.`,
        { h: "11. Réservation en salon" },
        `La prise de rendez-vous en salon est assurée par un service tiers (Planity) et soumise à ses propres conditions. Flo Barber n'est pas responsable de ce service.`,
        { h: "12. Responsabilité" },
        `Flo Barber ne saurait être tenue responsable des dommages résultant d'un mauvais usage des produits ou d'une indisponibilité temporaire du site.`,
        { h: "13. Données personnelles" },
        `Le traitement de vos données est décrit dans la politique de confidentialité.`,
        { h: "14. Droit applicable et litiges" },
        `Les présentes conditions sont soumises au droit français. En cas de litige, vous pouvez recourir gratuitement à un médiateur de la consommation [MÉDIATEUR À INDIQUER] ou à la plateforme européenne de règlement en ligne des litiges (ec.europa.eu/consumers/odr).`,
      ],
    },
    en: {
      title: "Terms of sale and use",
      updated: "Last updated: [DD/MM/YYYY]",
      blocks: [
        { h: "1. Purpose" },
        `These terms govern the use of the Flo Barber website, the online sale of hair and grooming products, the loyalty program, and the salon locator. By creating an account or placing an order, you accept them in full. The publisher is identified in the legal notice.`,
        { h: "2. Customer account" },
        `Creating an account requires accurate information. You are responsible for keeping your credentials confidential. You may delete your account at any time from the “My account” area.`,
        { h: "3. Loyalty program" },
        {
          ul: [
            "Earning points requires an account. Rule: €1 spent = 1 point, both in salon (credited by the salon by scanning your card) and online.",
            "Points are personal, non-transferable and cannot be exchanged for cash.",
            "The terms for using points (reward tiers, value, validity period) are set out here: [TO BE DEFINED].",
            "Flo Barber may update the program; points already earned remain usable under the conditions applicable when they were earned.",
          ],
        },
        { h: "4. Products" },
        `Products are described as accurately as possible; photographs are not contractual. Offers are valid while stocks last.`,
        { h: "5. Prices" },
        `Prices are shown in euros, all taxes included, excluding delivery costs. The applicable price is the one displayed when the order is confirmed. Flo Barber may change its prices at any time.`,
        { h: "6. Orders" },
        `An order is confirmed once these terms are accepted and payment is validated. A confirmation e-mail summarises the order. Flo Barber may refuse or cancel an order in the event of a dispute, out-of-stock or suspected fraud.`,
        { h: "7. Payment" },
        `Payment is made using the methods offered at checkout [PAYMENT METHODS TO BE SPECIFIED], via a secure payment provider. The order is charged upon validation.`,
        { h: "8. Delivery" },
        `Products are delivered to the address provided, within the times and areas specified at checkout [TIMES / AREAS / FEES TO BE SPECIFIED]. Risk passes to the customer on receipt.`,
        { h: "9. Right of withdrawal" },
        `Under French consumer law (art. L221-18), you have 14 days from receipt to withdraw, without reason. To exercise it, contact us at ${COMPANY.email}. Refunds are issued within 14 days. Exception (art. L221-28): hygiene or cosmetic products unsealed after delivery cannot be returned for hygiene reasons.`,
        { h: "10. Legal warranties" },
        `Products benefit from the legal warranty of conformity (2 years) and the warranty against hidden defects, under the conditions provided by law.`,
        { h: "11. Salon booking" },
        `Salon booking is provided by a third-party service (Planity) and subject to its own terms. Flo Barber is not responsible for this service.`,
        { h: "12. Liability" },
        `Flo Barber cannot be held liable for damage resulting from misuse of the products or temporary unavailability of the site.`,
        { h: "13. Personal data" },
        `The processing of your data is described in the privacy policy.`,
        { h: "14. Governing law and disputes" },
        `These terms are governed by French law. In the event of a dispute, you may use a consumer mediator free of charge [MEDIATOR TO BE SPECIFIED] or the European online dispute resolution platform (ec.europa.eu/consumers/odr).`,
      ],
    },
  },
};
