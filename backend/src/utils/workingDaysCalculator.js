const INDIAN_HOLIDAYS = [
  '2026-01-26', // Republic Day Native Mapping
  '2026-08-15', // Independence Day Native Mapping
  '2026-10-02'  // Gandhi Jayanti Native Mapping
];

exports.get90WorkingDaysEndDate = (startDate) => {
  let daysAdded = 0;
  let currentDate = new Date(startDate);
  
  while (daysAdded < 90) {
    currentDate.setDate(currentDate.getDate() + 1);
    const day = currentDate.getDay(); // 0 is exactly Sunday, 6 is exactly Saturday mapping cleanly
    const formattedDate = currentDate.toISOString().split('T')[0];
    
    // Explicit Javascript Logic omitting weekends and mapped holiday array strings
    if (day !== 0 && day !== 6 && !INDIAN_HOLIDAYS.includes(formattedDate)) {
      daysAdded++;
    }
  }
  return currentDate;
};

exports.getWorkingDaysElapsed = (startDate) => {
  let elapsed = 0;
  let current = new Date(startDate);
  const now = new Date();

  while (current <= now) {
    const day = current.getDay();
    const formattedDate = current.toISOString().split('T')[0];
    
    if (day !== 0 && day !== 6 && !INDIAN_HOLIDAYS.includes(formattedDate)) {
      elapsed++;
    }
    current.setDate(current.getDate() + 1);
  }
  return elapsed;
};
