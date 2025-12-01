// components/dashboard/PermissionStudio.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { studentAPI, permissionAPI } from '../../services/api';
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

  const printRef = useRef();

  // Permission form state
  const [permissionForms, setPermissionForms] = useState({});

  useEffect(() => {
    fetchStudents();
    fetchPermissions();
  }, []);


  const fetchStudents = async () => {
    try {
      const data = await studentAPI.getStudents();
      setStudents(data || []);
      console.log('students:', data)
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchPermissions = async () => {
    try {
      const data = await permissionAPI.getAll();
      setPermissions(data.permissions || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
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

  const createPermissions = async () => {
    setLoading(true);
    try {
      const permissionsData = selectedStudents.map(student => ({
        student: student._id,
        ...permissionForms[student._id]
      }));

      const result = await permissionAPI.createBulk(permissionsData);

      // Store created permissions for printing
      setCreatedPermissions(result.permissions || []);
      setPrintMode(true);

      alert('Permissions created successfully! Ready to print.');
      fetchPermissions();
      
    } catch (error) {
      console.error('Error creating permissions:', error);
      alert('Failed to create permissions: ' + error.message);
    } finally {
      setLoading(false);
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


  const filteredStudents = students.filter(student => {
    const searchLower = searchTerm.toLowerCase().trim();

    if (!searchLower) return true;

    // Debug log
    console.log('Searching student:', {
      name: student.name,
      student_id: student.student_id,
      class: student.class,
      level: student.level,
      residence: student.residence,
      searchTerm: searchLower
    });

    // Create a searchable string from all student properties
    const searchableString = [
      student.name,
      student.student_id,
      student.class,
      student.level,
      student.residence
    ]
      .filter(Boolean) // Remove null/undefined
      .join(' ')
      .toLowerCase();

    console.log('Searchable string:', searchableString);
    console.log('Contains?', searchableString.includes(searchLower));

    return searchableString.includes(searchLower);
  });

  useEffect(() => {
    console.log('=== SEARCH DEBUG ===');
    console.log('Search term:', searchTerm);
    console.log('Total students:', students.length);
    console.log('Filtered students count:', filteredStudents.length);
    console.log('Show student select:', showStudentSelect);
  }, [searchTerm, students, filteredStudents, showStudentSelect]);

  const cancelPrint = () => {
    setPrintMode(false);
    setCreatedPermissions([]);
  };

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
              <div key={permission._id} className="page-break">
                <PermissionDocument permission={permission} />
                {/* Page break for printing */}
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

      {/* Student Selection */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-emerald-500/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">
            Select Students
          </h2>
          <div className="relative">
            <button
              onClick={() => setShowStudentSelect(!showStudentSelect)}
              className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white px-6 py-3 rounded-xl transition-all duration-300 flex items-center space-x-2"
            >
              <i className="pi pi-plus"></i>
              <span>Add Students</span>
            </button>

            {/* Student Search Dropdown */}
            {showStudentSelect && (
              <div className="absolute top-full right-0 mt-2 w-96 bg-gray-800 border border-emerald-500/30 rounded-xl shadow-2xl z-10">
                <div className="p-4 border-b border-gray-700">
                  <div className="relative">
                    <i className="pi pi-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map(student => (
                      <button
                        key={student._id}
                        onClick={() => handleStudentSelect(student)}
                        className="w-full text-left p-3 hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
                      >
                        <div className="text-white font-medium">
                          {student.name || 'No Name'}
                        </div>
                        <div className="text-gray-400 text-sm">
                          {student.student_id || 'No ID'} • {student.class || 'No Class'}
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-400">
                      No students found matching "{searchTerm}"
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

      {/* Permission History & Analytics */}
      <PermissionHistory permissions={permissions} />
    </div>
  );
};

// Individual Permission Form Component
const PermissionForm = ({ student, formData, onChange, onGuardianChange }) => {
  return (
    <div className="bg-gray-800/30 rounded-xl p-6 border border-cyan-500/10">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
        <i className="pi pi-user text-cyan-400"></i>
        <span>{student.name}</span>
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-cyan-300 mb-2">Reason *</label>
          <input
            type="text"
            value={formData.reason || ''}
            onChange={(e) => onChange(student._id, 'reason', e.target.value)}
            placeholder="e.g., Family visit, Medical appointment"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-cyan-300 mb-2">Destination *</label>
          <input
            type="text"
            value={formData.destination || ''}
            onChange={(e) => onChange(student._id, 'destination', e.target.value)}
            placeholder="e.g., Home address, Hospital"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-cyan-300 mb-2">Guardian Name *</label>
          <input
            type="text"
            value={formData.guardian?.name || ''}
            onChange={(e) => onGuardianChange(student._id, 'name', e.target.value)}
            placeholder="Full name of guardian"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-2">Relationship *</label>
            <select
              value={formData.guardian?.relationship || ''}
              onChange={(e) => onGuardianChange(student._id, 'relationship', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
              required
            >
              <option value="">Select</option>
              <option value="Parent">Parent</option>
              <option value="Guardian">Guardian</option>
              <option value="Relative">Relative</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-cyan-300 mb-2">Return Date *</label>
            <input
              type="date"
              value={formData.returnDate || ''}
              onChange={(e) => onChange(student._id, 'returnDate', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-cyan-300 mb-2">Guardian Phone</label>
          <input
            type="text"
            value={formData.guardian?.phone || ''}
            onChange={(e) => onGuardianChange(student._id, 'phone', e.target.value)}
            placeholder="Phone number"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
          />
        </div>
      </div>
    </div>
  );
};

// Permission History Component (keep the same as before)
const PermissionHistory = ({ permissions }) => {
  const [selectedStudent, setSelectedStudent] = useState('');

  const studentPermissions = selectedStudent
    ? permissions.filter(p => p.student?._id === selectedStudent)
    : permissions;

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-emerald-500/20 p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Permission History</h2>

      {/* Analytics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{permissions.length}</div>
          <div className="text-gray-400 text-sm">Total Permissions</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-cyan-400">
            {[...new Set(permissions.map(p => p.student?._id))].length}
          </div>
          <div className="text-gray-400 text-sm">Students</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">
            {[...new Set(permissions.map(p => p.reason))].length}
          </div>
          <div className="text-gray-400 text-sm">Reasons</div>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">
            {permissions.filter(p => new Date(p.returnDate) < new Date()).length}
          </div>
          <div className="text-gray-400 text-sm">Completed</div>
        </div>
      </div>

      {/* Permission List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {studentPermissions.map(permission => (
          <div key={permission._id} className="bg-gray-800/30 rounded-xl p-4 border border-gray-600/30">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-white font-semibold">{permission.student?.name}</h4>
                <p className="text-gray-400 text-sm">
                  {permission.student?.class} • {permission.reason}
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  To: {permission.destination} • Return: {new Date(permission.returnDate).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-emerald-400 text-sm font-medium">
                  {permission.permissionNumber}
                </div>
                <div className="text-gray-500 text-xs">
                  {new Date(permission.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PermissionStudio;