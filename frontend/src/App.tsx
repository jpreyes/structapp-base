import { Box } from "@mui/material";
import { Route, Routes } from "react-router-dom";

import DashboardPage from "./pages/DashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import TasksPage from "./pages/TasksPage";
import PaymentsPage from "./pages/PaymentsPage";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
      </Route>
      <Route path="/login" element={<Box sx={{ p: 4 }}><LoginPage /></Box>} />
    </Routes>
  );
}

export default App;
