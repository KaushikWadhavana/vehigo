export const setVerified = () => {
  localStorage.setItem("isVerified", "true");
};

export const isVerified = () => {
  return localStorage.getItem("isVerified") === "true";
};
