import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const WorkHoursSettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    checkInTime: '11:40',
    checkOutTime: '11:50',
    workingHours: 0.167,
    lateThreshold: 30,
    breakTime: 60
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // This would be an API call to get current settings
      // For now, using default values
      setLoading(false);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // This would be an API call to save settings
      // For now, just show success message
      setMessage('Work hours settings updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error updating settings. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
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
              Work Hours Settings
            </h2>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5 className="mb-0">
                <i className="bi bi-gear me-2"></i>
                Configure Work Hours
              </h5>
            </div>
            <div className="card-body">
              {message && (
                <div className={`alert ${message.includes('Error') ? 'alert-danger' : 'alert-success'} alert-dismissible fade show`}>
                  {message}
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setMessage('')}
                  ></button>
                </div>
              )}

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">
                      <i className="bi bi-clock me-1"></i>
                      Standard Check-in Time
                    </label>
                    <input
                      type="time"
                      className="form-control"
                      value={settings.checkInTime}
                      onChange={(e) => handleChange('checkInTime', e.target.value)}
                    />
                    <small className="text-muted">
                      Employees checking in after this time will be marked as late
                    </small>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">
                      <i className="bi bi-clock me-1"></i>
                      Standard Check-out Time
                    </label>
                    <input
                      type="time"
                      className="form-control"
                      value={settings.checkOutTime}
                      onChange={(e) => handleChange('checkOutTime', e.target.value)}
                    />
                    <small className="text-muted">
                      Expected end of work day
                    </small>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">
                      <i className="bi bi-hourglass me-1"></i>
                      Daily Working Hours
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      min="0.1"
                      max="12"
                      step="0.1"
                      value={settings.workingHours}
                      onChange={(e) => handleChange('workingHours', parseFloat(e.target.value))}
                    />
                    <small className="text-muted">
                      Required hours per day
                    </small>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">
                      <i className="bi bi-exclamation-triangle me-1"></i>
                      Late Threshold (minutes)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      max="120"
                      value={settings.lateThreshold}
                      onChange={(e) => handleChange('lateThreshold', parseInt(e.target.value))}
                    />
                    <small className="text-muted">
                      Minutes after which status becomes "Late"
                    </small>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">
                      <i className="bi bi-cup me-1"></i>
                      Default Break Time (minutes)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      min="0"
                      max="120"
                      value={settings.breakTime}
                      onChange={(e) => handleChange('breakTime', parseInt(e.target.value))}
                    />
                    <small className="text-muted">
                      Default break duration
                    </small>
                  </div>
                </div>
              </div>

              <div className="d-flex justify-content-end">
                <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-2"></i>
                      Save Settings
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-header bg-info text-white">
              <h6 className="mb-0">
                <i className="bi bi-info-circle me-2"></i>
                Current Configuration
              </h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <strong>Work Schedule:</strong>
                <div className="text-muted">
                  {settings.checkInTime} - {settings.checkOutTime}
                </div>
              </div>
              
              <div className="mb-3">
                <strong>Daily Hours:</strong>
                <div className="text-muted">
                  {settings.workingHours} hours
                </div>
              </div>
              
              <div className="mb-3">
                <strong>Late Policy:</strong>
                <div className="text-muted">
                  After {settings.lateThreshold} minutes
                </div>
              </div>
              
              <div className="mb-3">
                <strong>Break Time:</strong>
                <div className="text-muted">
                  {settings.breakTime} minutes
                </div>
              </div>

              <hr />
              
              <div className="alert alert-light">
                <small>
                  <i className="bi bi-lightbulb me-1"></i>
                  <strong>Note:</strong> Changes will apply to new attendance records. 
                  Existing records will not be affected.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkHoursSettings;
