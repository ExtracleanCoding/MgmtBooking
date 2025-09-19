import React, { useState } from 'react';
import { useStateContext } from '../context/StateContext';
import ResourceModal from './ResourceModal';

const ResourcesView = () => {
  const { state, setState } = useStateContext();
  const { resources } = state;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState(null);

  const openResourceModal = (resourceId = null) => {
    setSelectedResourceId(resourceId);
    setIsModalOpen(true);
  };

  const closeResourceModal = () => {
    setSelectedResourceId(null);
    setIsModalOpen(false);
  };

  const deleteResource = (resourceId) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      const isUsed = state.bookings.some(b => b.resourceIds && b.resourceIds.includes(resourceId));
      if (isUsed) {
        alert('This resource is currently assigned to one or more bookings.');
        return;
      }
      const updatedResources = state.resources.filter(r => r.id !== resourceId);
      setState(prev => ({ ...prev, resources: updatedResources }));
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl">Resources</h2>
          <button onClick={() => openResourceModal()} className="btn btn-primary">
            Add Resource
          </button>
        </div>
        <div id="resources-list-table" className="overflow-x-auto">
          {resources.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No resources found.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="">Name</th>
                  <th className="hidden sm:table-cell">Type</th>
                  <th className="hidden md:table-cell">Capacity</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {resources.map(resource => (
                  <tr key={resource.id}>
                    <td>{resource.resource_name}</td>
                    <td className="hidden sm:table-cell">{resource.resource_type}</td>
                    <td className="hidden md:table-cell">{resource.capacity || 'N/A'}</td>
                    <td className="text-right">
                      <button onClick={() => openResourceModal(resource.id)} className="font-medium text-indigo-600 hover:text-indigo-900">
                        Edit
                      </button>
                      <button onClick={() => deleteResource(resource.id)} className="ml-4 font-medium text-red-600 hover:text-red-900">
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
      {isModalOpen && <ResourceModal resourceId={selectedResourceId} closeModal={closeResourceModal} />}
    </>
  );
};

export default ResourcesView;
