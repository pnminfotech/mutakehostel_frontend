// src/App.js
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
import Log from './componenet/Log';
import ProjectDashboard from './Pages/ProjectDashboard';
import Dashboard from './Pages/Dashboard';
import Suppliers from './Pages/Suppliers';
import Maintenance from './Pages/Maintenance';
import AdminSidebar from './Pages/AdminSidebar';
import Record from './Pages/record';
import MaintenanceManager from './componenet/Maintanace/MaintenanceManager';
import AddDataDemo from './componenet/Add_Data_Demo';
import LightbillMaintenace from './componenet/Maintanace/LightbillMaintance';
import NewComponant from './componenet/NewComponant';
import MainDashboard from './componenet/MainDashboard';
import NewComponantOriginal from './componenet/NewComponantOriginal';
import LightBillMatrixView from './componenet/Maintanace/LightBillMatrixView';
import LightbillOtherExpenses from './componenet/Maintanace/LightbillOtherExpenses';
import RoomManager from './componenet/RoomManager';
import FormSubmitted from './componenet/FormSubmitted';

// ✅ Import your tenant app (the module you shared at top)
import TenantApp from './tenant/TenantApp';

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
        {/* Auth routes */}
        <Route path="/" element={<Log />} />
        <Route path="/register" element={<Register />} />

        {/* Public Tenant Form */}
        <Route path="/form" element={<Form />} />
        <Route path="/tenant-intake" element={<TenantIntake />} />
        <Route path="/form-submitted" element={<FormSubmitted />} />

        {/* ✅ Mount the entire tenant module under /tenant/* */}
        <Route path="/tenant/*" element={<TenantApp />} />

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

        {/* Maintenance manager and others */}
        <Route path="/maintenance-manager" element={<MaintenanceManager />} />
        <Route path="/Adddatademo" element={<AddDataDemo />} />
        <Route path="/lightbillmaintance" element={<LightbillMaintenace />} />
        <Route path="/lightbillotherexpenses" element={<LightbillOtherExpenses />} />
        <Route path="/NewComponant" element={<NewComponant />} />
        <Route path="/NewComponantOriginal" element={<NewComponantOriginal />} />
        <Route path="/maindashboard" element={<MainDashboard />} />
        <Route path="/LightBillMatrixView" element={<LightBillMatrixView />} />
        <Route path="/roommanager" element={<RoomManager />} />
        <Route path="/formdownload" element={<FormDownload />} />
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
  return (
    <BrowserRouter basename="/HostelManager">
      <Layout />
    </BrowserRouter>
  );
}

export default App;
