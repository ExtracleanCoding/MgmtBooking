import React, { useState } from 'react';
import { useStateContext } from '../context/StateContext';
import DaySummaryModal from './DaySummaryModal';

const CalendarView = () => {
  const { state } = useStateContext();
  const { bookings, customers } = state;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month'); // 'month', 'week', 'day'
  const [isDaySummaryModalOpen, setIsDaySummaryModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const openDaySummaryModal = (date) => {
    setSelectedDate(date);
    setIsDaySummaryModalOpen(true);
  };

  const closeDaySummaryModal = () => {
    setSelectedDate(null);
    setIsDaySummaryModalOpen(false);
  };

  const changeDate = (unit, direction) => {
    const newDate = new Date(currentDate);
    if (unit === 'day') newDate.setDate(newDate.getDate() + direction);
    else if (unit === 'week') newDate.setDate(newDate.getDate() + 7 * direction);
    else if (unit === 'month') newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startDay = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startDay; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-cell bg-gray-50"></div>);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dateString = date.toISOString().slice(0, 10);
      const dayBookings = bookings.filter(b => b.date === dateString && b.status !== 'Cancelled');
      cells.push(
        <div key={i} className="calendar-cell cursor-pointer" onClick={() => openDaySummaryModal(dateString)}>
          <span className="day-number">{i}</span>
          {dayBookings.length > 0 && (
            <div className="mt-1 text-xs text-blue-600">{dayBookings.length} booking{dayBookings.length > 1 ? 's' : ''}</div>
          )}
        </div>
      );
    }
    return <div className="grid grid-cols-7 calendar-grid">{cells}</div>;
  };

  const renderWeekView = () => {
    const weekStart = new Date(currentDate);
    const dayOfWeek = weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1;
    weekStart.setDate(weekStart.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(day.getDate() + i);
        days.push(day);
    }

    return (
        <div className="grid grid-cols-7 calendar-grid">
            {days.map((day, i) => {
                const dateString = day.toISOString().slice(0, 10);
                const dayBookings = bookings.filter(b => b.date === dateString && b.status !== 'Cancelled').sort((a,b) => a.startTime.localeCompare(b.startTime));
                return (
                    <div key={i} className="calendar-cell" onClick={() => openDaySummaryModal(dateString)}>
                        <span className="day-number">{day.getDate()}</span>
                        <div className="mt-1 space-y-1">
                            {dayBookings.map(booking => {
                                const customer = customers.find(c => c.id === booking.customerId);
                                return (
                                    <div key={booking.id} className="p-1 my-1 rounded-md bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer">
                                        <p className="truncate text-xs font-medium">{customer?.name}</p>
                                        <p className="text-xs">{booking.startTime}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
  };

  const renderDayView = () => {
    const dateString = currentDate.toISOString().slice(0, 10);
    const dayBookings = bookings.filter(b => b.date === dateString && b.status !== 'Cancelled');
    const hours = Array.from({length: 15}, (_, i) => i + 7); // 7am to 9pm

    const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    return (
        <div className="relative" style={{height: `${hours.length * 60}px`}}>
            {hours.map(hour => (
                <div key={hour} className="h-15 border-b border-gray-200 relative">
                    <span className="absolute -top-2.5 left-2 text-xs text-gray-400 bg-white px-1">{String(hour).padStart(2, '0')}:00</span>
                </div>
            ))}
            {dayBookings.map(booking => {
                const top = (timeToMinutes(booking.startTime) - (7 * 60)) * 1; // 1px per minute
                const height = (timeToMinutes(booking.endTime) - timeToMinutes(booking.startTime)) * 1;
                const customer = customers.find(c => c.id === booking.customerId);
                return (
                    <div key={booking.id} className="absolute left-16 right-0 bg-blue-100 border-l-4 border-blue-500 p-2" style={{top: `${top}px`, height: `${height}px`}}>
                        <p className="font-semibold text-sm">{customer?.name}</p>
                        <p className="text-xs">{booking.startTime} - {booking.endTime}</p>
                    </div>
                )
            })}
        </div>
    )
  }

  const renderHeader = () => {
    let title = '';
    if (view === 'month') title = currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    else if (view === 'week') {
        const weekStart = new Date(currentDate);
        const dayOfWeek = weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1;
        weekStart.setDate(weekStart.getDate() - dayOfWeek);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        title = `${weekStart.toLocaleDateString('en-GB', {month: 'short', day: 'numeric'})} - ${weekEnd.toLocaleDateString('en-GB', {month: 'short', day: 'numeric', year: 'numeric'})}`;
    } else if (view === 'day') {
        title = currentDate.toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
        <div className="flex items-center gap-2">
          <button onClick={() => changeDate(view, -1)} className="p-2 rounded-md hover:bg-gray-100">&lt;</button>
          <h2 className="text-xl font-semibold text-gray-800 text-center">{title}</h2>
          <button onClick={() => changeDate(view, 1)} className="p-2 rounded-md hover:bg-gray-100">&gt;</button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex p-1 bg-gray-100 rounded-md">
            <button onClick={() => setView('day')} className={`px-3 py-1 text-sm rounded-md ${view === 'day' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100'}`}>Day</button>
            <button onClick={() => setView('week')} className={`px-3 py-1 text-sm rounded-md ${view === 'week' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100'}`}>Week</button>
            <button onClick={() => setView('month')} className={`px-3 py-1 text-sm rounded-md ${view === 'month' ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100'}`}>Month</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        {renderHeader()}
        <div id="calendar-content">
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}
        </div>
      </div>
      {isDaySummaryModalOpen && <DaySummaryModal date={selectedDate} closeModal={closeDaySummaryModal} />}
    </>
  );
};

export default CalendarView;
