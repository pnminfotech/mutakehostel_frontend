import { useState, useEffect } from "react";
import axios from "axios";
import { User } from "lucide-react";
import { FaDatabase, FaWarehouse, FaClipboard, FaTachometerAlt, FaTools} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "../Pages/khata.css";

const Sidebar = () => {
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const fetchUserName = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        const response = await axios.get("https://hostelpaymentmanger.onrender.com/api/user", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUserName(response.data.username);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserName();
  }, []);

  const navigate = useNavigate();
  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <div className="sidebar bg-gray-800 text-white fixed left-0 top-0 bottom-0 w-64 p-4">
      {/* Header */}
      <div className="mb-6 text-center">
        <h6 className="text-gray-400 text-sm">Welcome,</h6>
        <h4 className="font-bold text-yellow-500 text-lg flex items-center justify-center gap-2">
          <User color="white" size={18} /> {userName?.toUpperCase() || "GUEST"}!
        </h4>
        <h6 className="text-gray-300 text-sm mt-1">Management Book</h6>
      </div>

      <hr className="border-gray-600 mb-4" />

      {/* Navigation Links */}
      <div className="flex flex-col gap-3">
        <div className="sidebar-item" onClick={() => handleNavigation("/dashboard")}>
          <FaTachometerAlt className="icon" /> Dashboard
        </div>
        <div className="sidebar-item" onClick={() => handleNavigation("/suppliers")}>
          <FaWarehouse className="icon" /> Suppliers
        </div>
        <div className="sidebar-item" onClick={() => handleNavigation("/maintenance")}>
          <FaClipboard className="icon" /> All Projects
        </div>
        <div className="sidebar-item" onClick={() => handleNavigation("/record")}>
          <FaDatabase className="icon" /> Expenses
        </div>
        <div className="sidebar-item" onClick={() => handleNavigation("/setting")}>
       <FaTools className="icon" />  Settings
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
