import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../../utils/api';
import { userAPI } from '../../utils/api';

const AttendanceReports = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    employee: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1
  });
  const [summary, setSummary] = useState({
    totalRecords: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    totalOvertimeHours: 0
  });

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
  }, [filters, pagination.page]);

  const fetchEmployees = async () => {
    try {
      const response = await userAPI.getAllUsers({ limit: 1000 }); // Get all employees
      setEmployees(response.data?.users || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params = {
        employee: filters.employee || undefined,
        status: filters.status || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        page: pagination.page,
        limit: pagination.limit
      };
      const response = await attendanceAPI.getAllAttendance(params);
      const data = response.data?.attendance || [];
      setAttendanceData(data);
      setPagination(prev => ({
        ...prev,
        totalPages: response.data?.totalPages || 1
      }));

      // Calculate summary
      const summaryData = {
        totalRecords: data.length,
        presentDays: data.filter(record => record.status === 'Present').length,
        absentDays: data.filter(record => record.status === 'Absent').length,
        lateDays: data.filter(record => record.isLate).length,
        totalOvertimeHours: data.reduce((sum, record) => sum + (record.overtime || 0), 0)
      };
      setSummary(summaryData);
    } catch (error) {
      console.error('Error fetching attendance reports:', error);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when filtering
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({
        ...prev,
        page: newPage
      }));
    }
  };

  const clearFilters = () => {
    setFilters({
      employee: '',
      status: '',
      startDate: '',
      endDate: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStatusBadge = (status, isLate) => {
    let badgeClass = 'badge ';
    switch (status) {
      case 'Present':
        badgeClass += isLate ? 'bg-warning' : 'bg-success';
        break;
      case 'Absent':
        badgeClass += 'bg-danger';
        break;
      case 'Late':
        badgeClass += 'bg-warning';
        break;
      case 'Half Day':
        badgeClass += 'bg-info';
        break;
      case 'On Leave':
        badgeClass += 'bg-secondary';
        break;
      case 'Holiday':
        badgeClass += 'bg-primary';
        break;
      default:
        badgeClass += 'bg-light text-dark';
    }
    return badgeClass;
  };

  return (
    <div className="container-fluid mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3><i className="bi bi-graph-up me-2"></i>Attendance Reports</h3>
        <button className="btn btn-outline-secondary" onClick={clearFilters}>
          <i className="bi bi-arrow-clockwise me-1"></i>Clear Filters
        </button>
      </div>

      {/* Summary Cards */}
      <div className="row mb-4">
        <div className="col-md-2">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="text-primary">{summary.totalRecords}</h5>
              <small className="text-muted">Total Records</small>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="text-success">{summary.presentDays}</h5>
              <small className="text-muted">Present Days</small>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="text-danger">{summary.absentDays}</h5>
              <small className="text-muted">Absent Days</small>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="text-warning">{summary.lateDays}</h5>
              <small className="text-muted">Late Days</small>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card text-center">
            <div className="card-body">
              <h5 className="text-info">{summary.totalOvertimeHours.toFixed(2)} hrs</h5>
              <small className="text-muted">Total Overtime</small>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-header">
          <h6 className="mb-0"><i className="bi bi-funnel me-2"></i>Filters</h6>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <label className="form-label">Employee:</label>
              <select
                name="employee"
                value={filters.employee}
                onChange={handleFilterChange}
                className="form-select"
              >
                <option value="">All Employees</option>
                {employees.map(employee => (
                  <option key={employee._id} value={employee._id}>
                    {employee.firstName} {employee.lastName} ({employee.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Status:</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="form-select"
              >
                <option value="">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
                <option value="Half Day">Half Day</option>
                <option value="On Leave">On Leave</option>
                <option value="Holiday">Holiday</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Start Date:</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleFilterChange}
                className="form-control"
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">End Date:</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleFilterChange}
                className="form-control"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card">
        <div className="card-header">
          <h6 className="mb-0"><i className="bi bi-table me-2"></i>Attendance Records</h6>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading attendance data...</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th>Date</th>
                      <th>Employee</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Total Hours</th>
                      <th>Status</th>
                      <th>Late Minutes</th>
                      <th>Overtime (hrs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-4">
                          <i className="bi bi-calendar-x text-muted" style={{ fontSize: '2rem' }}></i>
                          <p className="text-muted mt-2">No attendance records found</p>
                        </td>
                      </tr>
                    ) : (
                      attendanceData.map(record => (
                        <tr key={record._id}>
                          <td>{new Date(record.date).toLocaleDateString()}</td>
                          <td>
                            <div>
                              <strong>{record.employee?.firstName} {record.employee?.lastName}</strong>
                              <br />
                              <small className="text-muted">{record.employee?.email}</small>
                            </div>
                          </td>
                          <td>
                            {record.checkIn ? (
                              <span className="text-success">
                                <i className="bi bi-clock me-1"></i>
                                {new Date(record.checkIn).toLocaleTimeString()}
                              </span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            {record.checkOut ? (
                              <span className="text-danger">
                                <i className="bi bi-clock me-1"></i>
                                {new Date(record.checkOut).toLocaleTimeString()}
                              </span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            <strong>{record.totalHours?.toFixed(2) || '0.00'}</strong>
                          </td>
                          <td>
                            <span className={getStatusBadge(record.status, record.isLate)}>
                              {record.status}
                              {record.isLate && record.status === 'Present' && ' (Late)'}
                            </span>
                          </td>
                          <td>
                            {record.lateMinutes > 0 ? (
                              <span className="text-warning">
                                <i className="bi bi-exclamation-triangle me-1"></i>
                                {record.lateMinutes} min
                              </span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>
                            {record.overtime > 0 ? (
                              <span className="text-info">
                                <i className="bi bi-plus-circle me-1"></i>
                                {record.overtime?.toFixed(2)}
                              </span>
                            ) : (
                              <span className="text-muted">0.00</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <nav className="mt-3">
                  <ul className="pagination justify-content-center">
                    <li className={`page-item ${pagination.page === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                      >
                        <i className="bi bi-chevron-left"></i> Previous
                      </button>
                    </li>
                    {[...Array(Math.min(pagination.totalPages, 5)).keys()].map(num => {
                      const pageNum = num + 1;
                      return (
                        <li key={pageNum} className={`page-item ${pagination.page === pageNum ? 'active' : ''}`}>
                          <button 
                            className="page-link" 
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </button>
                        </li>
                      );
                    })}
                    <li className={`page-item ${pagination.page === pagination.totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                      >
                        Next <i className="bi bi-chevron-right"></i>
                      </button>
                    </li>
                  </ul>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceReports;
