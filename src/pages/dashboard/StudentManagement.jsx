// components/dashboard/StudentManagement.jsx
import React, { useState, useEffect } from 'react';
import { studentAPI } from '../../services/api';

const StudentManagement = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    class: '',
    level: '',
    gender: '',
    academic_year: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    class: '',
    level: '',
    residence: '',
    gender: '',
    academic_year: '',
    parent_phone: '',
    photo: null
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [searchTerm, filters, students]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await studentAPI.getStudents();
      setStudents(data);
    } catch (error) {
      console.error('Error fetching students:', error);
      alert('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.class?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.level?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.residence?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply individual filters
    if (filters.class) {
      filtered = filtered.filter(student =>
        student.class?.toLowerCase() === filters.class.toLowerCase()
      );
    }
    if (filters.level) {
      filtered = filtered.filter(student =>
        student.level?.toLowerCase() === filters.level.toLowerCase()
      );
    }
    if (filters.gender) {
      filtered = filtered.filter(student =>
        student.gender?.toLowerCase() === filters.gender.toLowerCase()
      );
    }
    if (filters.academic_year) {
      filtered = filtered.filter(student =>
        student.academic_year?.toLowerCase().includes(filters.academic_year.toLowerCase())
      );
    }

    // Limit to 15 results
    setFilteredStudents(filtered.slice(0, 15));
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'photo') {
      setFormData(prev => ({ ...prev, photo: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });

      if (editingStudent) {
        await studentAPI.updateStudent(editingStudent._id, submitData);
        alert('Student updated successfully!');
      } else {
        await studentAPI.addStudent(submitData);
        alert('Student added successfully!');
      }

      resetForm();
      fetchStudents();
    } catch (error) {
      console.error('Error saving student:', error);
      alert('Failed to save student: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      student_id: student.student_id || '',
      name: student.name || '',
      class: student.class || '',
      level: student.level || '',
      residence: student.residence || '',
      gender: student.gender || '',
      academic_year: student.academic_year || '',
      parent_phone: student.parent_phone || '',
      photo: null
    });
    setShowAddModal(true);
  };

  const handleDelete = async (studentId) => {
    if (!confirm('Are you sure you want to delete this student?')) return;

    try {
      await studentAPI.deleteStudent(studentId);
      alert('Student deleted successfully!');
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Failed to delete student');
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      name: '',
      class: '',
      level: '',
      residence: '',
      gender: '',
      academic_year: '',
      parent_phone: '',
      photo: null
    });
    setEditingStudent(null);
    setShowAddModal(false);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setFilters({
      class: '',
      level: '',
      gender: '',
      academic_year: ''
    });
    setShowFilters(false);
  };

  // Get unique values for filter dropdowns
  const uniqueClasses = [...new Set(students.map(student => student.class).filter(Boolean))];
  const uniqueLevels = [...new Set(students.map(student => student.level).filter(Boolean))];
  const uniqueGenders = [...new Set(students.map(student => student.gender).filter(Boolean))];
  const uniqueYears = [...new Set(students.map(student => student.academic_year).filter(Boolean))];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex p-4 flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="animate-slide-down">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Student Management
          </h2>
          <p className="text-gray-400 mt-2">
            {students.length} students in database • Search or filter to view records
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="group relative bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white px-8 py-4 rounded-2xl font-medium transition-all duration-300 flex items-center space-x-3 shadow-lg hover:shadow-cyan-500/25 hover:scale-105 animate-pulse-gentle"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
          <i className="pi pi-user-plus text-lg relative z-10"></i>
          <span className="relative z-10">Add Student</span>
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-6 animate-slide-up">
        <div className="flex flex-col gap-4">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <i className="pi pi-search absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search students by name, ID, class, level, or residence..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-gray-800 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-gray-400 transition-all duration-300"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-6 py-4 bg-cyan-600 hover:bg-cyan-500 border border-cyan-400 rounded-xl text-white transition-all duration-300 hover:scale-105 flex items-center space-x-2"
              >
                <i className="pi pi-filter"></i>
                <span>Filters {showFilters ? '(Hide)' : '(Show)'}</span>
              </button>
              <button
                onClick={resetFilters}
                className="px-6 py-4 bg-gray-700 hover:bg-gray-600 border border-gray-500 rounded-xl text-gray-300 transition-all duration-300 hover:scale-105 flex items-center space-x-2"
              >
                <i className="pi pi-refresh"></i>
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-800/50 rounded-xl border border-gray-600 animate-slide-down">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-cyan-300">
                  Class
                </label>
                <select
                  name="class"
                  value={filters.class}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                >
                  <option value="">All Classes</option>
                  {uniqueClasses.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-cyan-300">
                  Level
                </label>
                <select
                  name="level"
                  value={filters.level}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                >
                  <option value="">All Levels</option>
                  {uniqueLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-cyan-300">
                  Gender
                </label>
                <select
                  name="gender"
                  value={filters.gender}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                >
                  <option value="">All Genders</option>
                  {uniqueGenders.map(gender => (
                    <option key={gender} value={gender}>{gender}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-cyan-300">
                  Academic Year
                </label>
                <select
                  name="academic_year"
                  value={filters.academic_year}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white"
                >
                  <option value="">All Years</option>
                  {uniqueYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Active Filters Indicator */}
          {(searchTerm || Object.values(filters).some(filter => filter)) && (
            <div className="flex items-center space-x-2 text-sm text-cyan-300">
              <i className="pi pi-info-circle"></i>
              <span>
                Showing {filteredStudents.length} of {students.length} students •
                {searchTerm && ` Search: "${searchTerm}"`}
                {filters.class && ` • Class: ${filters.class}`}
                {filters.level && ` • Level: ${filters.level}`}
                {filters.gender && ` • Gender: ${filters.gender}`}
                {filters.academic_year && ` • Year: ${filters.academic_year}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Students Table - Only show when there are filtered results */}
      {filteredStudents.length > 0 ? (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden animate-scale-in">
          {loading ? (
            <div className="flex justify-center items-center p-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-400"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800/50 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300 uppercase tracking-wider">
                      <i className="pi pi-id-card mr-2"></i>
                      ID
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300 uppercase tracking-wider">
                      <i className="pi pi-user mr-2"></i>
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300 uppercase tracking-wider">
                      <i className="pi pi-building mr-2"></i>
                      Class
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300 uppercase tracking-wider">
                      <i className="pi pi-chart-line mr-2"></i>
                      Level
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300 uppercase tracking-wider">
                      <i className="pi pi-users mr-2"></i>
                      Gender
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-cyan-300 uppercase tracking-wider">
                      <i className="pi pi-cog mr-2"></i>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredStudents.map((student, index) => (
                    <tr
                      key={student._id}
                      className="hover:bg-gray-700/30 transition-all duration-300 animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-white bg-gray-700 px-3 py-1 rounded-lg inline-block">
                          {student.student_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-semibold text-white">{student.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-cyan-300 font-medium">{student.class}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-emerald-300 font-medium">{student.level}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${student.gender === 'Male'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-400'
                          : 'bg-pink-500/20 text-pink-300 border border-pink-400'
                          }`}>
                          <i className={`pi ${student.gender === 'Male' ? 'pi-mars' : 'pi-venus'} mr-1`}></i>
                          {student.gender}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(student)}
                            className="text-cyan-400 hover:text-cyan-300 transition-all duration-300 hover:scale-110 flex items-center space-x-1 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-2 rounded-lg border border-cyan-500/30"
                          >
                            <i className="pi pi-pencil text-sm"></i>
                            <span className="text-sm">Edit</span>
                          </button>
                          <button
                            onClick={() => handleDelete(student._id)}
                            className="text-red-400 hover:text-red-300 transition-all duration-300 hover:scale-110 flex items-center space-x-1 bg-red-500/10 hover:bg-red-500/20 px-3 py-2 rounded-lg border border-red-500/30"
                          >
                            <i className="pi pi-trash text-sm"></i>
                            <span className="text-sm">Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* Empty State - Only show when no search/filter is active OR when no results */
        !loading && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-16 text-center animate-pulse">
            <div className="text-cyan-400 text-8xl mb-6">
              <i className="pi pi-search"></i>
            </div>
            <p className="text-gray-300 text-xl mb-2">
              {searchTerm || Object.values(filters).some(filter => filter)
                ? 'No students match your search criteria'
                : 'Search or filter to view students'
              }
            </p>
            <p className="text-gray-400 mb-6">
              {searchTerm || Object.values(filters).some(filter => filter)
                ? 'Try adjusting your search terms or filters'
                : 'Use the search bar or filters above to find student records'
              }
            </p>
            {(searchTerm || Object.values(filters).some(filter => filter)) && (
              <button
                onClick={resetFilters}
                className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white transition-all duration-300 hover:scale-105 flex items-center space-x-2 mx-auto"
              >
                <i className="pi pi-refresh"></i>
                <span>Clear Search & Filters</span>
              </button>
            )}
          </div>
        )
      )}
      {/* Add/Edit Student Modal - FIXED POSITIONING */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl border border-cyan-500/20 w-full max-w-4xl max-h-[90vh]  animate-scale-in"
            onClick={(e) => e.stopPropagation()} // Prevent click from closing modal
          >
            {/* Modal Header - Fixed */}
            <div className="sticky top-0 z-20 p-6 border-b border-gray-700 bg-gray-900/95 backdrop-blur-sm rounded-t-3xl">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  {editingStudent ? 'Edit Student' : 'Create New Student'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-white transition-colors duration-200 hover:scale-110 p-2 rounded-lg hover:bg-gray-700 flex items-center justify-center w-10 h-10"
                >
                  <i className="pi pi-times text-xl"></i>
                </button>
              </div>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="overflow-y-auto max-h-[calc(100vh-280px)]">
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-cyan-300">
                      <i className="pi pi-id-card mr-2"></i>
                      Student ID *
                    </label>
                    <input
                      type="text"
                      name="student_id"
                      value={formData.student_id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-gray-400 transition-all duration-300"
                      placeholder="STU001"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-cyan-300">
                      <i className="pi pi-user mr-2"></i>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-gray-400 transition-all duration-300"
                      placeholder="John Doe"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-cyan-300">
                      <i className="pi pi-building mr-2"></i>
                      Class *
                    </label>
                    <input
                      type="text"
                      name="class"
                      value={formData.class}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-gray-400 transition-all duration-300"
                      placeholder="P6"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-cyan-300">
                      <i className="pi pi-chart-line mr-2"></i>
                      Level
                    </label>
                    <input
                      type="text"
                      name="level"
                      value={formData.level}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-gray-400 transition-all duration-300"
                      placeholder="Primary"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-cyan-300">
                      <i className="pi pi-map-marker mr-2"></i>
                      Residence
                    </label>
                    <input
                      type="text"
                      name="residence"
                      value={formData.residence}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-gray-400 transition-all duration-300"
                      placeholder="Kigali"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-cyan-300">
                      <i className="pi pi-users mr-2"></i>
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white transition-all duration-300"
                    >
                      <option value="" className="bg-gray-800">Select Gender</option>
                      <option value="Male" className="bg-gray-800">Male</option>
                      <option value="Female" className="bg-gray-800">Female</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-cyan-300">
                      <i className="pi pi-calendar mr-2"></i>
                      Academic Year
                    </label>
                    <input
                      type="text"
                      name="academic_year"
                      value={formData.academic_year}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-gray-400 transition-all duration-300"
                      placeholder="2024"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-cyan-300">
                      <i className="pi pi-phone mr-2"></i>
                      Parent Phone
                    </label>
                    <input
                      type="text"
                      name="parent_phone"
                      value={formData.parent_phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-white placeholder-gray-400 transition-all duration-300"
                      placeholder="+250 78 123 4567"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 border border-gray-500 rounded-xl text-gray-300 hover:text-white transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                  >
                    <i className="pi pi-times"></i>
                    <span>Cancel</span>
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center space-x-2 shadow-lg"
                  >
                    {loading ? (
                      <>
                        <i className="pi pi-spin pi-spinner"></i>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <i className={`pi ${editingStudent ? 'pi-sync' : 'pi-check'}`}></i>
                        <span>{editingStudent ? 'Update Student' : 'Create Student'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;