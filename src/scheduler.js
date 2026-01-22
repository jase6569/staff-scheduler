/**
 * Scheduler Class
 * 
 * Manages employees and their schedules
 */

class Scheduler {
  constructor() {
    this.employees = [];
    this.shifts = [];
  }

  /**
   * Add an employee to the scheduler
   * @param {Object} employee - Employee object with id, name, and availableDays
   */
  addEmployee(employee) {
    if (!employee.id || !employee.name || !employee.availableDays) {
      throw new Error('Employee must have id, name, and availableDays');
    }
    this.employees.push(employee);
  }

  /**
   * Get all employees
   * @returns {Array} List of employees
   */
  getEmployees() {
    return this.employees;
  }

  /**
   * Get an employee by ID
   * @param {number} id - Employee ID
   * @returns {Object|undefined} Employee object or undefined
   */
  getEmployeeById(id) {
    return this.employees.find(emp => emp.id === id);
  }

  /**
   * Create a shift
   * @param {Object} shift - Shift object with day, startTime, endTime, and requiredStaff
   */
  createShift(shift) {
    if (!shift.day || !shift.startTime || !shift.endTime) {
      throw new Error('Shift must have day, startTime, and endTime');
    }
    this.shifts.push({
      ...shift,
      assignedEmployees: []
    });
  }

  /**
   * Assign an employee to a shift
   * @param {number} shiftIndex - Index of the shift
   * @param {number} employeeId - ID of the employee
   */
  assignEmployeeToShift(shiftIndex, employeeId) {
    const shift = this.shifts[shiftIndex];
    const employee = this.getEmployeeById(employeeId);

    if (!shift) {
      throw new Error('Shift not found');
    }
    if (!employee) {
      throw new Error('Employee not found');
    }
    if (!employee.availableDays.includes(shift.day)) {
      throw new Error('Employee is not available on this day');
    }

    shift.assignedEmployees.push(employeeId);
  }

  /**
   * Get all shifts
   * @returns {Array} List of shifts
   */
  getShifts() {
    return this.shifts;
  }
}

module.exports = Scheduler;
