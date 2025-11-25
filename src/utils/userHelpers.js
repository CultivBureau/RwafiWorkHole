import { getAuthToken, getUserInfo } from "./page";

export const deriveUserId = () => {
  const userInfo = getUserInfo();
  if (userInfo?.id) return userInfo.id;
  if (userInfo?.userId) return userInfo.userId;
  const msKey = "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
  if (userInfo?.[msKey]) return userInfo[msKey];

  const token = getAuthToken();
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload?.sub) return payload.sub;
      if (payload?.nameid) return payload.nameid;
      if (payload?.userId) return payload.userId;
    } catch {
      return null;
    }
  }
  return null;
};

