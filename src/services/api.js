import { API_URL } from "../API_ENDPOINTS";

export const PROFILE = {
  profile: `${API_URL}/api/auth/profile`
}

export const ADMIN = {
  users: `${API_URL}/api/admin/users`,
  userById: (id) => `${API_URL}/api/admin/users/${id}`,
  userToggle: (id) => `${API_URL}/api/admin/users/${id}/toggle`,
  userRegister: `${API_URL}/api/admin/users/register`,
};

export const NOTIFICATIONS = {
  all: `${API_URL}/api/notifications`,
  unreadCount: `${API_URL}/api/notifications/unread-count`,
  markAllRead: `${API_URL}/api/notifications/mark-all-read`,
  markOne: (id) => `${API_URL}/api/notifications/${id}/read`,
};

export const CONSULTANT = {
  demandes: `${API_URL}/api/consultant/demandes`,
  demandeById: (id) => `${API_URL}/api/consultant/demandes/${id}`,
  demandeStatus: (id) => `${API_URL}/api/consultant/demandes/${id}/status`,
  demandeTimeline: (id) => `${API_URL}/api/consultant/demandes/${id}/timeline`,
  demandeActions: (id) => `${API_URL}/api/consultant/demandes/${id}/actions`,
  demandePhotos: (id) => `${API_URL}/api/consultant/demandes/${id}/photos`,
  demandePhotoFile: (demandeId, photoId) => `${API_URL}/api/consultant/demandes/${demandeId}/photos/${photoId}/file`,
  demandePhotoDelete: (demandeId, photoId) => `${API_URL}/api/consultant/demandes/${demandeId}/photos/${photoId}`,
  generateDemande: `${API_URL}/api/consultant/demandes/generate`,
  technicians: `${API_URL}/api/consultant/technicians`,
};

export const MAP = {
  locations: `${API_URL}/api/map/locations`,
  locationById: (id) => `${API_URL}/api/map/locations/${id}`,
  technicians: `${API_URL}/api/map/technicians`,
  techLocation: `${API_URL}/api/map/technicians/location`,
  demandes: `${API_URL}/api/map/demandes`,
};

export const DASHBOARD = {
  consultant: `${API_URL}/api/dashboard/consultant`,
  admin: `${API_URL}/api/dashboard/admin`,
  adminMonthly: `${API_URL}/api/dashboard/admin/monthly`,
  consultantMonthly: `${API_URL}/api/dashboard/consultant/monthly`,
};

export const SERVERS = {
  list: `${API_URL}/api/servers`,
  byId: (id) => `${API_URL}/api/servers/${id}`,
  tomcat: `${API_URL}/api/servers/tomcat`,
  tomcatById: (id) => `${API_URL}/api/servers/tomcat/${id}`,
  tomcatControl: (id) => `${API_URL}/api/servers/tomcat/${id}/control`,
  tomcatLog: (id, file) => `${API_URL}/api/servers/tomcat/${id}/logs/${file}`,
  databases: `${API_URL}/api/servers/databases`,
  databaseById: (id) => `${API_URL}/api/servers/databases/${id}`,
  status: `${API_URL}/api/servers/status`,
  statusTomcat: `${API_URL}/api/servers/status/tomcat`,
  statusDatabases: `${API_URL}/api/servers/status/databases`,
};