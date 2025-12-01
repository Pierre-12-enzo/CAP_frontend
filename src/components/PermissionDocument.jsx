import React, { forwardRef } from 'react';

const PermissionDocument = forwardRef(({ permission }, ref) => {
  if (!permission) return null;

  return (
    <div ref={ref} className="bg-white text-gray-800 p-8 max-w-4xl mx-auto">
      {/* Decorative Border */}
      <div className="border-4 border-emerald-600 rounded-2xl p-8 relative">
        
        {/* School Header */}
        <div className="text-center mb-8 border-b-2 border-emerald-200 pb-6">
          <h1 className="text-4xl font-bold text-emerald-800 mb-2">
            OFFICIAL PERMISSION SLIP
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-emerald-400 to-cyan-400 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">School Authorization Document</p>
        </div>

        {/* Student Information */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-emerald-700 uppercase tracking-wide">
                Student Information
              </label>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between border-b border-gray-200 pb-1">
                  <span className="font-medium">Full Name:</span>
                  <span>{permission.student?.name}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-1">
                  <span className="font-medium">Student ID:</span>
                  <span>{permission.student?.student_id}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-1">
                  <span className="font-medium">Class:</span>
                  <span>{permission.student?.class}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-1">
                  <span className="font-medium">Level:</span>
                  <span>{permission.student?.level}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-cyan-700 uppercase tracking-wide">
                Permission Details
              </label>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between border-b border-gray-200 pb-1">
                  <span className="font-medium">Permission #:</span>
                  <span className="font-mono">{permission.permissionNumber}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-1">
                  <span className="font-medium">Issue Date:</span>
                  <span>{new Date(permission.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 pb-1">
                  <span className="font-medium">Return Date:</span>
                  <span className="font-semibold text-emerald-600">
                    {new Date(permission.returnDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Permission Purpose */}
        <div className="mb-8">
          <label className="block text-sm font-semibold text-purple-700 uppercase tracking-wide mb-3">
            Purpose of Permission
          </label>
          <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-purple-500">
            <p className="text-lg font-medium text-gray-800">{permission.reason}</p>
          </div>
        </div>

        {/* Destination & Guardian */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block text-sm font-semibold text-amber-700 uppercase tracking-wide mb-3">
              Destination
            </label>
            <div className="bg-amber-50 rounded-lg p-4 border-l-4 border-amber-500">
              <p className="font-medium text-gray-800">{permission.destination}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-blue-700 uppercase tracking-wide mb-3">
              Guardian Information
            </label>
            <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500 space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Name:</span>
                <span>{permission.guardian?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Relationship:</span>
                <span>{permission.guardian?.relationship}</span>
              </div>
              {permission.guardian?.phone && (
                <div className="flex justify-between">
                  <span className="font-medium">Phone:</span>
                  <span>{permission.guardian.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Authorization Section */}
        <div className="mt-12 pt-6 border-t-2 border-gray-300">
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="mb-4">
                <div className="h-16 border-b border-gray-300"></div>
                <p className="text-sm text-gray-600 mt-2">Guardian's Signature</p>
              </div>
            </div>
            <div className="text-center">
              <div className="mb-4">
                <div className="h-16 border-b border-gray-300"></div>
                <p className="text-sm text-gray-600 mt-2">School Authority Signature</p>
              </div>
              <p className="text-xs text-gray-500">
                Approved by: {permission.approvedBy?.firstName} {permission.approvedBy?.lastName}
              </p>
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-500">
            This is an official school document. Unauthorized duplication is prohibited.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Document ID: {permission._id} • Generated on: {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
});

PermissionDocument.displayName = 'PermissionDocument';

export default PermissionDocument;