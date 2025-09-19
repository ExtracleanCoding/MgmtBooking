import React, { useState } from 'react';
import { useStateContext } from '../context/StateContext';
import ServiceModal from './ServiceModal';

const ServicesView = () => {
  const { state, setState } = useStateContext();
  const { services } = state;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState(null);

  const openServiceModal = (serviceId = null) => {
    setSelectedServiceId(serviceId);
    setIsModalOpen(true);
  };

  const closeServiceModal = () => {
    setSelectedServiceId(null);
    setIsModalOpen(false);
  };

  const deleteService = (serviceId) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      const updatedServices = state.services.filter(s => s.id !== serviceId);
      setState(prev => ({ ...prev, services: updatedServices }));
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl">Services</h2>
          <button onClick={() => openServiceModal()} className="btn btn-primary">
            Add Service
          </button>
        </div>
        <div id="services-list-table" className="overflow-x-auto">
          {services.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No services found.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="">Name</th>
                  <th className="hidden sm:table-cell">Type</th>
                  <th className="hidden md:table-cell">Duration</th>
                  <th className="hidden md:table-cell">Price</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {services.map(service => (
                  <tr key={service.id}>
                    <td>{service.service_name}</td>
                    <td className="hidden sm:table-cell">{(service.service_type || '').replace('_', ' ')}</td>
                    <td className="hidden md:table-cell">{service.duration_minutes} min</td>
                    <td className="hidden md:table-cell">€{(service.base_price || 0).toFixed(2)}</td>
                    <td className="text-right">
                      <button onClick={() => openServiceModal(service.id)} className="font-medium text-indigo-600 hover:text-indigo-900">
                        Edit
                      </button>
                      <button onClick={() => deleteService(service.id)} className="ml-4 font-medium text-red-600 hover:text-red-900">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {isModalOpen && <ServiceModal serviceId={selectedServiceId} closeModal={closeServiceModal} />}
    </>
  );
};

export default ServicesView;
