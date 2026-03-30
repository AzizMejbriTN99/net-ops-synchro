import { API_URL } from "../API_ENDPOINTS";

export const ADMIN = {
  users:         `${API_URL}/api/admin/users`,
  userById: (id)=> `${API_URL}/api/admin/users/${id}`,
  userToggle:(id)=>`${API_URL}/api/admin/users/${id}/toggle`,
  userRegister:  `${API_URL}/api/admin/users/register`,
};

export const NOTIFICATIONS = {
  all:            `${API_URL}/api/notifications`,
  unreadCount:    `${API_URL}/api/notifications/unread-count`,
  markAllRead:    `${API_URL}/api/notifications/mark-all-read`,
  markOne: (id)=> `${API_URL}/api/notifications/${id}/read`,
};

export const CONSULTANT = {
  demandes:              `${API_URL}/api/consultant/demandes`,
  demandeById:   (id) => `${API_URL}/api/consultant/demandes/${id}`,
  demandeStatus: (id) => `${API_URL}/api/consultant/demandes/${id}/status`,
  technicians:          `${API_URL}/api/consultant/technicians`,
};