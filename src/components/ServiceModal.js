import React, { useState, useEffect } from 'react';
import { useStateContext } from '../context/StateContext';

const ServiceModal = ({ serviceId, closeModal }) => {
  const { state, setState } = useStateContext();
  const [service, setService] = useState({
    service_name: '',
    service_type: 'DRIVING_LESSON',
    duration_minutes: 60,
    base_price: 0,
    description: '',
    photo_gallery: [],
    capacity: { min: 1, max: 10 },
    pricing_rules: { type: 'fixed', price: 0, tiers: [] },
  });

  useEffect(() => {
    if (serviceId) {
      const existingService = state.services.find(s => s.id === serviceId);
      if (existingService) {
        // Deep copy to avoid direct state mutation
        setService(JSON.parse(JSON.stringify(existingService)));
      }
    } else {
        setService({
            service_name: '',
            service_type: 'DRIVING_LESSON',
            duration_minutes: 60,
            base_price: 0,
            description: '',
            photo_gallery: [],
            capacity: { min: 1, max: 10 },
            pricing_rules: { type: 'fixed', price: 0, tiers: [{name: '', price: ''}] },
          });
    }
  }, [serviceId, state.services]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setService(prev => ({ ...prev, [name]: value }));
  };

  const handlePricingTypeChange = (e) => {
    const { value } = e.target;
    setService(prev => ({
      ...prev,
      pricing_rules: { ...prev.pricing_rules, type: value },
    }));
  };

  const handleTierChange = (index, field, value) => {
    const updatedTiers = [...service.pricing_rules.tiers];
    updatedTiers[index][field] = value;
    setService(prev => ({
      ...prev,
      pricing_rules: { ...prev.pricing_rules, tiers: updatedTiers },
    }));
  };

  const addTier = () => {
    setService(prev => ({
      ...prev,
      pricing_rules: {
        ...prev.pricing_rules,
        tiers: [...prev.pricing_rules.tiers, { name: '', price: '' }],
      },
    }));
  };

  const removeTier = (index) => {
    const updatedTiers = [...service.pricing_rules.tiers];
    updatedTiers.splice(index, 1);
    setService(prev => ({
      ...prev,
      pricing_rules: { ...prev.pricing_rules, tiers: updatedTiers },
    }));
  };

  const saveService = (e) => {
    e.preventDefault();
    const serviceData = {
        ...service,
        base_price: service.pricing_rules.type === 'fixed' ? parseFloat(service.pricing_rules.price) : (service.pricing_rules.tiers[0]?.price || 0),
        duration_minutes: parseInt(service.duration_minutes, 10),
    }

    if (serviceId) {
      // Update existing service
      const updatedServices = state.services.map(s =>
        s.id === serviceId ? serviceData : s
      );
      setState(prev => ({ ...prev, services: updatedServices }));
    } else {
      // Add new service
      const newService = { ...serviceData, id: `service_${Date.now()}` };
      setState(prev => ({
        ...prev,
        services: [...prev.services, newService],
      }));
    }
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="w-full max-w-4xl modal">
        <div className="modal-header">
          <h3 id="service-modal-title">{serviceId ? 'Edit Service' : 'New Service'}</h3>
        </div>
        <form onSubmit={saveService} className="p-6 space-y-4">
          <input type="hidden" id="service-id" value={service.id || ''} />
          <div>
            <label htmlFor="service-name" className="block mb-1 text-sm font-medium text-gray-700">Service Name</label>
            <input type="text" id="service-name" name="service_name" value={service.service_name} onChange={handleChange} required className="w-full" />
          </div>
          <div>
            <label htmlFor="service-duration" className="block mb-1 text-sm font-medium text-gray-700">Duration (minutes)</label>
            <input type="number" id="service-duration" name="duration_minutes" value={service.duration_minutes} onChange={handleChange} required className="w-full" step="30" />
          </div>
          <div>
            <label htmlFor="service-type" className="block mb-1 text-sm font-medium text-gray-700">Service Type</label>
            <select id="service-type" name="service_type" value={service.service_type} onChange={handleChange} className="w-full">
              <option value="DRIVING_LESSON">Driving Lesson</option>
              <option value="TOUR">Tour</option>
            </select>
          </div>

          {service.service_type === 'TOUR' && (
            <div id="tour-fields" className="space-y-4 pt-4 border-t">
              <h4 className="text-lg font-medium">Additional Details <span className="text-sm font-normal text-gray-500">(Optional)</span></h4>
              <div>
                <label htmlFor="service-description" className="block mb-1 text-sm font-medium text-gray-700">Description</label>
                <textarea id="service-description" name="description" value={service.description} onChange={handleChange} rows="3" className="w-full"></textarea>
              </div>
              <div>
                  <label htmlFor="service-photos" className="block mb-1 text-sm font-medium text-gray-700">Photo Gallery URLs (one per line)</label>
                  <textarea id="service-photos" name="photo_gallery" value={Array.isArray(service.photo_gallery) ? service.photo_gallery.join('\n') : ''} onChange={(e) => setService(prev => ({...prev, photo_gallery: e.target.value.split('\n')}))} rows="3" className="w-full"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label htmlFor="service-capacity-min" className="block mb-1 text-sm font-medium text-gray-700">Min. Capacity</label>
                      <input type="number" id="service-capacity-min" name="capacity.min" value={service.capacity?.min || 1} onChange={(e) => setService(prev => ({...prev, capacity: {...prev.capacity, min: e.target.value}}))} className="w-full" min="1" />
                  </div>
                  <div>
                      <label htmlFor="service-capacity-max" className="block mb-1 text-sm font-medium text-gray-700">Max. Capacity</label>
                      <input type="number" id="service-capacity-max" name="capacity.max" value={service.capacity?.max || 10} onChange={(e) => setService(prev => ({...prev, capacity: {...prev.capacity, max: e.target.value}}))} className="w-full" min="1" />
                  </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t">
            <h4 className="text-lg font-medium mb-2">Pricing Model</h4>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center">
                <input type="radio" name="pricing-type" value="fixed" checked={service.pricing_rules.type === 'fixed'} onChange={handlePricingTypeChange} />
                <span className="ml-2">Fixed Price</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="pricing-type" value="tiered" checked={service.pricing_rules.type === 'tiered'} onChange={handlePricingTypeChange} />
                <span className="ml-2">Tiered Pricing</span>
              </label>
            </div>

            {service.pricing_rules.type === 'fixed' ? (
              <div id="pricing-fields-fixed">
                <label htmlFor="service-base-price" className="block mb-1 text-sm font-medium text-gray-700">Price (€)</label>
                <input type="number" id="service-base-price" name="pricing_rules.price" value={service.pricing_rules.price} onChange={(e) => setService(prev => ({...prev, pricing_rules: {...prev.pricing_rules, price: e.target.value}}))} className="w-full" step="0.01" />
              </div>
            ) : (
              <div id="pricing-fields-tour" className="space-y-2">
                <p className="text-sm text-gray-600">Define pricing tiers (e.g., for different group sizes or types like Adult/Child).</p>
                <div id="pricing-tiers-container">
                  {service.pricing_rules.tiers.map((tier, index) => (
                    <div key={index} className="grid grid-cols-3 gap-2 items-center mb-2">
                      <input type="text" placeholder="Tier Name (e.g., Adult)" value={tier.name} onChange={(e) => handleTierChange(index, 'name', e.target.value)} required className="pricing-tier-name" />
                      <input type="number" placeholder="Price" value={tier.price} onChange={(e) => handleTierChange(index, 'price', e.target.value)} step="0.01" required className="pricing-tier-price" />
                      <button type="button" onClick={() => removeTier(index)} className="btn btn-danger text-sm py-1 px-2">- Remove</button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addTier} className="btn btn-secondary text-sm">Add Tier</button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Save Service</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceModal;
