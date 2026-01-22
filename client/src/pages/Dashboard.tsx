import React, { useState, useEffect, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  isToday,
  isWeekend,
  parseISO,
  startOfWeek,
  addDays,
  isSameMonth,
} from 'date-fns';
import { staffApi, venuesApi, assignmentsApi, isCollisionError } from '../api/client';
import type { Staff, Venue, EventAssignment, CreateAssignmentInput } from '../types';
import { Modal } from '../components/Modal';
import { VenueSelect } from '../components/VenueSelect';
import { LoadingSpinner, EmptyState, ConfirmDialog, StatusBadge } from '../components/Common';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

type ViewMode = 'table' | 'calendar';

export function Dashboard() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [assignments, setAssignments] = useState<EventAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<{ date: string; staffId: string } | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isCopyWeekModalOpen, setIsCopyWeekModalOpen] = useState(false);
  const [collisionData, setCollisionData] = useState<{ existing: EventAssignment; new: CreateAssignmentInput } | null>(null);
  const { addToast } = useToast();
  const { isAdmin } = useAuth();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  // Fetch data
  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffData, venuesData, assignmentsData] = await Promise.all([
        staffApi.getAll(),
        venuesApi.getAll(),
        assignmentsApi.getByDateRange(
          format(monthStart, 'yyyy-MM-dd'),
          format(monthEnd, 'yyyy-MM-dd')
        ),
      ]);
      setStaff(staffData);
      setVenues(venuesData);
      setAssignments(assignmentsData);
    } catch (error) {
      addToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Build schedule data
  const days = useMemo(() => {
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [monthStart, monthEnd]);

  const assignmentMap = useMemo(() => {
    const map = new Map<string, EventAssignment>();
    assignments.forEach((a) => {
      map.set(`${a.date}-${a.staffId}`, a);
    });
    return map;
  }, [assignments]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleCellClick = (date: string, staffId: string) => {
    if (!isAdmin) return; // Staff can only view
    setSelectedCell({ date, staffId });
    setIsAssignModalOpen(true);
  };

  const handleAssignmentSave = async (data: CreateAssignmentInput) => {
    try {
      const result = await assignmentsApi.create(data);
      if (result.replaced) {
        addToast('Assignment updated', 'success');
      } else {
        addToast('Assignment created', 'success');
      }
      setIsAssignModalOpen(false);
      setSelectedCell(null);
      fetchData();
    } catch (error) {
      if (isCollisionError(error)) {
        setCollisionData({ existing: error.existingAssignment, new: data });
      } else {
        addToast('Failed to save assignment', 'error');
      }
    }
  };

  const handleCollisionReplace = async () => {
    if (!collisionData) return;
    try {
      await assignmentsApi.create({ ...collisionData.new, replaceExisting: true });
      addToast('Assignment replaced', 'success');
      setCollisionData(null);
      setIsAssignModalOpen(false);
      setSelectedCell(null);
      fetchData();
    } catch (error) {
      addToast('Failed to replace assignment', 'error');
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      await assignmentsApi.delete(assignmentId);
      addToast('Assignment deleted', 'success');
      fetchData();
    } catch (error) {
      addToast('Failed to delete assignment', 'error');
    }
  };

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
          <h1 className="text-2xl font-bold text-slate-900">Schedule</h1>
          <p className="text-sm text-slate-500">Manage staff assignments for markets and shows</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button onClick={() => setIsCopyWeekModalOpen(true)} className="btn btn-secondary btn-sm">
              <CopyIcon className="w-4 h-4 mr-1" />
              Copy Week
            </button>
          )}
        </div>
      </div>

      {/* Month Navigation */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={handlePrevMonth} className="btn btn-ghost btn-sm">
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <button onClick={handleToday} className="btn btn-ghost btn-sm">
              Today
            </button>
            <button onClick={handleNextMonth} className="btn btn-ghost btn-sm">
              <ChevronRightIcon className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-semibold text-slate-900 ml-2">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'calendar' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Schedule View */}
      {staff.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="w-6 h-6 text-slate-400" />}
          title="No staff members"
          description="Add staff members to start scheduling"
          action={
            <a href="/staff" className="btn btn-primary">
              Add Staff
            </a>
          }
        />
      ) : viewMode === 'table' ? (
        <TableView
          days={days}
          staff={staff}
          assignmentMap={assignmentMap}
          onCellClick={handleCellClick}
          onDeleteAssignment={handleDeleteAssignment}
          isAdmin={isAdmin}
        />
      ) : (
        <CalendarView
          currentDate={currentDate}
          assignments={assignments}
          staff={staff}
          onCellClick={handleCellClick}
          isAdmin={isAdmin}
        />
      )}

      {/* Assignment Modal */}
      <AssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedCell(null);
        }}
        selectedCell={selectedCell}
        venues={venues}
        staff={staff}
        existingAssignment={
          selectedCell
            ? assignmentMap.get(`${selectedCell.date}-${selectedCell.staffId}`)
            : undefined
        }
        onSave={handleAssignmentSave}
        onDelete={handleDeleteAssignment}
      />

      {/* Collision Dialog */}
      <ConfirmDialog
        isOpen={!!collisionData}
        onClose={() => setCollisionData(null)}
        onConfirm={handleCollisionReplace}
        title="Assignment Conflict"
        message={
          collisionData
            ? `This staff member is already assigned to ${collisionData.existing.venue.name} on this date. Do you want to replace it?`
            : ''
        }
        confirmLabel="Replace"
        variant="warning"
      />

      {/* Copy Week Modal */}
      <CopyWeekModal
        isOpen={isCopyWeekModalOpen}
        onClose={() => setIsCopyWeekModalOpen(false)}
        staff={staff}
        onSuccess={() => {
          fetchData();
          addToast('Week copied successfully', 'success');
        }}
      />
    </div>
  );
}

