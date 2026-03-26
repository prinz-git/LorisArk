export type RoleOption = {
  id: string;
  title: string;
  label: string;
  copy: string;
};

export const defaultRoleOptions: RoleOption[] = [
  {
    id: "nomad",
    title: "Nomad",
    label: "Guest",
    copy: "Stay in village homes and earn trust through respectful travel.",
  },
  {
    id: "host",
    title: "Host",
    label: "Accommodation",
    copy: "Open your home and manage bookings with confidence.",
  },
  {
    id: "artisan",
    title: "Artisan",
    label: "Service",
    copy: "Offer local services and build a reputation across the Ark.",
  },
];
