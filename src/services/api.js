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
  demandeTimeline:(id)=> `${API_URL}/api/consultant/demandes/${id}/timeline`,
  demandeActions:(id) => `${API_URL}/api/consultant/demandes/${id}/actions`,
  technicians:          `${API_URL}/api/consultant/technicians`,
};

export const MAP = {
  locations:          `${API_URL}/api/map/locations`,
  locationById: (id)=> `${API_URL}/api/map/locations/${id}`,
  technicians:        `${API_URL}/api/map/technicians`,
  techLocation:       `${API_URL}/api/map/technicians/location`,
  demandes:           `${API_URL}/api/map/demandes`,
};

export const DASHBOARD = {
  consultant: `${API_URL}/api/dashboard/consultant`,
  admin:      `${API_URL}/api/dashboard/admin`,
};