// Table View Component
interface TableViewProps {
  days: Date[];
  staff: Staff[];
  assignmentMap: Map<string, EventAssignment>;
  onCellClick: (date: string, staffId: string) => void;
  onDeleteAssignment: (id: string) => void;
  isAdmin: boolean;
}

function TableView({ days, staff, assignmentMap, onCellClick, onDeleteAssignment, isAdmin }: TableViewProps) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full schedule-table">
          <thead>
            <tr className="bg-slate-50">
              <th className="table-cell font-semibold text-slate-600 sticky left-0 bg-slate-50 z-10 min-w-[100px]">
                Date
              </th>
              <th className="table-cell font-semibold text-slate-600 min-w-[80px]">Day</th>
              {staff.map((s) => (
                <th key={s.id} className="table-cell font-semibold text-slate-600 min-w-[140px]">
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const weekend = isWeekend(day);
              const today = isToday(day);

              return (
                <tr
                  key={dateStr}
                  className={`${weekend ? 'bg-slate-50' : ''} ${today ? 'bg-primary-50' : ''} hover:bg-slate-100`}
                >
                  <td className={`table-cell font-medium sticky left-0 z-10 ${weekend ? 'bg-slate-50' : 'bg-white'} ${today ? 'bg-primary-50' : ''}`}>
                    {format(day, 'd MMM')}
                  </td>
                  <td className="table-cell text-slate-500">{format(day, 'EEE')}</td>
                  {staff.map((s) => {
                    const assignment = assignmentMap.get(`${dateStr}-${s.id}`);
                    return (
                      <td
                        key={s.id}
                        className={`table-cell ${isAdmin ? 'cursor-pointer' : ''} group`}
                        onClick={() => isAdmin && onCellClick(dateStr, s.id)}
                      >
                        {assignment ? (
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-slate-900 truncate">
                                {assignment.venue.name}
                              </div>
                              <div className="text-xs text-slate-500 truncate">
                                {assignment.venue.town}
                              </div>
                            </div>
                            {isAdmin && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteAssignment(assignment.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity"
                              >
                                <XIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        ) : isAdmin ? (
                          <span className="text-slate-300 group-hover:text-primary-400 transition-colors">
                            + Assign
                          </span>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Calendar View Component
interface CalendarViewProps {
  currentDate: Date;
  assignments: EventAssignment[];
  staff: Staff[];
  onCellClick: (date: string, staffId: string) => void;
  isAdmin: boolean;
}

function CalendarView({ currentDate, assignments, staff, onCellClick, isAdmin }: CalendarViewProps) {
  const monthStart = startOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const weeks: Date[][] = [];

  let currentWeek: Date[] = [];
  let day = calendarStart;

  for (let i = 0; i < 42; i++) {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    day = addDays(day, 1);
  }

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-200">
        {dayNames.map((name) => (
          <div key={name} className="px-2 py-3 text-center text-sm font-semibold text-slate-600 bg-slate-50">
            {name}
          </div>
        ))}
      </div>
      {weeks.map((week, weekIdx) => (
        <div key={weekIdx} className="grid grid-cols-7 border-b border-slate-200 last:border-b-0">
          {week.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayAssignments = assignments.filter((a) => a.date === dateStr);
            const inMonth = isSameMonth(day, currentDate);
            const today = isToday(day);

            return (
              <div
                key={dateStr}
                className={`min-h-[100px] p-2 border-r border-slate-200 last:border-r-0 ${
                  !inMonth ? 'bg-slate-50' : ''
                } ${today ? 'bg-primary-50' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${!inMonth ? 'text-slate-400' : 'text-slate-700'}`}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayAssignments.slice(0, 3).map((assignment) => (
                    <button
                      key={assignment.id}
                      onClick={() => isAdmin && onCellClick(dateStr, assignment.staffId)}
                      className={`w-full text-left px-2 py-1 text-xs rounded bg-primary-100 text-primary-800 ${isAdmin ? 'hover:bg-primary-200 cursor-pointer' : 'cursor-default'} truncate`}
                    >
                      <span className="font-medium">{assignment.staff.name}:</span> {assignment.venue.name}
                    </button>
                  ))}
                  {dayAssignments.length > 3 && (
                    <div className="text-xs text-slate-500 pl-2">+{dayAssignments.length - 3} more</div>
                  )}
                  {dayAssignments.length === 0 && inMonth && staff.length > 0 && isAdmin && (
                    <button
                      onClick={() => onCellClick(dateStr, staff[0].id)}
                      className="w-full text-xs text-slate-400 hover:text-primary-500 py-1"
                    >
                      + Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// Assignment Modal
interface AssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCell: { date: string; staffId: string } | null;
  venues: Venue[];
  staff: Staff[];
  existingAssignment?: EventAssignment;
  onSave: (data: CreateAssignmentInput) => void;
  onDelete: (id: string) => void;
}

function AssignmentModal({
  isOpen,
  onClose,
  selectedCell,
  venues,
  staff,
  existingAssignment,
  onSave,
  onDelete,
}: AssignmentModalProps) {
  const [venueId, setVenueId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string>('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'PLANNED' | 'CONFIRMED' | 'CANCELLED'>('PLANNED');

  useEffect(() => {
    if (selectedCell) {
      setStaffId(selectedCell.staffId);
    }
    if (existingAssignment) {
      setVenueId(existingAssignment.venueId);
      setStartTime(existingAssignment.startTime || '');
      setEndTime(existingAssignment.endTime || '');
      setNotes(existingAssignment.notes || '');
      setStatus(existingAssignment.status);
    } else {
      setVenueId(null);
      setStartTime('09:00');
      setEndTime('17:00');
      setNotes('');
      setStatus('PLANNED');
    }
  }, [selectedCell, existingAssignment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCell || !venueId) return;

    onSave({
      date: selectedCell.date,
      staffId: staffId,
      venueId,
      startTime: startTime || null,
      endTime: endTime || null,
      notes: notes || null,
      status,
    });
  };

  const selectedStaff = staff.find((s) => s.id === staffId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={existingAssignment ? 'Edit Assignment' : 'New Assignment'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Date</label>
            <input
              type="text"
              value={selectedCell ? format(parseISO(selectedCell.date), 'EEE, d MMM yyyy') : ''}
              disabled
              className="input bg-slate-50"
            />
          </div>
          <div>
            <label className="label">Staff Member</label>
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="select"
            >
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">Venue</label>
          <VenueSelect
            venues={venues}
            value={venueId}
            onChange={setVenueId}
            placeholder="Select a venue..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="label">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="label">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="select">
            <option value="PLANNED">Planned</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="label">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input min-h-[80px]"
            placeholder="Optional notes..."
          />
        </div>

        <div className="flex justify-between pt-4">
          <div>
            {existingAssignment && (
              <button
                type="button"
                onClick={() => onDelete(existingAssignment.id)}
                className="btn btn-danger"
              >
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={!venueId} className="btn btn-primary">
              {existingAssignment ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// Copy Week Modal
interface CopyWeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: Staff[];
  onSuccess: () => void;
}

function CopyWeekModal({ isOpen, onClose, staff, onSuccess }: CopyWeekModalProps) {
  const [sourceDate, setSourceDate] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceDate || !targetDate) return;

    setLoading(true);
    try {
      const result = await assignmentsApi.copyWeek({
        sourceStartDate: sourceDate,
        targetStartDate: targetDate,
        staffIds: selectedStaff.length > 0 ? selectedStaff : undefined,
      });
      addToast(`Copied ${result.created.length} assignments, skipped ${result.skipped.length}`, 'success');
      onSuccess();
      onClose();
    } catch (error) {
      addToast('Failed to copy week', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Copy Week" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-slate-600">
          Copy all assignments from one week to another. Select the Monday of each week.
        </p>

        <div>
          <label className="label">Source Week (copy from)</label>
          <input
            type="date"
            value={sourceDate}
            onChange={(e) => setSourceDate(e.target.value)}
            className="input"
            required
          />
        </div>

        <div>
          <label className="label">Target Week (copy to)</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="input"
            required
          />
        </div>

        <div>
          <label className="label">Staff (leave empty for all)</label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {staff.map((s) => (
              <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedStaff.includes(s.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedStaff([...selectedStaff, s.id]);
                    } else {
                      setSelectedStaff(selectedStaff.filter((id) => id !== s.id));
                    }
                  }}
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm">{s.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading || !sourceDate || !targetDate} className="btn btn-primary">
            {loading ? <LoadingSpinner size="sm" /> : 'Copy Week'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Icons
function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
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

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
