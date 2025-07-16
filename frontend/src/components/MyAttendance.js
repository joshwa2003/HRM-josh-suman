import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI } from '../utils/api';

const MyAttendance = () => {
  // eslint-disable-next-line no-unused-vars
  const { user } = useAuth();
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkOutLoading, setCheckOutLoading] = useState(false);
  const [showLateModal, setShowLateModal] = useState(false);
  const [lateArrivalData, setLateArrivalData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [location, setLocation] = useState('Office');
  const [notes, setNotes] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute for live work hours calculation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const fetchTodayAttendance = useCallback(async () => {
    try {
      const response = await attendanceAPI.getTodayAttendance();
      setTodayAttendance(response.data.attendance);
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    }
  }, []);

  const fetchAttendanceHistory = useCallback(async () => {
    try {
      const response = await attendanceAPI.getMyAttendance({
        month: selectedMonth,
        year: selectedYear,
        limit: 31
      });
      setAttendanceHistory(response.data.attendance);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
    }
  }, [selectedMonth, selectedYear]);

  const fetchAttendanceSummary = useCallback(async () => {
    try {
      const response = await attendanceAPI.getAttendanceSummary({
        month: selectedMonth,
        year: selectedYear
      });
      setAttendanceSummary(response.data.summary);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching attendance summary:', error);
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchTodayAttendance();
    fetchAttendanceHistory();
    fetchAttendanceSummary();
  }, [fetchTodayAttendance, fetchAttendanceHistory, fetchAttendanceSummary]);

  const handleCheckIn = async () => {
    setCheckInLoading(true);
    try {
      const response = await attendanceAPI.checkIn({
        location,
        notes
      });
      
      setTodayAttendance(response.data.attendance);
      setNotes('');
      
      // Check if employee arrived late (more than 59 seconds after standard time)
      if (response.data.isLateArrival && response.data.lateMinutes > 0) {
        setLateArrivalData({
          lateMinutes: response.data.lateMinutes,
          checkInTime: response.data.attendance.checkIn
        });
        setShowLateModal(true);
      } else {
        // Show success message for on-time or early arrival
        alert('Check-in successful!');
      }
      
      // Refresh data
      fetchAttendanceHistory();
      fetchAttendanceSummary();
    } catch (error) {
      alert(error.response?.data?.message || 'Check-in failed');
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckOutLoading(true);
    try {
      const response = await attendanceAPI.checkOut({
        notes
      });
      
      setTodayAttendance(response.data.attendance);
      setNotes('');
      
      // Show success message
      alert('Check-out successful!');
      
      // Refresh data
      fetchAttendanceHistory();
      fetchAttendanceSummary();
    } catch (error) {
      alert(error.response?.data?.message || 'Check-out failed');
    } finally {
      setCheckOutLoading(false);
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDuration = (hours) => {
    if (!hours) return '0h 0m';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const formatDelayTime = (minutes) => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    
    let result = '';
    if (hours > 0) result += `${hours}h `;
    if (mins > 0 || hours === 0) result += `${mins}m`;
    
    return result.trim();
  };

  const calculateCurrentWorkHours = (checkInTime) => {
    if (!checkInTime) return '0h 0m';
    
    const checkIn = new Date(checkInTime);
    const now = currentTime; // Use state-managed current time for live updates
    const timeDiff = now.getTime() - checkIn.getTime();
    const totalMinutes = Math.floor(timeDiff / (1000 * 60));
    
    if (totalMinutes <= 0) return '0h 0m';
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      'Present': 'bg-success',
      'Absent': 'bg-danger',
      'Late': 'bg-warning',
      'Half Day': 'bg-info',
      'On Leave': 'bg-secondary',
      'Holiday': 'bg-primary'
    };
    
    return (
      <span className={`badge ${statusClasses[status] || 'bg-secondary'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>
              <i className="bi bi-clock me-2"></i>
              My Attendance
            </h2>
            <div className="d-flex gap-2">
              <select 
                className="form-select" 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                style={{ width: 'auto' }}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('en-US', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select 
                className="form-select" 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                style={{ width: 'auto' }}
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <option key={2020 + i} value={2020 + i}>
                    {2020 + i}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Attendance Card */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-calendar-day me-2"></i>
                Today's Attendance - {formatDate(new Date())}
              </h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="row">
                    <div className="col-6">
                      <div className="text-center p-3 border rounded">
                        <h6 className="text-muted mb-1">Check In</h6>
                        <h4 className="mb-0 text-success">
                          {formatTime(todayAttendance?.checkIn)}
                        </h4>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center p-3 border rounded">
                        <h6 className="text-muted mb-1">Check Out</h6>
                        <h4 className="mb-0 text-danger">
                          {formatTime(todayAttendance?.checkOut)}
                        </h4>
                      </div>
                    </div>
                  </div>
                  <div className="row mt-3">
                    <div className="col-6">
                      <div className="text-center p-3 border rounded">
                        <h6 className="text-muted mb-1">
                          {todayAttendance?.checkOut ? 'Total Hours' : 'Current Hours'}
                        </h6>
                        <h4 className="mb-0 text-info">
                          {todayAttendance?.checkOut 
                            ? formatDuration(todayAttendance?.totalHours)
                            : calculateCurrentWorkHours(todayAttendance?.checkIn)
                          }
                        </h4>
                        {!todayAttendance?.checkOut && todayAttendance?.checkIn && (
                          <small className="text-muted">
                            <i className="bi bi-clock me-1"></i>
                            Live counter
                          </small>
                        )}
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="text-center p-3 border rounded">
                        <h6 className="text-muted mb-1">Status</h6>
                        <h4 className="mb-0">
                          {todayAttendance ? getStatusBadge(todayAttendance.status) : getStatusBadge('Absent')}
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card bg-light">
                    <div className="card-body">
                      <h6 className="card-title">Quick Actions</h6>
                      
                      {/* Location Selection */}
                      <div className="mb-3">
                        <label className="form-label">Location</label>
                        <select 
                          className="form-select" 
                          value={location} 
                          onChange={(e) => setLocation(e.target.value)}
                          disabled={todayAttendance?.checkIn && todayAttendance?.checkOut}
                        >
                          <option value="Office">Office</option>
                          <option value="Remote">Remote</option>
                          <option value="Client Site">Client Site</option>
                        </select>
                      </div>

                      {/* Notes */}
                      <div className="mb-3">
                        <label className="form-label">Notes (Optional)</label>
                        <textarea 
                          className="form-control" 
                          rows="2" 
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add any notes..."
                          maxLength="300"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="d-grid gap-2">
                        {!todayAttendance?.checkIn ? (
                          <button 
                            className="btn btn-success" 
                            onClick={handleCheckIn}
                            disabled={checkInLoading}
                          >
                            {checkInLoading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Checking In...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-box-arrow-in-right me-2"></i>
                                Check In
                              </>
                            )}
                          </button>
                        ) : !todayAttendance?.checkOut ? (
                          <button 
                            className="btn btn-danger" 
                            onClick={handleCheckOut}
                            disabled={checkOutLoading}
                          >
                            {checkOutLoading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Checking Out...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-box-arrow-right me-2"></i>
                                Check Out
                              </>
                            )}
                          </button>
                        ) : (
                          <div className="alert alert-success mb-0">
                            <i className="bi bi-check-circle me-2"></i>
                            You have completed your attendance for today!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Summary */}
      {attendanceSummary && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="bi bi-graph-up me-2"></i>
                  Monthly Summary - {new Date(0, selectedMonth - 1).toLocaleString('en-US', { month: 'long' })} {selectedYear}
                </h5>
              </div>
              <div className="card-body">
                <div className="row text-center">
                  <div className="col-md-2">
                    <div className="p-3 border rounded">
                      <h4 className="text-primary mb-1">{attendanceSummary.totalDays}</h4>
                      <small className="text-muted">Total Days</small>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="p-3 border rounded">
                      <h4 className="text-success mb-1">{attendanceSummary.presentDays}</h4>
                      <small className="text-muted">Present</small>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="p-3 border rounded">
                      <h4 className="text-danger mb-1">{attendanceSummary.absentDays}</h4>
                      <small className="text-muted">Absent</small>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="p-3 border rounded">
                      <h4 className="text-warning mb-1">{attendanceSummary.lateDays}</h4>
                      <small className="text-muted">Late Days</small>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="p-3 border rounded">
                      <h4 className="text-info mb-1">{formatDuration(attendanceSummary.totalHours)}</h4>
                      <small className="text-muted">Total Hours</small>
                    </div>
                  </div>
                  <div className="col-md-2">
                    <div className="p-3 border rounded">
                      <h4 className="text-secondary mb-1">{formatDuration(attendanceSummary.overtimeHours)}</h4>
                      <small className="text-muted">Overtime</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance History */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="bi bi-clock-history me-2"></i>
                Attendance History
              </h5>
            </div>
            <div className="card-body">
              {attendanceHistory.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Total Hours</th>
                        <th>Status</th>
                        <th>Location</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceHistory.map((record) => (
                        <tr key={record._id}>
                          <td>{formatDate(record.date)}</td>
                          <td>
                            {formatTime(record.checkIn)}
                            {record.isLate && (
                              <small className="text-warning ms-1">
                                <i className="bi bi-exclamation-triangle"></i>
                                Late by {formatDelayTime(record.lateMinutes)}
                              </small>
                            )}
                          </td>
                          <td>
                            {formatTime(record.checkOut)}
                            {record.isEarly && (
                              <small className="text-info ms-1">
                                <i className="bi bi-info-circle"></i>
                                Early by {formatDelayTime(record.earlyMinutes)}
                              </small>
                            )}
                          </td>
                          <td>
                            {record.checkOut 
                              ? formatDuration(record.totalHours)
                              : calculateCurrentWorkHours(record.checkIn)
                            }
                            {!record.checkOut && record.checkIn && (
                              <small className="text-info ms-1">
                                <i className="bi bi-clock me-1"></i>
                                Current
                              </small>
                            )}
                            {record.overtime > 0 && (
                              <small className="text-success ms-1">
                                <i className="bi bi-plus-circle"></i>
                                +{formatDuration(record.overtime)} OT
                              </small>
                            )}
                          </td>
                          <td>{getStatusBadge(record.status)}</td>
                          <td>
                            <span className="badge bg-light text-dark">
                              {record.location}
                            </span>
                          </td>
                          <td>
                            {record.notes && (
                              <small className="text-muted">{record.notes}</small>
                            )}
                            {record.isRegularized && (
                              <small className="text-warning d-block">
                                <i className="bi bi-pencil-square"></i>
                                Regularized
                              </small>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <i className="bi bi-calendar-x text-muted" style={{ fontSize: '3rem' }}></i>
                  <h5 className="text-muted mt-2">No attendance records found</h5>
                  <p className="text-muted">
                    No attendance records found for {new Date(0, selectedMonth - 1).toLocaleString('en-US', { month: 'long' })} {selectedYear}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Late Arrival Modal */}
      {showLateModal && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-warning text-dark">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Late Arrival Notice
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowLateModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="text-center mb-3">
                  <i className="bi bi-clock text-warning" style={{ fontSize: '3rem' }}></i>
                </div>
                <div className="alert alert-warning">
                  <h6 className="alert-heading">You have arrived late today!</h6>
                  <hr />
                  <div className="row">
                    <div className="col-6">
                      <small className="text-muted">Expected Check-in:</small>
                      <div className="fw-bold">1:00 PM</div>
                    </div>
                    <div className="col-6">
                      <small className="text-muted">Your Check-in:</small>
                      <div className="fw-bold text-warning">
                        {lateArrivalData && formatTime(lateArrivalData.checkInTime)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <span className="badge bg-warning text-dark fs-6">
                      <i className="bi bi-stopwatch me-1"></i>
                      Late by {lateArrivalData && formatDelayTime(lateArrivalData.lateMinutes)}
                    </span>
                  </div>
                </div>
                <div className="alert alert-info">
                  <small>
                    <i className="bi bi-info-circle me-1"></i>
                    <strong>Note:</strong> Your attendance has been marked as "Late and Present". 
                    Late threshold is 59 seconds after the scheduled check-in time (1:00 PM).
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-warning" 
                  onClick={() => setShowLateModal(false)}
                >
                  <i className="bi bi-check-circle me-1"></i>
                  Understood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAttendance;
