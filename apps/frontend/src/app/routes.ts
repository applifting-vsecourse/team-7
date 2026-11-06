export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyEmail: "/verify-email",
  overview: "/overview",
  calendar: "/calendar",
  disciplines: "/disciplines",
  discipline: "/disciplines/$disciplineId",
  dog: "/dogs/$dogId",
  dogArchive: "/dogs/archive",
} as const;
