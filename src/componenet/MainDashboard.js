import { FiBarChart2 } from 'react-icons/fi';
import { MdOutlineBedroomParent, MdLightbulbOutline, MdOutlineReceiptLong } from 'react-icons/md';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons";
import React, { useState, useEffect, useRef , useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#1e3a8a', '#FBBF24', '#3B82F6', '#10B981', '#EF4444', '#6366F1'];



    
const MainDashboard = () => {
  const navigate = useNavigate();

  const [summary, setSummary] = useState({
    rent: {},
    beds: {},
    light: {},
    maintenance: {},
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  const menuItems = [
    { label: 'Dashboard', icon: <FiBarChart2 />, path: '/maindashboard' },
    { label: 'Rent & Deposit', icon: <MdOutlineBedroomParent />, path: '/NewComponant' },
    { label: 'Light Bill', icon: <MdLightbulbOutline />, path: '/lightbillotherexpenses' },
    { label: 'Maintenance', icon: <MdOutlineReceiptLong />, path: '/lightbillotherexpenses' },
  ];

  const handleNavigation = (path) => navigate(path);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    navigate("/");
  };
const [showVacantModal, setShowVacantModal] = useState(false);
const [vacantBedsList, setVacantBedsList] = useState([]);
const [showFutureLeaveModal, setShowFutureLeaveModal] = useState(false);

const [rooms, setRooms] = useState([]);
const [tenantsState, setTenantsState] = useState([]);


const futureLeaveTenants = useMemo(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (tenantsState || []).filter(t => {
    if (!t.leaveDate) return false;

    const leaveDate = new Date(t.leaveDate);
    leaveDate.setHours(0, 0, 0, 0);

    return leaveDate > today; // ✅ FUTURE scheduled leave
  });
}, [tenantsState]);

const futureLeaveCount = futureLeaveTenants.length;

const calculateRefund = (t) => {
  const deposit = Number(t.depositAmount || 0);
  const monthlyRent = Number(t.baseRent || t.rentAmount || 0);

  if (!t.leaveDate || !monthlyRent) {
    return { deposit, refundable: deposit, isNegative: false };
  }

  // -------------------------
  // 1️⃣ Pro-rata rent till leave date
  // -------------------------
  const leaveDate = new Date(t.leaveDate);
  const year = leaveDate.getFullYear();
  const month = leaveDate.getMonth();

  const totalDays = new Date(year, month + 1, 0).getDate();
  const occupiedDays = leaveDate.getDate(); // stayed till leave day

  const perDayRent = monthlyRent / totalDays;
  const usedRent = perDayRent * occupiedDays;

  // -------------------------
  // 2️⃣ Pending dues from rents[]
  // -------------------------
  let pendingDue = 0;

  (t.rents || []).forEach((r) => {
    if (!r || Number(r.rentAmount) <= 0) return;

    let rentDate = null;

    // Case 1: month format "Dec-25"
    if (r.month) {
      try {
        const [mon, yy] = r.month.split("-");
        rentDate = new Date(`${mon} 01, 20${yy}`);
      } catch {}
    }

    // Case 2: date field
    if (!rentDate && r.date) {
      rentDate = new Date(r.date);
    }

    if (!rentDate) return;

    // ❗ Only include dues BEFORE leave month
    if (
      rentDate.getFullYear() < year ||
      (rentDate.getFullYear() === year &&
        rentDate.getMonth() < month)
    ) {
      pendingDue += Number(r.rentAmount);
    }
  });

  // -------------------------
  // 3️⃣ Final refundable
  // -------------------------
  const refundable = deposit - usedRent - pendingDue;

  return {
    deposit,
    refundable: Math.round(refundable * 100) / 100,
    isNegative: refundable < 0,
  };
};


const calculatePendingRent = (tenant) => {
  const rents = tenant.rents || [];
  const monthlyRent = Number(tenant.baseRent || tenant.rentAmount || 0);

  if (!monthlyRent) return 0;

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let pending = 0;

  // Check past months only
  rents.forEach(r => {
    if (!r) return;

    let rentDate = null;

    // Format: month = "Nov-25"
    if (r.month) {
      try {
        const [mon, yy] = r.month.split("-");
        rentDate = new Date(`${mon} 1, 20${yy}`);
      } catch {}
    }

    // Format: direct date
    if (!rentDate && r.date) {
      rentDate = new Date(r.date);
    }

    if (!rentDate) return;

    // Only PAST months
    if (
      rentDate.getFullYear() < currentYear ||
      (rentDate.getFullYear() === currentYear &&
        rentDate.getMonth() < currentMonth)
    ) {
      if (!r.rentAmount || Number(r.rentAmount) === 0) {
        pending += monthlyRent;
      }
    }
  });

  return pending;
};



const [showPendingRentModal, setShowPendingRentModal] = useState(false);
const [pendingRentList, setPendingRentList] = useState([]);


  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

const findVacantBeds = () => {
  if (!rooms.length) return;

  // Normalize all occupied bed numbers
  const occupiedBeds = new Set(
    tenantsState.map(t => String(t.bedNo).trim().toLowerCase())
  );

  let vacants = [];

  rooms.forEach(room => {
    const seen = new Set(); // avoid duplicate beds in DB

    (room.beds || []).forEach(bed => {
      const bedKey = String(bed.bedNo).trim().toLowerCase();

      if (seen.has(bedKey)) return;  // skip duplicate DB entry
      seen.add(bedKey);

      if (!occupiedBeds.has(bedKey)) {
        vacants.push({
          roomNo: room.roomNo,
          bedNo: bed.bedNo,
          price: bed.price || 0,
          floorNo: room.floorNo,
          category: room.category
        });
      }
    });
  });

  setVacantBedsList(vacants);
  setShowVacantModal(true);
};


useEffect(() => {
  Promise.all([
    fetch(' http://localhost:8000/api/').then(res => res.json()),
    fetch(' http://localhost:8000/api/light-bill/all').then(res => res.json()),
    fetch(' http://localhost:8000/api/other-expense/all').then(res => res.json()),
    fetch(' http://localhost:8000/api/rooms').then(res => res.json()),
  ]).then(([tenants, lightBills, otherExpenses, rooms]) => {

    // ✅ ADD THESE TWO LINES EXACTLY HERE
    setRooms(rooms);
    setTenantsState(tenants);


    // -------------------------------------------------------
    // YOUR EXISTING BED / OCCUPIED / VACANT / DEPOSITS CALC
    // -------------------------------------------------------
    const totalBeds = rooms.reduce(
      (sum, room) => sum + (room.beds?.length || 0),
      0
    );

const occupied = tenants
  .filter(t => !t.leaveDate && t.bedNo)
  .length;

    const vacant = totalBeds - occupied;

    const deposits = tenants.filter(t => Number(t.depositAmount) > 0).length;

    const today = new Date();
    const Y = today.getFullYear();
    const M = today.getMonth();

// const pendingRents = tenants.filter(t => {
//   if (t.leaveDate) return false;       // tenant already left
//   if (!t.bedNo) return false;          // tenant not assigned a bed

//   const rents = t.rents || [];

//   // Check if paid for this Y-M
//   const paidThisMonth = rents.some(r => {
//     if (!r) return false;
    
//     // Format 1: "Jan-25"
//     if (r.month) {
//       try {
//         const [mon, yy] = r.month.split("-");
//         const year = Number("20" + yy);
//         const month = new Date(`${mon} 1, ${year}`).getMonth();

//         return (
//           year === Y &&
//           month === M &&
//           Number(r.rentAmount) > 0
//         );
//       } catch {}
//     }

//     // Format 2: date stored directly
//     if (r.date) {
//       const d = new Date(r.date);
//       return (
//         d.getFullYear() === Y &&
//         d.getMonth() === M &&
//         Number(r.rentAmount) > 0
//       );
//     }

//     return false;
//   });

//   return !paidThisMonth;
// }).length;









const pendingRentList = tenants.filter(t => {
  if (t.leaveDate) return false;
  if (!t.bedNo) return false;

  const rents = t.rents || [];

  const paidThisMonth = rents.some(r => {
    if (!r) return false;

    if (r.month) {
      try {
        const [mon, yy] = r.month.split("-");
        const year = Number("20" + yy);
        const month = new Date(`${mon} 1, ${year}`).getMonth();
        return (
          year === Y &&
          month === M &&
          Number(r.rentAmount) > 0
        );
      } catch {}
    }

    if (r.date) {
      const d = new Date(r.date);
      return (
        d.getFullYear() === Y &&
        d.getMonth() === M &&
        Number(r.rentAmount) > 0
      );
    }

    return false;
  });

  return !paidThisMonth;
});

const pendingRents = pendingRentList.length;
setPendingRentList(pendingRentList);















    // -------------------------------------------------------
    // LIGHT BILL & MAINTENANCE (UNCHANGED)
    // -------------------------------------------------------
    const totalLight = lightBills.reduce((s, b) => s + Number(b.amount || 0), 0);
    const paidLight = lightBills.filter(b => b.status === 'paid')
      .reduce((s, b) => s + Number(b.amount), 0);
    const pendingLight = totalLight - paidLight;

    const totalMaint = otherExpenses.reduce((s, x) => s + Number(x.mainAmount || 0), 0);
    const paidMaint = otherExpenses.filter(x => x.status === 'paid')
      .reduce((s, x) => s + Number(x.mainAmount), 0);
    const pendingMaint = totalMaint - paidMaint;

    // -------------------------------------------------------
    // SUMMARY UPDATE
    // -------------------------------------------------------
    setSummary({
      beds: { total: totalBeds, occupied, vacant },
      rent: { pending: pendingRents, deposits },
      light: { paid: paidLight, pending: pendingLight },
      maintenance: { paid: paidMaint, pending: pendingMaint },
    });

  });
}, []);


  // ==== Mobile drawer (UNCHANGED) ====
  const [open, setOpen] = useState(false);
  const drawerRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const dayName = currentTime.toLocaleDateString(undefined, { weekday: 'long' });
  const dateString = currentTime.toLocaleDateString();
  const timeString = currentTime.toLocaleTimeString();

  const renderCard = (label, value, bgColor, icon, onClick) => (
    <div className="col-6 col-md-4 col-lg-3 mb-2">
      <div
  className="card border-0 shadow-sm h-100"
  style={{ backgroundColor: bgColor, borderRadius: '12px', padding: '10px 8px', cursor: onClick ? 'pointer' : 'default' }}
  onClick={onClick}
>

        <div className="card-body text-center p-2">
          <div className="fs-5 mb-1">{icon}</div>
          <div className="small text-uppercase text-muted" style={{ fontSize: '0.75rem' }}>{label}</div>
          <div className="fw-semibold" style={{ fontSize: '1rem' }}>{value}</div>
        </div>
      </div>
    </div>
  );

  const renderBarChart = () => {
    const totalLight = (summary.light.paid || 0) + (summary.light.pending || 0);
    const totalMaintenance = (summary.maintenance.paid || 0) + (summary.maintenance.pending || 0);
    const totalRent = (summary.rent.deposits || 0) + (summary.rent.pending || 0);

    const getPercent = (value, total) => total ? (value / total) * 100 : 0;

    const data = [
      { name: 'Light Bill', paid: getPercent(summary.light.paid, totalLight), pending: getPercent(summary.light.pending, totalLight) },
      { name: 'Maintenance', paid: getPercent(summary.maintenance.paid, totalMaintenance), pending: getPercent(summary.maintenance.pending, totalMaintenance) },
      { name: 'Rent', paid: getPercent(summary.rent.deposits, totalRent), pending: getPercent(summary.rent.pending, totalRent) }
    ];

    return (
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 100]} tickFormatter={(value) => `${value.toFixed(0)}%`} />
          <Tooltip formatter={(value) => `${value.toFixed(2)}%`} />
          <Legend verticalAlign="top" height={36} />
          <Bar dataKey="paid" name="Paid" fill="#3db7b1" radius={[10, 10, 0, 0]} />
          <Bar dataKey="pending" name="Pending" fill="#1e3a8a" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderPieCharts = () => {
    const pieData = [
      { title: 'Rent Status', data: [{ name: 'Deposits', value: summary.rent.deposits || 0 }, { name: 'Pending', value: summary.rent.pending || 0 }] },
      { title: 'Light Bill Status', data: [{ name: 'Paid', value: summary.light.paid || 0 }, { name: 'Pending', value: summary.light.pending || 0 }] },
      { title: 'Maintenance Status', data: [{ name: 'Paid', value: summary.maintenance.paid || 0 }, { name: 'Pending', value: summary.maintenance.pending || 0 }] },
      { title: 'Bed Occupancy', data: [{ name: 'Occupied', value: summary.beds.occupied || 0 }, { name: 'Vacant', value: summary.beds.vacant || 0 }] },
    ];

    return (
      <div className="row g-3 mt-2 px-2">
        {pieData.map((chart, idx) => (
          <div className="col-12 col-md-6 col-lg-3" key={idx}>
            <div className="bg-white p-2 rounded shadow-sm h-100 text-center">
              <h6 className="text-primary mb-2">{chart.title}</h6>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={chart.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label>
                    {chart.data.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="d-flex" style={{ minHeight: '100vh', fontFamily: 'Inter, sans-serif', backgroundColor: '#f8f9fa' }}>
      
      {/* ==== CSS + Sidebar + Content (UNCHANGED) ==== */}
      {/* (Your entire JSX remains exactly the same — not touching anything visually) */}

      {/* ==== Your JSX continues unchanged below ==== */}

      {/* Topbar */}
      <style>{`
        .md-topbar { display:none; }
        @media (max-width: 991.98px){
          .md-topbar{
            display:flex;
            position: fixed; top:0; left:0; right:0; height:56px; z-index: 1040;
            align-items:center; justify-content:space-between;
            padding:12px 16px; background:#1e3a8a; color:#fff;
            box-shadow:0 2px 10px rgba(0,0,0,0.2);
          }
          .md-iconbtn{
            display:inline-flex; align-items:center; justify-content:center;
            padding:8px; border:0; border-radius:8px; background:transparent; color:#fff; cursor:pointer;
          }
          .md-backdrop{
            position:fixed; inset:0; background:rgba(0,0,0,0.45); z-index:1035;
          }
          nav.md-drawer{
            transform: translateX(-100%);
            transition: transform .3s ease-in-out;
            top:56px;
            height: calc(100vh - 56px) !important;
          }
          nav.md-drawer.open{ transform: translateX(0); }
          nav.md-drawer .md-desktop-heading{ display:none !important; }
          main.md-shell{
            margin-left: 0 !important;
            padding-top: 72px !important;
          }
        }
      `}</style>

      <div className="md-topbar">
        <button className="md-iconbtn" onClick={() => setOpen(true)} aria-label="Open menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div style={{fontSize:'0.95rem', fontWeight:600}}>Hostel Manager</div>
        <span style={{width:24}} />
      </div>

      {open && <div className="md-backdrop" onClick={() => setOpen(false)} />}

      {/* SIDEBAR */}
      <nav
        ref={drawerRef}
        className={`position-fixed text-white p-3 md-drawer ${open ? 'open' : ''}`}
        style={{ width: 250, height: '100vh', backgroundColor: '#1e3a8a', zIndex: 1045 }}
        onClick={(e) => { e.stopPropagation(); }}
      >
        <div>
          <h2 className="text-center fw-bold mb-4 mt-2 md-desktop-heading">Hostel Manager</h2>

          <ul className="list-unstyled mt-3" style={{textAlign:'left'}}>
            {menuItems.map((item, idx) => (
              <li key={idx} onClick={() => { handleNavigation(item.path); setOpen(false); }} className="mb-2 px-3 py-2 rounded" style={{ cursor: 'pointer' }}>
                {item.icon} <span className="ms-2">{item.label}</span>
              </li>
            ))}
            <li onClick={() => { handleLogout(); setOpen(false); }} className="px-3 py-2 rounded" style={{ cursor: 'pointer' }}>
              <FontAwesomeIcon icon={faSignOutAlt} className="me-2" /> Logout
            </li>
          </ul>
        </div>
        <div className="text-center text-white-50 small mt-4">
          <p>v1.0.0</p>
          <p>© Hostel Manager</p>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="container-fluid md-shell" style={{ marginLeft: 250, paddingTop: 24 }}>

        {/* Summary Cards */}
        <section className="row g-2 mb-3 px-2">
          {renderCard('Total Beds', summary.beds.total || 0, '#76b1d9', <MdOutlineBedroomParent />)}
          {renderCard('Vacant Beds', summary.beds.vacant || 0, '#efe89e', <MdOutlineBedroomParent />, () => findVacantBeds())}

         {renderCard(
  'Pending Rents',
  summary.rent.pending || 0,
  '#ffe0e0',
  <FiBarChart2 />,
  () => setShowPendingRentModal(true)
)}
{renderCard(
  'Upcoming Leaves',
  futureLeaveCount,
  '#fde68a',
  <FiBarChart2 />,
  () => setShowFutureLeaveModal(true)
)}

          {/* {renderCard('Deposit Leaving Tenants', summary.rent.deposits || 0, '#acddaf', <FiBarChart2 />)} */}
          {renderCard('Light Bill Paid', `₹${summary.light.paid || 0}`, '#7897af', <MdLightbulbOutline />)}
          {renderCard('Light Bill Pending', `₹${summary.light.pending || 0}`, '#f5d4a0', <MdLightbulbOutline />)}
          {renderCard('Maintenance Paid', `₹${summary.maintenance.paid || 0}`, '#cebaed', <MdOutlineReceiptLong />)}
          {renderCard('Maintenance Pending', `₹${summary.maintenance.pending || 0}`, '#afe6f3', <MdOutlineReceiptLong />)}
        </section>




        {/* WELCOME & BAR CHART */}
        <section className="row g-3 mt-2 px-2">
          <div className="col-12 col-lg-6">
            <div className="bg-white p-3 rounded shadow-sm h-100 text-center">
              <h1 className="text-primary pt-3">Welcome Admin 👋</h1>
              <p>Today is <strong>{dayName}</strong>, {dateString}, <strong>{timeString}</strong></p>
              <p className="text-muted">
                This dashboard provides a complete overview of the hostel management system including bed occupancy, rent collection, light bill, and maintenance expenses.
              </p>
            </div>
          </div>
          <div className="col-12 col-lg-6">
            <div className="bg-white p-3 rounded shadow-sm h-100">
              <h5 className="text-primary mb-3 text-center">Overall Payment Status (%)</h5>
              {renderBarChart()}
            </div>
          </div>
        </section>

        {/* PIE CHARTS */}
        {renderPieCharts()}









        {showVacantModal && (
  <div
    className="modal d-block"
    tabIndex="-1"
    style={{
      background: "rgba(0,0,0,0.5)",
      position: "fixed",
      inset: 0,
      zIndex: 9999
    }}
  >
    <div className="modal-dialog modal-lg modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Vacant Beds</h5>
          <button
  type="button"
  className="btn-close p-0"
  onClick={() => setShowVacantModal(false)}
>
  x
</button>

        </div>

        <div className="modal-body">
          {vacantBedsList.length === 0 ? (
            <p>No vacant beds found.</p>
          ) : (
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Room No</th>
                  <th>Bed No</th>
                  <th>Floor No</th>
                  <th>Category</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {vacantBedsList.map((b, i) => (
                  <tr key={i}>
                    <td>{b.roomNo}</td>
                    <td>{b.bedNo}</td>
                    <td>{b.floorNo}</td>
                    <td>{b.category}</td>
                    <td>₹{b.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setShowVacantModal(false)}>Close</button>
        </div>
      </div>
    </div>
  </div>
)}
{showFutureLeaveModal && (
  <div
    className="modal d-block"
    tabIndex="-1"
    style={{
      background: "rgba(0,0,0,0.5)",
      position: "fixed",
      inset: 0,
      zIndex: 9999
    }}
  >
    <div className="modal-dialog modal-lg modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Upcoming Leave Tenants</h5>
        <button
  type="button"
  className="btn-close p-0"
  onClick={() => setShowFutureLeaveModal(false)}
>
  x
</button>

        </div>

        <div className="modal-body">
          {futureLeaveTenants.length === 0 ? (
            <p>No upcoming leave tenants.</p>
          ) : (
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Room</th>
                  <th>Bed</th>
                  <th>Leave Date</th>
                  <th>Deposit (₹)</th>
    <th>Refundable (₹)</th>
                  

                </tr>
              </thead>
<tbody>
  {futureLeaveTenants.map((t, i) => {
    const { deposit, refundable, isNegative } = calculateRefund(t);

    return (
      <tr key={t._id || i}>
        <td>{t.name}</td>
        <td>{t.roomNo}</td>
        <td>{t.bedNo}</td>
        <td>{new Date(t.leaveDate).toLocaleDateString()}</td>

        <td className="fw-semibold text-primary">
          ₹{deposit.toLocaleString("en-IN")}
        </td>

        <td
          className={`fw-semibold ${
            isNegative ? "text-danger" : "text-success"
          }`}
        >
          {isNegative
            ? `− ₹${Math.abs(refundable).toLocaleString("en-IN")} (Payable)`
            : `₹${refundable.toLocaleString("en-IN")}`}
        </td>
      </tr>
    );
  })}
</tbody>



            </table>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={() => setShowFutureLeaveModal(false)}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
)}


      </main>
    </div>
  );
};

export default MainDashboard;
