import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`,
});

export const syncUser = async (token, body = {}) => {
  const res = await API.post("/auth/sync", body, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.user;
};

export const checkUserExists = async (token) => {
  const res = await API.post(
    "/auth/check-user",
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};

export const findEmailByPhone = async (phone) => {
  const res = await API.post("/auth/find-email", { phone });
  return res.data.email;
};
