import React, { useMemo } from 'react';
import { useStateContext } from '../context/StateContext';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const ReportsView = () => {
  const { state } = useStateContext();
  const { bookings, services, expenses, customers, staff, resources } = state;

  const reportsData = useMemo(() => {
    const incomeByMonth = {};
    bookings.forEach(booking => {
      if (booking.status === 'Completed' && booking.fee) {
        const month = new Date(booking.date).toISOString().slice(0, 7);
        incomeByMonth[month] = (incomeByMonth[month] || 0) + booking.fee;
      }
    });

    const expensesByMonth = {};
    expenses.forEach(expense => {
      const month = new Date(expense.date).toISOString().slice(0, 7);
      expensesByMonth[month] = (expensesByMonth[month] || 0) + expense.amount;
    });

    const allMonths = [...new Set([...Object.keys(incomeByMonth), ...Object.keys(expensesByMonth)])].sort();

    const serviceCounts = {};
    bookings.forEach(booking => {
      serviceCounts[booking.serviceId] = (serviceCounts[booking.serviceId] || 0) + 1;
    });

    const customerBookingCounts = {};
    bookings.forEach(b => {
        if (!customerBookingCounts[b.customerId]) customerBookingCounts[b.customerId] = 0;
        customerBookingCounts[b.customerId]++;
    });

    const staffPerformance = {};
    staff.forEach(i => staffPerformance[i.id] = 0);
    bookings.forEach(b => { if(staffPerformance.hasOwnProperty(b.staffId)) staffPerformance[b.staffId]++; });

    const resourceUtilisation = {};
    resources.forEach(v => resourceUtilisation[v.id] = 0);
    bookings.forEach(b => {
        if(b.resourceIds) {
            b.resourceIds.forEach(resId => {
                 if(resourceUtilisation.hasOwnProperty(resId)) resourceUtilisation[resId]++;
            });
        }
    });

    const peakHours = {};
    for(let i=7; i<=21; i++) { peakHours[String(i).padStart(2, '0')] = 0; }
    bookings.forEach(b => { const startHour = b.startTime.split(':')[0]; if(peakHours.hasOwnProperty(startHour)) peakHours[startHour]++; });

    return {
      incomeExpenseData: {
        labels: allMonths,
        datasets: [
          { label: 'Income (€)', data: allMonths.map(month => incomeByMonth[month] || 0), backgroundColor: 'rgba(59, 130, 246, 0.5)' },
          { label: 'Expenses (€)', data: allMonths.map(month => expensesByMonth[month] || 0), backgroundColor: 'rgba(239, 68, 68, 0.5)' },
        ],
      },
      servicePopularityData: {
        labels: Object.keys(serviceCounts).map(serviceId => services.find(s => s.id === serviceId)?.service_name || 'Unknown'),
        datasets: [{ data: Object.values(serviceCounts), backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'] }],
      },
      topCustomersData: {
        labels: Object.entries(customerBookingCounts).sort(([,a],[,b]) => b-a).slice(0, 5).map(([customerId, count]) => customers.find(c => c.id === customerId)?.name || 'Unknown'),
        datasets: [{ label: 'Bookings', data: Object.values(customerBookingCounts).sort((a,b) => b-a).slice(0, 5), backgroundColor: 'rgba(75, 192, 192, 0.5)' }],
      },
      staffPerformanceData: {
        labels: staff.map(s => s.name),
        datasets: [{ label: 'Bookings', data: staff.map(s => staffPerformance[s.id]), backgroundColor: 'rgba(153, 102, 255, 0.5)' }],
      },
      resourceUtilisationData: {
        labels: resources.map(r => r.resource_name),
        datasets: [{ label: 'Bookings', data: resources.map(r => resourceUtilisation[r.id]), backgroundColor: 'rgba(255, 159, 64, 0.5)' }],
      },
      peakHoursData: {
        labels: Object.keys(peakHours),
        datasets: [{ label: 'Bookings', data: Object.values(peakHours), borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.5)' }],
      }
    };
  }, [bookings, services, expenses, customers, staff, resources]);

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Business Reports</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gray-50 p-4 rounded-lg lg:col-span-2"><h3 className="text-lg font-semibold mb-4 text-center">Income vs. Expenses by Month</h3><Bar data={reportsData.incomeExpenseData} /></div>
        <div className="bg-gray-50 p-4 rounded-lg"><h3 className="text-lg font-semibold mb-4 text-center">Service Popularity</h3><Doughnut data={reportsData.servicePopularityData} /></div>
        <div className="bg-gray-50 p-4 rounded-lg"><h3 className="text-lg font-semibold mb-4 text-center">Top 5 Customers</h3><Bar data={reportsData.topCustomersData} options={{indexAxis: 'y'}} /></div>
        <div className="bg-gray-50 p-4 rounded-lg"><h3 className="text-lg font-semibold mb-4 text-center">Staff Performance</h3><Bar data={reportsData.staffPerformanceData} /></div>
        <div className="bg-gray-50 p-4 rounded-lg"><h3 className="text-lg font-semibold mb-4 text-center">Resource Utilisation</h3><Bar data={reportsData.resourceUtilisationData} /></div>
        <div className="bg-gray-50 p-4 rounded-lg lg:col-span-2"><h3 className="text-lg font-semibold mb-4 text-center">Peak Booking Hours</h3><Line data={reportsData.peakHoursData} /></div>
      </div>
    </div>
  );
};

export default ReportsView;
