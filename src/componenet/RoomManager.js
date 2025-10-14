import React, { useEffect, useState } from "react";
import axios from "axios";

import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
const apiUrl = "http://localhost:8000/api/rooms";

export default function RoomManager() {
  const [rooms, setRooms] = useState([]);
  const [roomForm, setRoomForm] = useState({ roomNo: "", floorNo: "", category: "" });
  const [showAddBedModal, setShowAddBedModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bedForm, setBedForm] = useState({ bedNo: "", price: "" });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState({ roomNo: "", bedNo: "", price: "" });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await axios.get(apiUrl);
      setRooms(res.data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    }
  };

  const addRoom = async () => {
    if (!roomForm.roomNo || !roomForm.floorNo) {
      alert("Room No and Floor No are required.");
      return;
    }
    try {
      await axios.post(apiUrl, roomForm);
      setRoomForm({ roomNo: "", floorNo: "", category: "" });
      fetchRooms();
    } catch (error) {
      console.error("Error adding room:", error);
      alert("Failed to add room.");
    }
  };

  const openAddBedModal = (room) => {
    setSelectedRoom(room);
    setBedForm({ bedNo: "", price: "" });
    setShowAddBedModal(true);
  };

  const addBedToRoom = async () => {
    if (!selectedRoom || !bedForm.bedNo) {
      alert("Bed No is required.");
      return;
    }
    try {
   await axios.post(`${apiUrl}/${selectedRoom.roomNo}/bed`, {
  bedNo: bedForm.bedNo,
  price: bedForm.price ? Number(bedForm.price) : null
});

      fetchRooms();
      setShowAddBedModal(false);
      setBedForm({ bedNo: "", price: "" });
    } catch (err) {
      console.error("Failed to add bed:", err.response?.data || err.message);
      alert("Failed to add bed: " + (err.response?.data?.message || err.message));
    }
  };

  const openEditModal = (roomNo, bedNo, currentPrice) => {
    setEditTarget({ roomNo, bedNo, price: currentPrice ?? "" });
    setShowEditModal(true);
  };
 const navigate = useNavigate();
  const handleNavigation = (path) => {
    navigate(path);
  };
  const updateBedPrice = async () => {
    if (editTarget.price === "" || isNaN(Number(editTarget.price))) {
      alert("Invalid price.");
      return;
    }
    try {
      await axios.put(`${apiUrl}/${editTarget.roomNo}/bed/${editTarget.bedNo}`, {
        price: Number(editTarget.price),
      });
      setShowEditModal(false);
      fetchRooms();
    } catch (error) {
      console.error("Error updating price:", error);
      alert("Failed to update price.");
    }
  };

  const modalBackdropStyle = {
    backgroundColor: "rgba(0,0,0,0.5)",
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1050,
  };

  return (
    <div className="container mt-4">
      
       <button
                className="btn me-2"
                style={{ backgroundColor: "#483f3fab", color: "white" }}
                onClick={() => handleNavigation("/NewComponant")}
              >
                <FaArrowLeft className="me-1" />
                Back
              </button>
      <h4 className="mb-4">Room & Bed Management</h4>

      {/* Add Room Card */}
      <div className="card mb-4">
        <div className="card-header">Add Room</div>
        <div className="card-body d-flex flex-column gap-3">
          {/* Category Field */}
          <input
            className="form-control"
            placeholder="Category"
            value={roomForm.category}
            onChange={(e) => setRoomForm({ ...roomForm, category: e.target.value })}
          />

          {/* Room No & Floor No side by side */}
          <div className="d-flex gap-3">
            <input
              className="form-control"
              placeholder="Room No"
              value={roomForm.roomNo}
              onChange={(e) => setRoomForm({ ...roomForm, roomNo: e.target.value })}
            />
            <input
              className="form-control"
              placeholder="Floor No"
              value={roomForm.floorNo}
              onChange={(e) => setRoomForm({ ...roomForm, floorNo: e.target.value })}
            />
          </div>

          {/* Centered button */}
          <div className="d-flex justify-content-center">
            <button className="btn btn-success" onClick={addRoom}>
              Add Room
            </button>
          </div>
        </div>
      </div>

      {/* Rooms & Beds Table */}
   
<div className="card">
  <div className="card-header">Rooms & Beds</div>
  <div className="card-body table-responsive">
    <table className="table table-bordered">
      <thead>
        <tr>
          <th>Room No</th>
          <th>Floor No</th>
          <th>Category</th> {/* ✅ Added new column */}
          <th>Beds</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {rooms.map((room) => (
          <tr key={room.roomNo}>
            <td>{room.roomNo}</td>
            <td>{room.floorNo}</td>
            <td>{room.category || "-"}</td> {/* ✅ Show category */}
            <td>
              {room.beds?.map((bed) => (
                <div
                  key={bed.bedNo}
                  className="d-flex justify-content-between align-items-center"
                >
                  <span>{bed.bedNo}</span>
                  <span
                    style={{ cursor: "pointer", color: "blue" }}
                    onClick={() => openEditModal(room.roomNo, bed.bedNo, bed.price)}
                  >
                    ₹{bed.price ?? "-"}
                  </span>
                </div>
              ))}
            </td>
            <td>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => openAddBedModal(room)}
              >
                Add Bed
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>


      {/* Add Bed Modal */}
      {showAddBedModal && (
        <div className="modal d-block" tabIndex="-1" style={modalBackdropStyle}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Add Bed to Room {selectedRoom?.roomNo}
                </h5>
                <button
                  className="btn-close"
                  onClick={() => setShowAddBedModal(false)}
                ></button>
              </div>
              <div className="modal-body d-flex flex-column gap-3">
                <input
                  className="form-control"
                  placeholder="Bed No"
                  value={bedForm.bedNo}
                  onChange={(e) => setBedForm({ ...bedForm, bedNo: e.target.value })}
                />
                <input
                  className="form-control"
                  placeholder="Price (optional)"
                  type="number"
                  value={bedForm.price}
                  onChange={(e) => setBedForm({ ...bedForm, price: e.target.value })}
                />
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowAddBedModal(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={addBedToRoom}>
                  Add Bed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Price Modal */}
      {showEditModal && (
        <div className="modal d-block" tabIndex="-1" style={modalBackdropStyle}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Update Price</h5>
                <button
                  className="btn-close"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <input
                  type="number"
                  className="form-control"
                  value={editTarget.price}
                  onChange={(e) =>
                    setEditTarget({ ...editTarget, price: e.target.value })
                  }
                />
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button className="btn btn-success" onClick={updateBedPrice}>
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
