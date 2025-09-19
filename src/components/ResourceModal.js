import React, { useState, useEffect } from 'react';
import { useStateContext } from '../context/StateContext';

const ResourceModal = ({ resourceId, closeModal }) => {
  const { state, setState } = useStateContext();
  const [resource, setResource] = useState({
    resource_name: '',
    resource_type: 'VEHICLE',
    capacity: 1,
    make: '',
    model: '',
    reg: '',
    maintenance_schedule: {
      mot: '',
      tax: '',
      service: '',
    },
  });

  useEffect(() => {
    if (resourceId) {
      const existingResource = state.resources.find(r => r.id === resourceId);
      if (existingResource) {
        setResource(existingResource);
      }
    }
  }, [resourceId, state.resources]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name in resource.maintenance_schedule) {
      setResource(prev => ({
        ...prev,
        maintenance_schedule: {
          ...prev.maintenance_schedule,
          [name]: value,
        },
      }));
    } else {
      setResource(prev => ({ ...prev, [name]: value }));
    }
  };

  const saveResource = (e) => {
    e.preventDefault();
    if (resourceId) {
      // Update existing resource
      const updatedResources = state.resources.map(r =>
        r.id === resourceId ? resource : r
      );
      setState(prev => ({ ...prev, resources: updatedResources }));
    } else {
      // Add new resource
      const newResource = { ...resource, id: `resource_${Date.now()}` };
      setState(prev => ({
        ...prev,
        resources: [...prev.resources, newResource],
      }));
    }
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="w-full max-w-4xl modal">
        <div className="modal-header">
          <h3 id="resource-modal-title">{resourceId ? 'Edit Resource' : 'New Resource'}</h3>
        </div>
        <form onSubmit={saveResource} className="p-6 space-y-4">
          <input type="hidden" id="resource-id" value={resource.id || ''} />
          <div>
            <label htmlFor="resource-name" className="block mb-1 text-sm font-medium text-gray-700">Resource Name</label>
            <input type="text" id="resource-name" name="resource_name" value={resource.resource_name} onChange={handleChange} required className="w-full" placeholder="e.g., Ford Focus, Meeting Room 1" />
          </div>
          <div>
            <label htmlFor="resource-type" className="block mb-1 text-sm font-medium text-gray-700">Resource Type</label>
            <select id="resource-type" name="resource_type" value={resource.resource_type} onChange={handleChange} required className="w-full">
              <option value="VEHICLE">Vehicle</option>
              <option value="ROOM">Room</option>
              <option value="EQUIPMENT">Equipment</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor="resource-capacity" className="block mb-1 text-sm font-medium text-gray-700">Capacity</label>
            <input type="number" id="resource-capacity" name="capacity" value={resource.capacity} onChange={handleChange} className="w-full" min="1" />
          </div>
          {resource.resource_type === 'VEHICLE' && (
            <div id="vehicle-specific-fields" className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label htmlFor="resource-make" className="block mb-1 text-sm font-medium">Make</label><input type="text" id="resource-make" name="make" value={resource.make} onChange={handleChange} className="w-full" /></div>
                <div><label htmlFor="resource-model" className="block mb-1 text-sm font-medium">Model</label><input type="text" id="resource-model" name="model" value={resource.model} onChange={handleChange} className="w-full" /></div>
              </div>
              <div><label htmlFor="resource-reg" className="block mb-1 text-sm font-medium">Registration</label><input type="text" id="resource-reg" name="reg" value={resource.reg} onChange={handleChange} className="w-full" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t pt-4 mt-2">
                <div><label htmlFor="resource-mot" className="block mb-1 text-sm font-medium">MOT Due</label><input type="date" id="resource-mot" name="mot" value={resource.maintenance_schedule.mot} onChange={handleChange} className="w-full" /></div>
                <div><label htmlFor="resource-tax" className="block mb-1 text-sm font-medium">Tax Due</label><input type="date" id="resource-tax" name="tax" value={resource.maintenance_schedule.tax} onChange={handleChange} className="w-full" /></div>
                <div><label htmlFor="resource-service" className="block mb-1 text-sm font-medium">Service Due</label><input type="date" id="resource-service" name="service" value={resource.maintenance_schedule.service} onChange={handleChange} className="w-full" /></div>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Save Resource</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResourceModal;
