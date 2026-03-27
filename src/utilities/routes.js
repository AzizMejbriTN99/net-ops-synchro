import DashboardHome from "../pages/admin/DashboardHome";
import UsersPage from "../pages/admin/UsersPage";

export const routes = [

  {
    label: "Users Management",
    items: [
      {
        label: "Add User",
        icon: "pi pi-fw pi-database",
        to: "/addUser"
      },
      {
        label: "Edit User",
        icon: "pi pi-fw pi-user",
        to: "/editUser"
      }
    ]
  },
  {
    label: "Servers",
    items: [
      {
        label: "Servers Monitoring",
        icon: "pi pi-fw pi-user",
        to: "/serverMonitor"
      }
    ]
  }

];



export const adminRoutes = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "dashboard",
    icon: "/assets/icons/dashboard.svg",
    component: DashboardHome,
  },
  {
    id: "users",
    label: "User Management",
    path: "users",
    icon: "/assets/icons/users.svg",
    component: UsersPage,
  },
];


export default routes;