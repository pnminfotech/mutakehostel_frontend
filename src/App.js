import React from 'react';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';

import TenantIntake from './Pages/TenantIntake';
import Form from './componenet/form';
import AddData from './componenet/AddData';
import UpdateData from './componenet/UpdateData';
import Mainpage from './componenet/mainpage';
import DuplicateForm from './componenet/DuplicateForms';
import Login from './componenet/login';
import Register from './componenet/register';
import ProtectedRoute from './componenet/ProtectedRoute';
import FormDownload from './componenet/Maintanace/FormDownload';
import MeterForm from './componenet/Maintanace/MeterForm';
import Ruf from './componenet/rufWork';
import NewYear from './componenet/newyear';
import Sidebar from './Pages/Sidebar';
import Kahata from './Componen/Kahata';

import ProjectDashboard from './Pages/ProjectDashboard';
import Dashboard from './Pages/Dashboard';
import Suppliers from './Pages/Suppliers';
import Maintenance from './Pages/Maintenance';
import AdminSidebar from './Pages/AdminSidebar';
import Record from './Pages/record';
import MaintenanceManager from './componenet/Maintanace/MaintenanceManager';
import Add_Data_Demo from './componenet/Add_Data_Demo';
import LightbillMaintenace from './componenet/Maintanace/LightbillMaintance';
import NewComponant from './componenet/NewComponant';
import MainDashboard from './componenet/MainDashboard';
import Log from './componenet/Log';
import NewComponantOriginal from './componenet/NewComponantOriginal';
import LightBillMatrixView from './componenet/Maintanace/LightBillMatrixView';
import LightbillOtherExpenses from './componenet/Maintanace/LightbillOtherExpenses';
import RoomManager from './componenet/RoomManager';
import FormSubmitted from './componenet/FormSubmitted';

function Layout() {
  const location = useLocation();

  const showSidebarRoutes = [
    '/dashboard',
    '/suppliers',
    '/maintenance',
    '/record',
    '/manual-entry',
  ];
  const shouldShowSidebar = showSidebarRoutes.includes(location.pathname);

  return (
    <div className="App">
      <Routes>
        {/* Public / Auth */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Public forms (no auth) */}
        <Route path="/form" element={<Form />} />
        <Route path="/tenant-intake" element={<TenantIntake />} />
        <Route path="/form-submitted" element={<FormSubmitted />} />

        {/* Admin / Protected */}
        <Route path="/add-data" element={<ProtectedRoute><AddData /></ProtectedRoute>} />
        <Route path="/update-data" element={<ProtectedRoute><UpdateData /></ProtectedRoute>} />
        <Route path="/duplicate-data" element={<ProtectedRoute><DuplicateForm /></ProtectedRoute>} />
        <Route path="/Form-download" element={<ProtectedRoute><FormDownload /></ProtectedRoute>} />
        <Route path="/ruf" element={<ProtectedRoute><Ruf /></ProtectedRoute>} />
        <Route path="/new" element={<ProtectedRoute><NewYear /></ProtectedRoute>} />
        <Route path="/mainpage" element={<ProtectedRoute><Mainpage /></ProtectedRoute>} />
        <Route path="/meter" element={<ProtectedRoute><MeterForm /></ProtectedRoute>} />
        <Route path="/khata" element={<ProtectedRoute><Kahata /></ProtectedRoute>} />
        <Route path="/project/:id" element={<ProtectedRoute><ProjectDashboard /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
        <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
        <Route path="/setting" element={<ProtectedRoute><AdminSidebar /></ProtectedRoute>} />
        <Route path="/record" element={<ProtectedRoute><Record /></ProtectedRoute>} />
        <Route path="/maintenance-manager" element={<ProtectedRoute><MaintenanceManager /></ProtectedRoute>} />
        <Route path="/Adddatademo" element={<ProtectedRoute><Add_Data_Demo /></ProtectedRoute>} />
        <Route path="/lightbillmaintance" element={<ProtectedRoute><LightbillMaintenace /></ProtectedRoute>} />
        <Route path="/lightbillotherexpenses" element={<ProtectedRoute><LightbillOtherExpenses /></ProtectedRoute>} />
        <Route path="/NewComponant" element={<ProtectedRoute><NewComponant /></ProtectedRoute>} />
        <Route path="/NewComponantOriginal" element={<ProtectedRoute><NewComponantOriginal /></ProtectedRoute>} />
        <Route path="/maindashboard" element={<ProtectedRoute><MainDashboard /></ProtectedRoute>} />
        <Route path="/LightBillMatrixView" element={<ProtectedRoute><LightBillMatrixView /></ProtectedRoute>} />
        <Route path="/roommanager" element={<ProtectedRoute><RoomManager /></ProtectedRoute>} />
        <Route path="/formdownload" element={<ProtectedRoute><FormDownload /></ProtectedRoute>} />

        {/* Optional: 404 fallback */}
        {/* <Route path="*" element={<Login />} /> */}
      </Routes>

      {shouldShowSidebar && (
        <div className="container" style={{ display: 'flex' }}>
          <Sidebar />
        </div>
      )}
    </div>
  );
}

function App() {
  // basename makes all routes live under /HostelManager/*
  return (
    <BrowserRouter basename="/HostelManager">
      <Layout />
    </BrowserRouter>
  );
}

export default App;
