export const ADMIN_EMAILS = (process.env.REACT_APP_ADMIN_EMAILS || "sophiamariem@gmail.com")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
