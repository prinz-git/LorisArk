export const testIds = {
  landing: {
    title: "landing-title",
    loginLink: "landing-login-link",
    registerLink: "landing-register-link",
  },
  login: {
    title: "login-title",
    emailInput: "login-email-input",
    passwordInput: "login-password-input",
    submitButton: "login-submit-button",
    toast: "login-toast",
  },
  register: {
    title: "register-title",
    fullnameInput: "register-fullname-input",
    emailInput: "register-email-input",
    passwordInput: "register-password-input",
    submitButton: "register-submit-button",
    toast: "register-toast",
  },
  dashboard: {
    greeting: "dashboard-greeting",
  },
  users: {
    title: "users-title",
    searchInput: "users-search-input",
    toast: "users-toast",
  },
  editUser: {
    title: "edit-user-title",
    fullnameInput: "edit-user-fullname-input",
    saveButton: "edit-user-save-button",
    backLink: "edit-user-back-link",
    toast: "edit-user-toast",
  },
  profile: {
    title: "profile-title",
    fullnameInput: "profile-fullname-input",
    saveButton: "profile-save-button",
    deleteButton: "profile-delete-button",
    toast: "profile-toast",
  },
} as const;

export const testIdBuilders = {
  usersRow: (userId: number) => `users-row-${userId}`,
  usersEditLink: (userId: number) => `users-edit-link-${userId}`,
  usersDeleteButton: (userId: number) => `users-delete-button-${userId}`,
} as const;
