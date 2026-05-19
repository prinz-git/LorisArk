# Test IDs By Screen

This document maps UI screens to their `data-testid` values. The source of truth
is `frontend/src/lib/testids.ts`.

**Landing (`/`)**
- `landing-hero`
- `landing-hero-content`
- `landing-eyebrow`
- `landing-title`
- `landing-actions`
- `landing-login-link`
- `landing-register-link`
- `landing-feature-card`
- `landing-feature-title`
- `landing-feature-meta`
- `landing-meta-security`
- `landing-meta-speed`
- `landing-meta-data`

**Login (`/login`)**
- `login-page`
- `login-card`
- `login-title`
- `login-form`
- `login-email-input`
- `login-password-input`
- `login-submit-button`
- `login-meta`
- `login-register-link`
- `login-forgot-button`
- `login-toast`

**Register (`/register`)**
- `register-page`
- `register-card`
- `register-title`
- `register-form`
- `register-fullname-input`
- `register-email-input`
- `register-password-input`
- `register-submit-button`
- `register-back-link`
- `register-toast`

**Dashboard (`/dashboard`)**
- `dashboard-page`
- `dashboard-header`
- `dashboard-eyebrow`
- `dashboard-greeting`
- `dashboard-status`
- `dashboard-cards`
- `dashboard-card-users`
- `dashboard-users-count`
- `dashboard-card-activity`
- `dashboard-view-users-link`
- `dashboard-card-profile`
- `dashboard-update-profile-link`
- `dashboard-toast`

**Member Directory (`/users`)**
- `users-page`
- `users-header`
- `users-eyebrow`
- `users-title`
- `users-search-input`
- `users-table`
- `users-row-header`
- `users-toast`

Row-level dynamic IDs for each member:
- `users-row-${userId}`
- `users-row-${userId}-id`
- `users-row-${userId}-name`
- `users-row-${userId}-email`
- `users-row-${userId}-actions`
- `users-edit-link-${userId}`
- `users-delete-button-${userId}`

**Edit Member (`/users/[id]`)**
- `edit-user-page`
- `edit-user-card`
- `edit-user-title`
- `edit-user-form`
- `edit-user-fullname-input`
- `edit-user-email-input`
- `edit-user-actions`
- `edit-user-save-button`
- `edit-user-back-link`
- `edit-user-toast`

**Profile (`/profile`)**
- `profile-page`
- `profile-card`
- `profile-title`
- `profile-form`
- `profile-fullname-input`
- `profile-email-input`
- `profile-password-input`
- `profile-actions`
- `profile-save-button`
- `profile-delete-button`
- `profile-toast`

**Logout (`/logout`)**
- `logout-page`
- `logout-card`
- `logout-title`
- `logout-actions`
- `logout-login-link`
- `logout-home-link`
