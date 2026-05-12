import DashboardHome from "../pages/admin/DashboardHome";
import UsersPage from "../pages/admin/UsersPage";
import ConsultantDashboard from "../pages/consultant/ConsultantDashboard";
import DemandesPage from "../pages/consultant/DemandesPage";
import MapPage from "../pages/consultant/MapPage";
import ServersPage from "../pages/consultant/ServersPage";
import ProfilePage from "../pages/profile/ProfilePage";

export const ROLES = {
  ADMIN: "ROLE_ADMIN",
  CONSULTANT: "ROLE_CONSULTANT",
  TECHNICIAN: "ROLE_TECHNICIAN",
};

export const allRoutes = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "/assets/icons/dashboard.svg",
    roles: [ROLES.ADMIN],
    component: DashboardHome,
  },
  {
    id: "users",
    label: "User Management",
    icon: "/assets/icons/users.svg",
    roles: [ROLES.ADMIN],
    component: UsersPage,
  },
  {
    id: "consultant-dashboard",
    label: "Dashboard",
    icon: "/assets/icons/dashboard.svg",
    roles: [ROLES.CONSULTANT],
    component: ConsultantDashboard,
  },
  {
    id: "demandes",
    label: "Demandes",
    icon: "/assets/icons/ticket-assigned.svg",
    roles: [ROLES.CONSULTANT],
    component: DemandesPage,
  },
  {
    id: "map",
    label: "Map",
    icon: "/assets/icons/topology.svg",
    roles: [ROLES.CONSULTANT],
    component: MapPage,
  },
  {
    id: "servers",
    label: "Servers",
    icon: "/assets/icons/security.svg",
    roles: [ROLES.CONSULTANT],
    component: ServersPage,
  },
 

];

export const getRoutesForRole = (role) =>
  allRoutes.filter(r => r.roles.includes(role));