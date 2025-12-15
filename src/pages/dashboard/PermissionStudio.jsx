// components/dashboard/PermissionStudio.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { studentAPI, permissionAPI, analyticsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PermissionDocument from '../../components/PermissionDocument';

const PermissionStudio = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showStudentSelect, setShowStudentSelect] = useState(false);
  const [createdPermissions, setCreatedPermissions] = useState([]);
  const [printMode, setPrintMode] = useState(false);
  const { user } = useAuth();

  // New states for analytics
  const [analytics, setAnalytics] = useState({
    summary: null,
    monthlyReport: null,
    trends: null,
    punctuality: null
  });
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState('monthly');
  const [showAnalytics, setShowAnalytics] = useState(false);

  // New states for active permissions
  const [activePermissions, setActivePermissions] = useState([]);

  const printRef = useRef();

  // Permission form state
  const [permissionForms, setPermissionForms] = useState({});

  useEffect(() => {
    fetchStudents();
    fetchPermissions();
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (analyticsTimeRange) {
      fetchTrends();
    }
  }, [analyticsTimeRange]);

  const fetchStudents = async () => {
    try {
      const data = await studentAPI.getStudents();
      setStudents(data || []);
      console.log('Students', data)
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  // In PermissionStudio.jsx, replace the fetchPermissions function:

  const fetchPermissions = async () => {
    try {
      console.log('🔍 Fetching permissions...');
      const response = await permissionAPI.getAll();

      // Log the raw response to debug
      console.log('📦 Raw API response:', response);

      // Check different possible response structures
      const permissionsData = response.data?.permissions ||
        response.data ||
        response.permissions ||
        [];

      console.log('✅ Permissions data fetched:', {
        count: permissionsData.length,
        firstItem: permissionsData[0],
        structure: permissionsData.length > 0 ? Object.keys(permissionsData[0]) : 'empty'
      });

      setPermissions(permissionsData);

      // Update active permissions
      const approvedPermissions = permissionsData.filter(p =>
        p && (p.status === 'approved' || p.status === 'pending')
      );
      setActivePermissions(approvedPermissions);

    } catch (error) {
      console.error('❌ Error fetching permissions:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      // Set empty array to prevent crashes
      setPermissions([]);
      setActivePermissions([]);

      // Show user-friendly error
      alert('Failed to load permissions. Check console for details.');
    }
  };

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const now = new Date();

      // Fetch all data in parallel
      const [summaryRes, monthlyRes, punctualityRes] = await Promise.all([
        analyticsAPI.getDashboardSummary(),
        analyticsAPI.getMonthlyReport(now.getFullYear(), now.getMonth() + 1),
        analyticsAPI.getReturnPunctuality()
      ]);

      setAnalytics({
        summary: summaryRes.summary || {},
        monthlyReport: monthlyRes.report || {},
        punctuality: punctualityRes.stats || {}
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set empty data to prevent crashes
      setAnalytics({
        summary: {},
        monthlyReport: {},
        punctuality: {}
      });
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const fetchTrends = async () => {
    try {
      const trendsRes = await analyticsAPI.getTrends(analyticsTimeRange);
      setAnalytics(prev => ({
        ...prev,
        trends: trendsRes.data?.trends || {}
      }));
    } catch (error) {
      console.error('Error fetching trends:', error);
    }
  };

  const handleStudentSelect = (student) => {
    if (!selectedStudents.find(s => s._id === student._id)) {
      setSelectedStudents(prev => [...prev, student]);
      // Initialize form for this student
      setPermissionForms(prev => ({
        ...prev,
        [student._id]: {
          reason: '',
          destination: '',
          guardian: { name: '', relationship: '', phone: '' },
          returnDate: '',
          departure: new Date().toISOString().split('T')[0]
        }
      }));
    }
    setShowStudentSelect(false);
    setSearchTerm('');
  };

  const removeStudent = (studentId) => {
    setSelectedStudents(prev => prev.filter(s => s._id !== studentId));
    setPermissionForms(prev => {
      const newForms = { ...prev };
      delete newForms[studentId];
      return newForms;
    });
  };

  const handleFormChange = (studentId, field, value) => {
    setPermissionForms(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const handleGuardianChange = (studentId, field, value) => {
    setPermissionForms(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        guardian: {
          ...prev[studentId].guardian,
          [field]: value
        }
      }
    }));
  };

  // In your PermissionStudio component
  const createPermissions = async () => {
    setLoading(true);
    try {
      // Prepare data - this will be an array for bulk
      const permissionsData = selectedStudents.map(student => {
        const form = permissionForms[student._id];
        return {
          student: student._id,
          reason: form.reason,
          destination: form.destination,
          guardian: {
            name: form.guardian.name,
            relationship: form.guardian.relationship,
            phone: form.guardian.phone || ''
          },
          returnDate: form.returnDate,
          departure: form.departure || new Date().toISOString().split('T')[0],
          createdBy: user?._id || user?.id || 'system'
        };
      });

      console.log('Creating permissions:', {
        count: permissionsData.length,
        data: permissionsData
      });

      // Use the unified create endpoint
      const result = await permissionAPI.create(permissionsData);

      console.log('Creation result:', result);

      if (result.success) {
        // Handle response based on bulk/single
        const newPermissions = Array.isArray(result.permissions)
          ? result.permissions
          : [result.permissions];

        // Set for printing
        setCreatedPermissions(newPermissions);
        setPrintMode(true);

        // Show success message
        if (result.isBulk) {
          alert(`✅ ${result.count} permissions created successfully! Ready to print.`);
        } else {
          alert('✅ Permission created successfully! Ready to print.');
        }

        // Refresh data
        fetchPermissions();
        fetchAnalytics();

      } else {
        throw new Error(result.error || 'Failed to create permissions');
      }

    } catch (error) {
      console.error('Error creating permissions:', error);

      // Show detailed error if available
      if (error.response?.data?.details) {
        alert(`❌ Creation failed:\n\n${error.response.data.details.join('\n')}`);
      } else {
        alert(`❌ Failed to create permissions: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Mark as returned function
  const handleMarkReturned = async (permissionId) => {
    try {
      const response = await permissionAPI.updateStatus(permissionId, {
        status: 'returned'
      });

      // Update local state immediately
      setPermissions(prev => prev.map(p =>
        p._id === permissionId
          ? { ...p, status: 'returned', returnedAt: new Date() }
          : p
      ));

      // Update active permissions
      setActivePermissions(prev => prev.filter(p => p._id !== permissionId));

      // Refresh analytics
      fetchAnalytics();

      alert('✅ Permission marked as returned successfully!');
      return response;
    } catch (error) {
      console.error('Error marking as returned:', error);
      alert(`Failed to mark as returned: ${error.response?.data?.error || error.message}`);
      throw error;
    }
  };

  // PDF Printing functionality
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Student Permissions - ${new Date().toLocaleDateString()}`,
    onAfterPrint: () => {
      // Reset after printing
      setSelectedStudents([]);
      setPermissionForms({});
      setCreatedPermissions([]);
      setPrintMode(false);
    }
  });

  const cancelPrint = () => {
    setPrintMode(false);
    setCreatedPermissions([]);
  };

  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase().trim();
    if (!searchLower) return true;

    return (
      (student.name?.toLowerCase() || '').includes(searchLower) ||
      (student.student_id?.toLowerCase() || '').includes(searchLower) ||
      (student.class?.toLowerCase() || '').includes(searchLower)
    );
  });

  // Print Preview Modal
  if (printMode && createdPermissions.length > 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col">
        {/* Print Header */}
        <div className="bg-gray-900 border-b border-emerald-500/20 p-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">
            Print Permissions ({createdPermissions.length} documents)
          </h2>
          <div className="flex space-x-3">
            <button
              onClick={cancelPrint}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-lg transition-all duration-300 flex items-center space-x-2"
            >
              <i className="pi pi-print"></i>
              <span>Print All</span>
            </button>
          </div>
        </div>

        {/* Print Preview */}
        <div className="flex-1 overflow-auto p-4">
          <div ref={printRef} className="space-y-8">
            {createdPermissions.map((permission, index) => (
              <div key={permission._id || `print-${index}`} className="page-break">
                <PermissionDocument permission={permission} />
                {index < createdPermissions.length - 1 && (
                  <div className="page-break" style={{ pageBreakAfter: 'always' }}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-4">
          Permission Studio
        </h1>
        <p className="text-gray-400 text-lg">
          Manage student permissions with professional documentation
        </p>
      </div>

      {/* Analytics Dashboard Toggle */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setShowAnalytics(!showAnalytics)}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-lg transition-colors flex items-center space-x-2"
        >
          <i className={`pi ${showAnalytics ? 'pi-chart-line' : 'pi-chart-bar'}`}></i>
          <span>{showAnalytics ? 'Hide Analytics' : 'Show Analytics'}</span>
        </button>
      </div>

      {/* Analytics Dashboard Section */}
      {showAnalytics && (
        <AnalyticsDashboard
          analytics={analytics}
          loadingAnalytics={loadingAnalytics}
          timeRange={analyticsTimeRange}
          onTimeRangeChange={setAnalyticsTimeRange}
        />
      )}

      {/* Student Selection */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-emerald-500/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            Create Student Permissions
          </h2>
          <div className="relative">
            <button
              onClick={() => setShowStudentSelect(!showStudentSelect)}
              className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-2"
            >
              <i className="pi pi-plus"></i>
              <span>Add Students Permission</span>
            </button>

            {/* Student Search Dropdown */}

            {showStudentSelect && (
              <div className="absolute top-full right-0 mt-2 w-96 bg-gray-800 border border-emerald-500/30 rounded-xl shadow-2xl z-10">
                <div className="p-4 border-b border-gray-700">
                  <div className="relative">
                    <i className="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      placeholder="Search students... (type to filter)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                      autoFocus
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    {!searchTerm.trim() ? 'Showing recent students' : `Searching for: "${searchTerm}"`}
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredStudents.length > 0 ? (
                    <>
                      {/* Show limited results when no search */}
                      {!searchTerm.trim() && filteredStudents.length > 10 && (
                        <div className="px-4 py-2 bg-emerald-900/20 border-b border-emerald-500/20">
                          <div className="text-xs text-emerald-300 flex items-center">
                            <i className="pi pi-info-circle mr-1"></i>
                            Showing 10 of {filteredStudents.length} students. Type to search...
                          </div>
                        </div>
                      )}

                      {/* Display students (limited if no search) */}
                      {(searchTerm.trim() ? filteredStudents : filteredStudents.slice(0, 10)).map(student => (
                        <button
                          key={student._id}
                          onClick={() => handleStudentSelect(student)}
                          className="w-full text-left p-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
                        >
                          <div className="text-white font-medium">{student.name}</div>
                          <div className="text-gray-400 text-sm">
                            {student.student_id} • {student.class}
                          </div>
                        </button>
                      ))}

                      {/* Show "view all" option when no search */}
                      {!searchTerm.trim() && filteredStudents.length > 10 && (
                        <button
                          onClick={() => setSearchTerm(' ')} // Set space to trigger "show all"
                          className="w-full text-center p-3 text-cyan-400 hover:text-cyan-300 hover:bg-gray-700/50 transition-colors border-t border-gray-700"
                        >
                          <div className="flex items-center justify-center">
                            <i className="pi pi-list mr-2"></i>
                            View All Students ({filteredStudents.length})
                          </div>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <i className="pi pi-user-slash text-3xl text-gray-600 mb-3"></i>
                      <p className="text-gray-400 font-medium">No students found</p>
                      <p className="text-gray-500 text-sm mt-1">
                        {searchTerm.trim() ? `No match for "${searchTerm}"` : 'No students available'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected Students */}
        {selectedStudents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {selectedStudents.map(student => (
              <div key={student._id} className="bg-gray-800/50 rounded-xl p-4 border border-emerald-500/20">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-white font-semibold">{student.name}</h3>
                    <p className="text-gray-400 text-sm">{student.student_id} • {student.class}</p>
                  </div>
                  <button
                    onClick={() => removeStudent(student._id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <i className="pi pi-times"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Permission Forms */}
      {selectedStudents.length > 0 && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-cyan-500/20 p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Permission Details</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {selectedStudents.map(student => (
                <PermissionForm
                  key={student._id}
                  student={student}
                  formData={permissionForms[student._id] || {}}
                  onChange={handleFormChange}
                  onGuardianChange={handleGuardianChange}
                  hasActivePermission={activePermissions.some(p =>
                    p.student?._id === student._id || p.student === student._id
                  )}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-700">
              <button
                onClick={() => {
                  setSelectedStudents([]);
                  setPermissionForms({});
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={createPermissions}
                disabled={loading || selectedStudents.length === 0}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <i className="pi pi-spin pi-spinner"></i>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <i className="pi pi-save"></i>
                    <span>Create Permissions ({selectedStudents.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Stats */}
      <StudentStats />

      {/* Permission History with Return Functionality */}
      <PermissionHistory
        permissions={permissions}
        onMarkReturned={handleMarkReturned}
        fetchPermissions={fetchPermissions}
      />

      {/* SMS Dashboard */}
      <SMSDashboard permissions={permissions} />
    </div>
  );
};


// Important Components 
//******************************************************************** */

// Analytics Dashboard Component
const AnalyticsDashboard = ({ analytics, loadingAnalytics, timeRange, onTimeRangeChange }) => {
  const [weeklyStats, setWeeklyStats] = useState({
    active: 0,
    returned: 0
  });
  const [loadingWeekly, setLoadingWeekly] = useState(false);

  useEffect(() => {
    fetchWeeklyStats();
  }, []);

  const fetchWeeklyStats = async () => {
    setLoadingWeekly(true);
    try {
      const [activeRes, returnedRes] = await Promise.all([
        analyticsAPI.getWeeklyActive(),
        analyticsAPI.getWeeklyReturned()
      ]);

      setWeeklyStats({
        active: activeRes.count || 0,
        returned: returnedRes.count || 0
      });
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
    } finally {
      setLoadingWeekly(false);
    }
  };

  if (loadingAnalytics) {
    return (
      <div className="bg-gray-900 rounded-2xl p-6">
        <div className="text-center py-8">
          <i className="pi pi-spin pi-spinner text-2xl text-cyan-400"></i>
          <p className="text-gray-400 mt-2">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Weekly Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Weekly Active */}
        <div className="bg-gray-900 border border-emerald-200/30 to-gray-50 rounded-xl p-6 shadow-xl">
          {loadingWeekly ? (
            <div className="flex items-center justify-center h-full">
              <i className="pi pi-spin pi-spinner text-2xl text-white"></i>
            </div>
          ) : (
            <>
              <div className="text-3xl font-bold text-white">{weeklyStats.active}</div>
              <div className="text-emerald-200">Active (This Week)</div>
            </>
          )}
        </div>

        {/* Weekly Returned */}
        <div className="bg-gray-900 border border-emerald-200/30 to-gray-50 rounded-xl p-6 shadow-xl">
          {loadingWeekly ? (
            <div className="flex items-center justify-center h-full">
              <i className="pi pi-spin pi-spinner text-2xl text-white"></i>
            </div>
          ) : (
            <>
              <div className="text-3xl font-bold text-white">{weeklyStats.returned}</div>
              <div className="text-green-200">Returned (This Week)</div>
            </>
          )}
        </div>
      </div>

      {/* Monthly Report & Return Punctuality */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Report */}
        <div className="bg-gray-900 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <i className="pi pi-chart-bar mr-2 text-cyan-400"></i>
            This Month's Report
          </h3>
          {analytics.monthlyReport ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                <span className="text-gray-300">Total Permissions</span>
                <span className="text-2xl font-bold text-white">{analytics.monthlyReport.totalPermissions || 0}</span>
              </div>

              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="text-gray-300 font-medium mb-2">By Status</h4>
                <div className="space-y-2">
                  {Object.entries(analytics.monthlyReport.byStatus || {}).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className="text-gray-400 capitalize">{status}</span>
                      <span className={`font-semibold ${status === 'returned' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="text-gray-300 font-medium mb-2">Top Classes</h4>
                <div className="space-y-2">
                  {Object.entries(analytics.monthlyReport.byClass || {})
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([className, count]) => (
                      <div key={className} className="flex justify-between items-center">
                        <span className="text-gray-400">{className}</span>
                        <span className="text-white font-semibold">{count}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <i className="pi pi-chart-line text-3xl text-gray-600 mb-3"></i>
              <p className="text-gray-400">No monthly data available</p>
            </div>
          )}
        </div>

        {/* Return Punctuality */}
        <div className="bg-gray-900 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <i className="pi pi-clock mr-2 text-emerald-400"></i>
            Return Punctuality
          </h3>
          {analytics.punctuality ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-emerald-400">
                    {analytics.punctuality.onTimePercentage || 0}%
                  </div>
                  <div className="text-gray-400 text-sm mt-1">On Time Rate</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-white">
                    {analytics.punctuality.totalReturned || 0}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">Total Returned</div>
                </div>
              </div>

              <div className="bg-gray-800/30 rounded-lg p-4">
                <h4 className="text-gray-300 font-medium mb-3">Return Breakdown</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-gray-400">On Time</span>
                    </div>
                    <span className="text-green-400 font-semibold">{analytics.punctuality.onTime || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                      <span className="text-gray-400">Late (≤24h)</span>
                    </div>
                    <span className="text-yellow-400 font-semibold">{analytics.punctuality.late || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                      <span className="text-gray-400">Very Late</span>
                    </div>
                    <span className="text-red-400 font-semibold">{analytics.punctuality.early || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/30 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Average Delay</span>
                  <span className="text-white font-semibold">
                    {analytics.punctuality.averageDelayHours || 0} hours
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <i className="pi pi-clock text-3xl text-gray-600 mb-3"></i>
              <p className="text-gray-400">No punctuality data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Individual Permission Form Component (with active permission warning)
const PermissionForm = ({ student, formData, onChange, onGuardianChange, hasActivePermission }) => {
  return (
    <div className={`bg-gray-800/30 rounded-xl p-6 border ${hasActivePermission ? 'border-red-500/50' : 'border-cyan-500/10'} relative transition-all duration-300`}>

      {/* Active Permission Warning Badge */}
      {hasActivePermission && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg flex items-center space-x-1 z-10">
          <i className="pi pi-exclamation-triangle text-xs"></i>
          <span>Active Permission</span>
        </div>
      )}

      {/* Student Header with Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${hasActivePermission ? 'bg-red-500 animate-pulse' : 'bg-cyan-500'}`}></div>
          <h3 className="text-lg font-semibold text-white">{student.name}</h3>
        </div>
        <div className="text-xs text-gray-400">
          {student.student_id} • {student.class}
        </div>
      </div>

      {/* Warning Message if has active permission */}
      {hasActivePermission && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg">
          <div className="flex items-start space-x-2">
            <i className="pi pi-exclamation-circle text-red-400 mt-0.5"></i>
            <div>
              <p className="text-red-300 text-sm font-medium">Student has active permission</p>
              <p className="text-red-400/80 text-xs mt-1">
                This student cannot receive a new permission until the current one is marked as returned.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form Fields - Disabled if has active permission */}
      <div className={`space-y-4 ${hasActivePermission ? 'opacity-60 pointer-events-none' : ''}`}>
        <div>
          <label className="block text-sm font-medium text-cyan-300 mb-2">
            Reason *
            {hasActivePermission && <span className="text-red-400 ml-2">(Disabled)</span>}
          </label>
          <input
            type="text"
            value={formData.reason || ''}
            onChange={(e) => onChange(student._id, 'reason', e.target.value)}
            placeholder="e.g., Family visit, Medical appointment"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            required
            disabled={hasActivePermission}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-cyan-300 mb-2">
            Destination *
            {hasActivePermission && <span className="text-red-400 ml-2">(Disabled)</span>}
          </label>
          <input
            type="text"
            value={formData.destination || ''}
            onChange={(e) => onChange(student._id, 'destination', e.target.value)}
            placeholder="e.g., Home address, Hospital"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            required
            disabled={hasActivePermission}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-cyan-300 mb-2">
            Guardian Name *
            {hasActivePermission && <span className="text-red-400 ml-2">(Disabled)</span>}
          </label>
          <input
            type="text"
            value={formData.guardian?.name || ''}
            onChange={(e) => onGuardianChange(student._id, 'name', e.target.value)}
            placeholder="Full name of guardian"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            required
            disabled={hasActivePermission}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-2">
              Relationship *
              {hasActivePermission && <span className="text-red-400 ml-2">(Disabled)</span>}
            </label>
            <select
              value={formData.guardian?.relationship || ''}
              onChange={(e) => onGuardianChange(student._id, 'relationship', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              required
              disabled={hasActivePermission}
            >
              <option value="">Select</option>
              <option value="Parent">Parent</option>
              <option value="Guardian">Guardian</option>
              <option value="Relative">Relative</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-2">
              Return Date *
              {hasActivePermission && <span className="text-red-400 ml-2">(Disabled)</span>}
            </label>
            <input
              type="date"
              value={formData.returnDate || ''}
              onChange={(e) => onChange(student._id, 'returnDate', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              required
              disabled={hasActivePermission}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-cyan-300 mb-2">
            Guardian Phone
            {hasActivePermission && <span className="text-red-400 ml-2">(Disabled)</span>}
          </label>
          <input
            type="text"
            value={formData.guardian?.phone || ''}
            onChange={(e) => onGuardianChange(student._id, 'phone', e.target.value)}
            placeholder="Phone number"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={hasActivePermission}
          />
        </div>
      </div>
    </div>
  );
};

// Permission History Component with Return Functionality
const PermissionHistory = ({ permissions, onMarkReturned, fetchPermissions }) => {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [filter, setFilter] = useState('approved');
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingReturn, setLoadingReturn] = useState({});

  const uniqueStudents = [...new Set(permissions
    .filter(p => p.student)
    .map(p => ({ id: p.student._id, name: p.student.name }))
  )].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

  const filteredPermissions = permissions.filter(permission => {
    const today = new Date();
    const returnDate = new Date(permission.returnDate);
    const isOverdue = returnDate < today && permission.status === 'approved';

    let statusMatch = true;
    switch (filter) {
      case 'approved': statusMatch = permission.status === 'approved'; break;
      case 'returned': statusMatch = permission.status === 'returned'; break;
      case 'overdue': statusMatch = isOverdue; break;
      default: statusMatch = true;
    }

    const studentMatch = !selectedStudent || permission.student?._id === selectedStudent;

    const searchMatch = !searchTerm.trim() ||
      permission.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.permissionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      permission.reason?.toLowerCase().includes(searchTerm.toLowerCase());

    return statusMatch && studentMatch && searchMatch;
  });

  const handleMarkReturned = async (permissionId) => {
    setLoadingReturn(prev => ({ ...prev, [permissionId]: true }));

    try {
      await onMarkReturned(permissionId);
      if (fetchPermissions) {
        await fetchPermissions();
      }
    } catch (error) {
      console.error('Error marking as returned:', error);
      alert('Failed to mark as returned: ' + error.message);
    } finally {
      setLoadingReturn(prev => ({ ...prev, [permissionId]: false }));
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-emerald-500/20 p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Permission History</h2>
        <div className="text-sm text-gray-400">
          {filteredPermissions.length} of {permissions.length} permissions
        </div>
      </div>

      {/* Filters Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-cyan-300 mb-2">Filter by Status</label>
          <div className="flex space-x-2">
            {[
              { value: 'all', label: 'All', color: 'bg-gray-700' },
              { value: 'approved', label: 'Active', color: 'bg-yellow-600' },
              { value: 'returned', label: 'Returned', color: 'bg-green-600' },
              { value: 'overdue', label: 'Overdue', color: 'bg-red-600' }
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${filter === option.value ? option.color + ' text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-cyan-300 mb-2">Filter by Student</label>
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
          >
            <option value="">All Students</option>
            {uniqueStudents.map(student => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-cyan-300 mb-2">Search</label>
          <div className="relative">
            <i className="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            <input
              type="text"
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
            />
          </div>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{permissions.length}</div>
          <div className="text-gray-400 text-sm">Total</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400">
            {[...new Set(permissions.map(p => p.student?._id))].length}
          </div>
          <div className="text-gray-400 text-sm">Students</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {permissions.filter(p => p.status === 'approved').length}
          </div>
          <div className="text-gray-400 text-sm">Active</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">
            {permissions.filter(p => p.status === 'returned').length}
          </div>
          <div className="text-gray-400 text-sm">Returned</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-400">
            {permissions.filter(p => {
              const today = new Date();
              const returnDate = new Date(p.returnDate);
              return returnDate < today && p.status === 'approved';
            }).length}
          </div>
          <div className="text-gray-400 text-sm">Overdue</div>
        </div>
      </div>

      {/* Permission List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredPermissions.length > 0 ? (
          filteredPermissions.map(permission => {
            const today = new Date();
            const returnDate = new Date(permission.returnDate);
            const isOverdue = returnDate < today && permission.status === 'approved';

            return (
              <div
                key={permission._id}
                className={`bg-gray-800/30 rounded-xl p-4 border ${isOverdue ? 'border-red-500/50' : permission.status === 'returned' ? 'border-green-500/50' : 'border-gray-600/30'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-semibold">{permission.student?.name}</h4>
                      <div className="flex items-center space-x-2">
                        {isOverdue && (
                          <span className="px-2 py-1 bg-red-900/50 text-red-300 text-xs rounded-full">
                            <i className="pi pi-exclamation-triangle mr-1"></i>
                            OVERDUE
                          </span>
                        )}
                        <span className={`px-2 py-1 text-xs rounded-full ${permission.status === 'returned' ? 'bg-green-900/50 text-green-300' : 'bg-yellow-900/50 text-yellow-300'}`}>
                          {permission.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <div className="text-gray-400 text-sm">Class</div>
                        <div className="text-white">{permission.student?.class || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm">Permission #</div>
                        <div className="text-emerald-400 font-mono">{permission.permissionNumber}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm">Reason</div>
                        <div className="text-white">{permission.reason}</div>
                      </div>
                      <div>
                        <div className="text-gray-400 text-sm">Destination</div>
                        <div className="text-white">{permission.destination}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
                      <div className="text-gray-500 text-sm">
                        <div>
                          <i className="pi pi-calendar mr-1"></i>
                          Departure: {new Date(permission.departure).toLocaleDateString()}
                        </div>
                        <div>
                          <i className="pi pi-calendar-plus mr-1"></i>
                          Expected Return: {new Date(permission.returnDate).toLocaleDateString()}
                        </div>
                      </div>

                      {permission.status === 'approved' && (
                        <button
                          onClick={() => handleMarkReturned(permission._id)}
                          disabled={loadingReturn[permission._id]}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white text-sm rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          {loadingReturn[permission._id] ? (
                            <>
                              <i className="pi pi-spin pi-spinner"></i>
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <i className="pi pi-check"></i>
                              <span>Mark as Returned</span>
                            </>
                          )}
                        </button>
                      )}

                      {permission.status === 'returned' && permission.returnedAt && (
                        <div className="text-green-400 text-sm">
                          <i className="pi pi-check-circle mr-1"></i>
                          Returned: {new Date(permission.returnedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <i className="pi pi-inbox text-4xl text-gray-600 mb-4"></i>
            <p className="text-gray-400">No permissions found</p>
            {permissions.length > 0 && (
              <p className="text-gray-500 text-sm mt-1">Try changing your filters</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// SMS Notifications Dashboard Component
const SMSDashboard = ({ permissions }) => {
  const [smsStats, setSmsStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    demoMode: false
  });

  useEffect(() => {
    if (permissions.length > 0) {
      let sent = 0;
      let failed = 0;
      let demoMode = false;

      permissions.forEach(perm => {
        if (perm.smsNotifications?.permissionCreated?.sent) sent++;
        if (perm.smsNotifications?.permissionCreated?.error) failed++;
        if (perm.smsProvider === 'demo') demoMode = true;
      });

      setSmsStats({
        total: permissions.length,
        sent,
        failed,
        demoMode
      });
    }
  }, [permissions]);

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-purple-500/20 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">
          <i className="pi pi-send mr-2"></i>
          SMS Notifications
        </h2>
        {smsStats.demoMode && (
          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 text-sm rounded-full">
            <i className="pi pi-info-circle mr-1"></i>
            DEMO MODE
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-white">{smsStats.total}</div>
          <div className="text-gray-400 text-sm">Total Permissions</div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{smsStats.sent}</div>
          <div className="text-gray-400 text-sm">SMS Sent</div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{smsStats.failed}</div>
          <div className="text-gray-400 text-sm">SMS Failed</div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {smsStats.total > 0 ? Math.round((smsStats.sent / smsStats.total) * 100) : 0}%
          </div>
          <div className="text-gray-400 text-sm">Success Rate</div>
        </div>
      </div>

      {smsStats.demoMode && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <div className="flex items-start space-x-2">
            <i className="pi pi-info-circle text-yellow-400 mt-0.5"></i>
            <div>
              <p className="text-yellow-300 text-sm font-medium">SMS is in DEMO Mode</p>
              <p className="text-yellow-400/80 text-xs mt-1">
                SMS messages are logged to console instead of being sent.
                To send real SMS, add your TextBee API key to .env file.
              </p>
              <a
                href="https://textbee.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg transition-colors"
              >
                <i className="pi pi-external-link mr-1"></i>
                Get TextBee API Key
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Student Statistics Component
const StudentStats = () => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentStats, setStudentStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await studentAPI.getStudents();
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchStudentStats = async (studentId) => {
    if (!studentId) return;

    setLoading(true);
    try {
      const response = await analyticsAPI.getStudentPermissionStats(studentId);
      setStudentStats(response);
    } catch (error) {
      console.error('Error fetching student stats:', error);
      alert('Failed to load student statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setShowSelector(false);
    setSearchTerm('');
    fetchStudentStats(student._id);
  };

  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase().trim();
    if (!searchLower) return true;

    return (
      (student.name?.toLowerCase() || '').includes(searchLower) ||
      (student.student_id?.toLowerCase() || '').includes(searchLower) ||
      (student.class?.toLowerCase() || '').includes(searchLower)
    );
  });

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-purple-500/20 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">
          <i className="pi pi-user mr-2"></i>
          Student Permission Statistics
        </h2>

        {/* Student Selector */}
        <div className="relative">
          <button
            onClick={() => setShowSelector(!showSelector)}
            className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-2"
          >
            <i className="pi pi-search"></i>
            <span>
              {selectedStudent ? `Viewing: ${selectedStudent.name}` : 'Select Student'}
            </span>
            <i className={`pi pi-chevron-${showSelector ? 'up' : 'down'}`}></i>
          </button>


          {showSelector && (
            <div className="absolute top-full right-0 mt-2 w-96 bg-gray-800 border border-purple-500/30 rounded-xl shadow-2xl z-50">
              <div className="p-4 border-b border-gray-700">
                <div className="relative">
                  <i className="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Search students... (type to filter)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white"
                    autoFocus
                  />
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  {!searchTerm.trim() ? 'Showing recent students' : `Searching for: "${searchTerm}"`}
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {filteredStudents.length > 0 ? (
                  <>
                    {/* Show limited results when no search */}
                    {!searchTerm.trim() && filteredStudents.length > 8 && (
                      <div className="px-4 py-2 bg-purple-900/20 border-b border-purple-500/20">
                        <div className="text-xs text-purple-300 flex items-center">
                          <i className="pi pi-info-circle mr-1"></i>
                          Showing 8 of {filteredStudents.length} students. Type to search...
                        </div>
                      </div>
                    )}

                    {/* Display students (limited if no search) */}
                    {(searchTerm.trim() ? filteredStudents : filteredStudents.slice(0, 8)).map(student => (
                      <button
                        key={student._id}
                        onClick={() => handleStudentSelect(student)}
                        className="w-full text-left p-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
                      >
                        <div className="text-white font-medium">{student.name}</div>
                        <div className="text-gray-400 text-sm">
                          {student.student_id} • {student.class}
                        </div>
                      </button>
                    ))}

                    {/* Show "view all" option when no search */}
                    {!searchTerm.trim() && filteredStudents.length > 8 && (
                      <button
                        onClick={() => setSearchTerm(' ')} // Set space to show all
                        className="w-full text-center p-3 text-purple-400 hover:text-purple-300 hover:bg-gray-700/50 transition-colors border-t border-gray-700"
                      >
                        <div className="flex items-center justify-center">
                          <i className="pi pi-list mr-2"></i>
                          View All Students ({filteredStudents.length})
                        </div>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <i className="pi pi-user-slash text-3xl text-gray-600 mb-3"></i>
                    <p className="text-gray-400 font-medium">No matching students</p>
                    <p className="text-gray-500 text-sm mt-1">
                      {searchTerm.trim() ? `No results for "${searchTerm}"` : 'No students in database'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Display */}
      {loading ? (
        <div className="text-center py-12">
          <i className="pi pi-spin pi-spinner text-4xl text-purple-400 mb-4"></i>
          <p className="text-gray-400">Loading student statistics...</p>
        </div>
      ) : studentStats ? (
        <div className="space-y-6">
          {/* Student Info Card */}
          <div className="bg-gray-800/50 rounded-xl p-6 border border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{studentStats.student.name}</h3>
                <div className="text-gray-400">
                  ID: {studentStats.student.student_id} • Class: {studentStats.student.class}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setStudentStats(null);
                }}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>

            {studentStats.student.guardian?.name && (
              <div className="text-gray-300">
                Guardian: {studentStats.student.guardian.name}
                {studentStats.student.guardian.relationship && ` (${studentStats.student.guardian.relationship})`}
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-white">{studentStats.stats.total}</div>
              <div className="text-blue-200 text-sm mt-1">Total Permissions</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-900 to-yellow-800 rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-white">{studentStats.stats.approved}</div>
              <div className="text-yellow-200 text-sm mt-1">Active</div>
            </div>
            <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-white">{studentStats.stats.returned}</div>
              <div className="text-green-200 text-sm mt-1">Returned</div>
            </div>
            <div className="bg-gradient-to-br from-red-900 to-red-800 rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-white">{studentStats.stats.overdue}</div>
              <div className="text-red-200 text-sm mt-1">Overdue</div>
            </div>
            <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-white">{studentStats.avgDuration}</div>
              <div className="text-purple-200 text-sm mt-1">Avg Days (Returned)</div>
            </div>
          </div>

          {/* Recent Permissions */}
          <div className="bg-gray-800/30 rounded-xl p-6">
            <h4 className="text-lg font-bold text-white mb-4 flex items-center">
              <i className="pi pi-history mr-2 text-cyan-400"></i>
              Recent Permissions (with Guardian)
            </h4>
            <div className="space-y-3">
              {studentStats.recentPermissions?.length > 0 ? (
                studentStats.recentPermissions.map(permission => (
                  <div key={permission._id} className="bg-gray-800/50 rounded-lg p-3 hover:bg-gray-800/70 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-emerald-400 font-mono text-sm">
                          #{permission.permissionNumber}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(permission.createdAt).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${permission.status === 'returned' ? 'bg-green-900/50 text-green-300' :
                        permission.status === 'approved' ? 'bg-yellow-900/50 text-yellow-300' :
                          'bg-gray-700 text-gray-300'
                        }`}>
                        {permission.status}
                      </span>
                    </div>

                    {/* Reason and Destination */}
                    <div className="mb-2">
                      <div className="text-gray-300 text-sm mb-1">
                        <i className="pi pi-info-circle text-cyan-400 mr-1"></i>
                        {permission.reason}
                      </div>
                      <div className="text-gray-400 text-xs">
                        <i className="pi pi-map-marker text-emerald-400 mr-1"></i>
                        {permission.destination}
                      </div>
                    </div>

                    {/* Guardian Information */}
                    {permission.guardian && (
                      <div className="bg-gray-900/50 rounded p-2 mb-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-gray-300 text-xs font-medium flex items-center">
                              <i className="pi pi-user text-purple-400 mr-1"></i>
                              Guardian
                            </div>
                            <div className="text-white text-sm">
                              {permission.guardian.name}
                              {permission.guardian.relationship && (
                                <span className="text-gray-400 text-xs ml-2">
                                  ({permission.guardian.relationship})
                                </span>
                              )}
                            </div>
                          </div>
                          {permission.guardian.phone && (
                            <div className="text-right">
                              <div className="text-gray-300 text-xs font-medium flex items-center justify-end">
                                <i className="pi pi-phone text-green-400 mr-1"></i>
                                Phone
                              </div>
                              <div className="text-cyan-300 text-sm">
                                {permission.guardian.phone}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-gray-500">
                        <i className="pi pi-calendar-minus mr-1"></i>
                        Departure: {new Date(permission.departure).toLocaleDateString()}
                      </div>
                      <div className={`text-right ${new Date(permission.returnDate) < new Date() && permission.status !== 'returned'
                        ? 'text-red-400'
                        : 'text-gray-500'
                        }`}>
                        <i className="pi pi-calendar-plus mr-1"></i>
                        Return: {new Date(permission.returnDate).toLocaleDateString()}
                        {new Date(permission.returnDate) < new Date() && permission.status !== 'returned' && (
                          <span className="ml-1 text-red-300">(Overdue)</span>
                        )}
                      </div>
                    </div>

                    {/* Return Info if Returned */}
                    {permission.status === 'returned' && permission.returnedAt && (
                      <div className="mt-2 pt-2 border-t border-gray-700 text-xs">
                        <div className="text-green-400 flex items-center">
                          <i className="pi pi-check-circle mr-1"></i>
                          Returned: {new Date(permission.returnedAt).toLocaleDateString()}
                          {permission.returnedAt && permission.returnDate && (
                            <span className="text-gray-500 ml-2">
                              ({Math.floor((new Date(permission.returnedAt) - new Date(permission.returnDate)) / (1000 * 60 * 60 * 24))} days
                              {new Date(permission.returnedAt) > new Date(permission.returnDate) ? ' late' : ' early'})
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <i className="pi pi-inbox text-2xl mb-2"></i>
                  <p>No recent permissions</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <i className="pi pi-user text-4xl text-gray-600 mb-4"></i>
          <p className="text-gray-400 mb-2">Select a student to view permission statistics</p>
          <p className="text-gray-500 text-sm">Click the "Select Student" button above</p>
        </div>
      )}
    </div>
  );
};


export default PermissionStudio;