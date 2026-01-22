import React, { useState, useEffect, useRef } from 'react';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { staffApi, assignmentsApi, exportApi } from '../api/client';
import type { Staff, EventAssignment } from '../types';
import { LoadingSpinner, EmptyState } from '../components/Common';
import { useToast } from '../components/Toast';

export function ExportsPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [assignments, setAssignments] = useState<EventAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const { addToast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const fromDate = format(monthStart, 'yyyy-MM-dd');
  const toDate = format(monthEnd, 'yyyy-MM-dd');

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffData, assignmentsData] = await Promise.all([
        staffApi.getAll(),
        assignmentsApi.getByDateRange(fromDate, toDate),
      ]);
      setStaff(staffData);
      setAssignments(assignmentsData);
    } catch (error) {
      addToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleDownloadCsv = () => {
    exportApi.downloadCsv(fromDate, toDate);
    addToast('Downloading CSV...', 'info');
  };

  const handleDownloadIcs = () => {
    exportApi.downloadIcs(fromDate, toDate, selectedStaffId || undefined);
    addToast('Downloading iCal file...', 'info');
  };

  const handlePrint = () => {
    window.print();
  };

  // Group assignments by date for print view
  const assignmentsByDate = assignments.reduce((acc, a) => {
    if (!acc[a.date]) acc[a.date] = [];
    acc[a.date].push(a);
    return acc;
  }, {} as Record<string, EventAssignment[]>);

  const sortedDates = Object.keys(assignmentsByDate).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" className="text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Hidden when printing */}
      <div className="no-print">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Exports</h1>
            <p className="text-sm text-slate-500">Export and print your schedule</p>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="card p-4 mt-6">
          <div className="flex items-center gap-4">
            <button onClick={handlePrevMonth} className="btn btn-ghost btn-sm">
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-semibold text-slate-900">
              {format(currentDate, 'MMMM yyyy')}
            </h2>
            <button onClick={handleNextMonth} className="btn btn-ghost btn-sm">
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Export Options */}
        <div className="grid gap-4 sm:grid-cols-3 mt-6">
          {/* CSV Export */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <TableIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">CSV Export</h3>
                <p className="text-sm text-slate-500">For spreadsheets</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Download the schedule as a CSV file. Opens in Excel, Google Sheets, etc.
            </p>
            <button onClick={handleDownloadCsv} className="btn btn-primary w-full">
              <DownloadIcon className="w-4 h-4 mr-2" />
              Download CSV
            </button>
          </div>

          {/* Print */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <PrinterIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Print</h3>
                <p className="text-sm text-slate-500">A4 friendly</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Print a clean, formatted version of the monthly schedule.
            </p>
            <button onClick={handlePrint} className="btn btn-primary w-full">
              <PrinterIcon className="w-4 h-4 mr-2" />
              Print Schedule
            </button>
          </div>

          {/* iCal Export */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">iCal Export</h3>
                <p className="text-sm text-slate-500">For calendars</p>
              </div>
            </div>
            <div className="mb-4">
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="select text-sm mb-2"
              >
                <option value="">All staff</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500">
                Import into Google Calendar, Outlook, Apple Calendar, etc.
              </p>
            </div>
            <button onClick={handleDownloadIcs} className="btn btn-primary w-full">
              <DownloadIcon className="w-4 h-4 mr-2" />
              Download .ics
            </button>
          </div>
        </div>

        {/* Preview Stats */}
        <div className="card p-4 mt-6">
          <h3 className="font-semibold text-slate-900 mb-3">Month Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold text-slate-900">{assignments.length}</div>
              <div className="text-sm text-slate-500">Total Assignments</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {new Set(assignments.map((a) => a.date)).size}
              </div>
              <div className="text-sm text-slate-500">Days Scheduled</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {new Set(assignments.map((a) => a.staffId)).size}
              </div>
              <div className="text-sm text-slate-500">Staff Assigned</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">
                {new Set(assignments.map((a) => a.venueId)).size}
              </div>
              <div className="text-sm text-slate-500">Venues Used</div>
            </div>
          </div>
        </div>
      </div>

      {/* Print Preview / Print Content */}
      <div ref={printRef} className="print-content">
        {/* Print Header */}
        <div className="hidden print:block mb-6">
          <h1 className="text-xl font-bold text-center">Staff Schedule</h1>
          <p className="text-center text-slate-600">{format(currentDate, 'MMMM yyyy')}</p>
        </div>

        {/* Schedule Table for Print */}
        {assignments.length === 0 ? (
          <EmptyState
            icon={<CalendarIcon className="w-6 h-6 text-slate-400" />}
            title="No assignments"
            description="No assignments scheduled for this month"
          />
        ) : (
          <div className="card overflow-hidden print:shadow-none print:border-0">
            <table className="w-full schedule-table">
              <thead>
                <tr className="bg-slate-50">
                  <th className="table-cell font-semibold text-slate-600 text-left">Date</th>
                  <th className="table-cell font-semibold text-slate-600 text-left">Day</th>
                  <th className="table-cell font-semibold text-slate-600 text-left">Staff</th>
                  <th className="table-cell font-semibold text-slate-600 text-left">Venue</th>
                  <th className="table-cell font-semibold text-slate-600 text-left">Town</th>
                  <th className="table-cell font-semibold text-slate-600 text-left">Time</th>
                  <th className="table-cell font-semibold text-slate-600 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedDates.map((date) =>
                  assignmentsByDate[date].map((assignment, idx) => (
                    <tr key={assignment.id} className={idx % 2 === 0 ? '' : 'bg-slate-50'}>
                      <td className="table-cell">
                        {idx === 0 ? format(new Date(date), 'd MMM') : ''}
                      </td>
                      <td className="table-cell text-slate-500">
                        {idx === 0 ? format(new Date(date), 'EEE') : ''}
                      </td>
                      <td className="table-cell font-medium">{assignment.staff.name}</td>
                      <td className="table-cell">{assignment.venue.name}</td>
                      <td className="table-cell text-slate-500">{assignment.venue.town}</td>
                      <td className="table-cell text-slate-500">
                        {assignment.startTime && assignment.endTime
                          ? `${assignment.startTime} - ${assignment.endTime}`
                          : assignment.startTime || '-'}
                      </td>
                      <td className="table-cell">
                        <span
                          className={`badge ${
                            assignment.status === 'CONFIRMED'
                              ? 'badge-confirmed'
                              : assignment.status === 'CANCELLED'
                              ? 'badge-cancelled'
                              : 'badge-planned'
                          }`}
                        >
                          {assignment.status.toLowerCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Print Footer */}
        <div className="hidden print:block mt-6 text-center text-xs text-slate-500">
          Generated on {format(new Date(), 'dd/MM/yyyy HH:mm')}
        </div>
      </div>
    </div>
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

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function TableIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function PrinterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
