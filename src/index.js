/**
 * Staff Scheduler - Main Entry Point
 * 
 * A simple staff scheduling application
 */

const Scheduler = require('./scheduler');

// Example usage
const scheduler = new Scheduler();

// Add some sample employees
scheduler.addEmployee({ id: 1, name: 'John Doe', availableDays: ['Monday', 'Tuesday', 'Wednesday'] });
scheduler.addEmployee({ id: 2, name: 'Jane Smith', availableDays: ['Wednesday', 'Thursday', 'Friday'] });
scheduler.addEmployee({ id: 3, name: 'Bob Johnson', availableDays: ['Monday', 'Friday', 'Saturday'] });

// Display employees
console.log('=== Staff Scheduler ===\n');
console.log('Employees:');
scheduler.getEmployees().forEach(emp => {
  console.log(`  ${emp.id}. ${emp.name} - Available: ${emp.availableDays.join(', ')}`);
});

console.log('\nScheduler initialized successfully!');
console.log('Use the Scheduler API to create and manage shifts.');
