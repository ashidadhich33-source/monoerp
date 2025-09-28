import React, { useState, useEffect, useCallback } from 'react';

const Calendar = ({ 
  attendanceData = [], 
  onDateSelect, 
  selectedDate, 
  className = '' 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);

  const getAttendanceForDate = useCallback((date) => {
    const dateStr = date.toISOString().split('T')[0];
    return attendanceData.find(att => att.date === dateStr);
  }, [attendanceData]);

  const generateCalendarDays = useCallback(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dayData = {
        date: new Date(current),
        isCurrentMonth: current.getMonth() === month,
        isToday: current.toDateString() === new Date().toDateString(),
        isSelected: selectedDate && current.toDateString() === selectedDate.toDateString(),
        attendance: getAttendanceForDate(current)
      };
      
      days.push(dayData);
      current.setDate(current.getDate() + 1);
    }
    
    setCalendarDays(days);
  }, [currentDate, getAttendanceForDate, selectedDate]);

  useEffect(() => {
    generateCalendarDays();
  }, [generateCalendarDays]);

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const getAttendanceStatus = (attendance) => {
    if (!attendance) return 'absent';
    if (attendance.status === 'present') return 'present';
    if (attendance.status === 'half_day') return 'half-day';
    if (attendance.status === 'holiday') return 'holiday';
    return 'absent';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-200';
      case 'half-day': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'holiday': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'absent': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h2 className="text-lg font-semibold text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const status = getAttendanceStatus(day.attendance);
          const isClickable = day.isCurrentMonth;
          
          return (
            <button
              key={index}
              onClick={() => isClickable && onDateSelect && onDateSelect(day.date)}
              disabled={!isClickable}
              className={`
                p-2 h-12 text-sm border-r border-b border-gray-200 last:border-r-0
                ${isClickable ? 'hover:bg-gray-50 cursor-pointer' : 'cursor-not-allowed text-gray-400'}
                ${day.isToday ? 'ring-2 ring-blue-500' : ''}
                ${day.isSelected ? 'bg-blue-50' : ''}
                ${getStatusColor(status)}
                transition-colors duration-150
              `}
            >
              <div className="flex flex-col items-center">
                <span className={`${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
                  {day.date.getDate()}
                </span>
                {day.attendance && (
                  <div className="w-2 h-2 rounded-full bg-current mt-1"></div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded mr-2"></div>
            <span>Present</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded mr-2"></div>
            <span>Half Day</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded mr-2"></div>
            <span>Holiday</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded mr-2"></div>
            <span>Absent</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;