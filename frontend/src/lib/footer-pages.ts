export type FooterPage = {
  title: string;
  eyebrow: string;
  summary: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
};

export type FooterLinkGroup = {
  title: string;
  links: Array<{
    label: string;
    href: string;
  }>;
};

export const footerLinkGroups: FooterLinkGroup[] = [
  {
    title: "Ecosystem",
    links: [
      { label: "Find a Roost", href: "/find-roost" },
      { label: "Local Workshops", href: "/local-workshops" },
      { label: "Cluster Maps", href: "/cluster-maps" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Host Hub", href: "/host-hub" },
      { label: "Artisan Registry", href: "/artisan-registry" },
      { label: "Support Ticket", href: "/support-ticket" },
    ],
  },
  {
    title: "Compliance",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Trust & Safety", href: "/trust-safety" },
    ],
  },
  {
    title: "Stay Connected",
    links: [
      { label: "Platform Blog", href: "/blog" },
      { label: "Help Center", href: "/help" },
      { label: "API Sandbox", href: "/api-sandbox" },
    ],
  },
];

export const footerPages: Record<string, FooterPage> = {
  "find-roost": {
    eyebrow: "Ecosystem",
    title: "Find a Roost",
    summary:
      "Browse work-ready stays hosted by local providers, then bundle nearby roots into one travel plan.",
    sections: [
      {
        heading: "Stay Discovery",
        body:
          "Roost listings surface bedrooms, Wi-Fi health, nightly rates, availability windows, and local place context so nomads can compare stays quickly.",
      },
      {
        heading: "Bundle Flow",
        body:
          "After choosing a roost, LorisArk connects the stay to nearby artisan services and checkout-ready booking logic.",
      },
    ],
  },
  "local-workshops": {
    eyebrow: "Ecosystem",
    title: "Local Workshops",
    summary:
      "Discover food, craft, guiding, and cultural experiences created by independent local artisans.",
    sections: [
      {
        heading: "Root Services",
        body:
          "Roots represent local services with capacity, timing, pricing, and location details that can be attached to a stay.",
      },
      {
        heading: "Neighborhood Fit",
        body:
          "The marketplace favors walkable, place-aware experiences that support community-led income around each roost cluster.",
      },
    ],
  },
  "cluster-maps": {
    eyebrow: "Ecosystem",
    title: "Cluster Maps",
    summary:
      "A regional view of roost and root networks for planning community travel routes.",
    sections: [
      {
        heading: "Regional Networks",
        body:
          "Cluster maps are designed to help nomads understand where lodging, workshops, and support services overlap.",
      },
      {
        heading: "Local Context",
        body:
          "Each cluster can highlight operational readiness, host density, artisan coverage, and practical travel signals.",
      },
    ],
  },
  "host-hub": {
    eyebrow: "Community",
    title: "Host Hub",
    summary:
      "The operating space for hosts to manage roost listings, guest readiness, and booking decisions.",
    sections: [
      {
        heading: "Roost Operations",
        body:
          "Hosts can maintain availability, pricing, Wi-Fi status, and lodging details from their dashboard.",
      },
      {
        heading: "Guest Workflow",
        body:
          "Booking queues help hosts review incoming nomad stays, accept requests, and prepare turnover routines.",
      },
    ],
  },
  "artisan-registry": {
    eyebrow: "Community",
    title: "Artisan Registry",
    summary:
      "A workspace for local creators to publish services and manage workshop bookings.",
    sections: [
      {
        heading: "Service Profiles",
        body:
          "Artisans can describe each root, set capacity, define service windows, and track confirmed experiences.",
      },
      {
        heading: "Community Reputation",
        body:
          "The registry is built for trusted local experts who want clear scheduling and fair visibility.",
      },
    ],
  },
  "support-ticket": {
    eyebrow: "Community",
    title: "Support Ticket",
    summary:
      "Request help for active stays, service bookings, account questions, or marketplace operations.",
    sections: [
      {
        heading: "Journey Support",
        body:
          "Support tickets can route issues around check-in, workshop timing, cancellations, and account access.",
      },
      {
        heading: "Resolution Records",
        body:
          "Operational notes keep support interactions traceable for hosts, artisans, nomads, and platform administrators.",
      },
    ],
  },
  terms: {
    eyebrow: "Compliance",
    title: "Terms of Service",
    summary:
      "The conduct, booking, escrow, and marketplace rules governing LorisArk participation.",
    sections: [
      {
        heading: "Marketplace Conduct",
        body:
          "Members agree to provide accurate listings, respectful communication, and timely booking decisions.",
      },
      {
        heading: "Booking Agreements",
        body:
          "Accommodation and service agreements are made between users and independent local providers, with LorisArk coordinating platform workflow.",
      },
    ],
  },
  privacy: {
    eyebrow: "Compliance",
    title: "Privacy Policy",
    summary:
      "How profile, booking, trust, and operational data are handled across the LorisArk marketplace.",
    sections: [
      {
        heading: "Data Use",
        body:
          "LorisArk uses account and booking data to authenticate users, operate dashboards, coordinate stays, and improve marketplace reliability.",
      },
      {
        heading: "Transparency",
        body:
          "Privacy controls should help users understand what information supports listings, bookings, verification, and support.",
      },
    ],
  },
  "trust-safety": {
    eyebrow: "Compliance",
    title: "Trust & Safety",
    summary:
      "Verification, safety checks, and operational rules that protect nomads, hosts, and artisans.",
    sections: [
      {
        heading: "Verification",
        body:
          "Role-aware profiles, listing review, and trust signals help reduce risk before stays and workshops are confirmed.",
      },
      {
        heading: "Local Accountability",
        body:
          "Safety practices focus on clear ownership: providers operate listings directly while LorisArk coordinates marketplace safeguards.",
      },
    ],
  },
  blog: {
    eyebrow: "Stay Connected",
    title: "Platform Blog",
    summary:
      "Updates on roost clusters, root services, host operations, and community marketplace design.",
    sections: [
      {
        heading: "Product Notes",
        body:
          "Follow improvements to booking flows, dashboards, trust workflows, and local service discovery.",
      },
      {
        heading: "Community Field Notes",
        body:
          "Read stories about independent hosts, artisans, and nomads building stronger regional travel networks.",
      },
    ],
  },
  help: {
    eyebrow: "Stay Connected",
    title: "Help Center",
    summary:
      "Practical answers for account setup, roost booking, root services, cancellation, and dashboard use.",
    sections: [
      {
        heading: "Getting Started",
        body:
          "Use help articles to understand registration, role selection, login, profile setup, and marketplace navigation.",
      },
      {
        heading: "Active Bookings",
        body:
          "Guides explain how to manage upcoming stays, provider decisions, service tickets, and support requests.",
      },
    ],
  },
  "api-sandbox": {
    eyebrow: "Stay Connected",
    title: "API Sandbox",
    summary:
      "A technical preview space for testing marketplace workflows, booking state, and integration logic.",
    sections: [
      {
        heading: "Developer Access",
        body:
          "The sandbox is intended for validating role-aware auth, inventory endpoints, booking flows, and operational webhooks.",
      },
      {
        heading: "Operational Signals",
        body:
          "Status indicators can reflect calendar sync, payment readiness, API health, and support availability.",
      },
    ],
  },
};
