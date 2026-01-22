import React, { useState, useEffect } from 'react';
import { staffApi } from '../api/client';
import type { Staff, CreateStaffInput, UpdateStaffInput } from '../types';
import { Modal } from '../components/Modal';
import { LoadingSpinner, EmptyState, ConfirmDialog } from '../components/Common';
import { useToast } from '../components/Toast';

export function StaffPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [deleteStaff, setDeleteStaff] = useState<Staff | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    fetchStaff();
  }, [showInactive]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await staffApi.getAll(showInactive);
      setStaff(data);
    } catch (error) {
      addToast('Failed to load staff', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: CreateStaffInput) => {
    try {
      await staffApi.create(data);
      addToast('Staff member created', 'success');
      setIsModalOpen(false);
      fetchStaff();
    } catch (error) {
      addToast('Failed to create staff member', 'error');
    }
  };

  const handleUpdate = async (id: string, data: UpdateStaffInput) => {
    try {
      await staffApi.update(id, data);
      addToast('Staff member updated', 'success');
      setIsModalOpen(false);
      setEditingStaff(null);
      fetchStaff();
    } catch (error) {
      addToast('Failed to update staff member', 'error');
    }
  };

  const handleToggleActive = async (member: Staff) => {
    try {
      await staffApi.update(member.id, { active: !member.active });
      addToast(`${member.name} is now ${member.active ? 'inactive' : 'active'}`, 'success');
      fetchStaff();
    } catch (error) {
      addToast('Failed to update status', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteStaff) return;
    try {
      await staffApi.delete(deleteStaff.id);
      addToast('Staff member deleted', 'success');
      setDeleteStaff(null);
      fetchStaff();
    } catch (error) {
      addToast('Failed to delete staff member', 'error');
    }
  };

  const activeStaff = staff.filter((s) => s.active);
  const inactiveStaff = staff.filter((s) => !s.active);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" className="text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Staff</h1>
          <p className="text-sm text-slate-500">Manage your team members</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Staff
        </button>
      </div>

      {/* Options */}
      <div className="card p-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-slate-600">Show inactive staff</span>
        </label>
      </div>

      {/* Staff List */}
      {staff.length === 0 && !showInactive ? (
        <EmptyState
          icon={<UsersIcon className="w-6 h-6 text-slate-400" />}
          title="No staff members"
          description="Add your team members to start scheduling"
          action={
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
              Add Staff
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Active Staff */}
          {activeStaff.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                Active Staff
                <span className="text-sm font-normal text-slate-500">({activeStaff.length})</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {activeStaff.map((member) => (
                  <StaffCard
                    key={member.id}
                    staff={member}
                    onEdit={() => {
                      setEditingStaff(member);
                      setIsModalOpen(true);
                    }}
                    onToggleActive={() => handleToggleActive(member)}
                    onDelete={() => setDeleteStaff(member)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Inactive Staff */}
          {showInactive && inactiveStaff.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Inactive Staff
                <span className="text-sm font-normal text-slate-500">({inactiveStaff.length})</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {inactiveStaff.map((member) => (
                  <StaffCard
                    key={member.id}
                    staff={member}
                    onEdit={() => {
                      setEditingStaff(member);
                      setIsModalOpen(true);
                    }}
                    onToggleActive={() => handleToggleActive(member)}
                    onDelete={() => setDeleteStaff(member)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Staff Modal */}
      <StaffModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStaff(null);
        }}
        staff={editingStaff}
        onSave={(data) => {
          if (editingStaff) {
            handleUpdate(editingStaff.id, data);
          } else {
            handleCreate(data as CreateStaffInput);
          }
        }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteStaff}
        onClose={() => setDeleteStaff(null)}
        onConfirm={handleDelete}
        title="Delete Staff Member"
        message={`Are you sure you want to delete "${deleteStaff?.name}"? This will also delete all their assignments.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

// Staff Card Component
interface StaffCardProps {
  staff: Staff;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

function StaffCard({ staff, onEdit, onToggleActive, onDelete }: StaffCardProps) {
  return (
    <div className={`card p-4 hover:shadow-md transition-shadow ${!staff.active ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
            {staff.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{staff.name}</h3>
            {staff.role && <p className="text-sm text-slate-500">{staff.role}</p>}
          </div>
        </div>
        <span
          className={`badge ${staff.active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}
        >
          {staff.active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        <button onClick={onToggleActive} className="btn btn-ghost btn-sm">
          {staff.active ? (
            <>
              <PauseIcon className="w-4 h-4 mr-1" />
              Deactivate
            </>
          ) : (
            <>
              <PlayIcon className="w-4 h-4 mr-1" />
              Activate
            </>
          )}
        </button>
        <button onClick={onEdit} className="btn btn-ghost btn-sm">
          <EditIcon className="w-4 h-4 mr-1" />
          Edit
        </button>
        <button onClick={onDelete} className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50">
          <TrashIcon className="w-4 h-4 mr-1" />
          Delete
        </button>
      </div>
    </div>
  );
}

// Staff Modal Component
interface StaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff | null;
  onSave: (data: CreateStaffInput | UpdateStaffInput) => void;
}

function StaffModal({ isOpen, onClose, staff, onSave }: StaffModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (staff) {
      setName(staff.name);
      setRole(staff.role || '');
      setActive(staff.active);
    } else {
      setName('');
      setRole('');
      setActive(true);
    }
  }, [staff, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      role: role || null,
      active,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={staff ? 'Edit Staff' : 'Add Staff'} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="e.g., Jason"
            required
          />
        </div>

        <div>
          <label className="label">Role</label>
          <input
            type="text"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="input"
            placeholder="e.g., Senior Staff"
          />
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-slate-600">Active (shows in assignment dropdown)</span>
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={!name} className="btn btn-primary">
            {staff ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Icons
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function PauseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
