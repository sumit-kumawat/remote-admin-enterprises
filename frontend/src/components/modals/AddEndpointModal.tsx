import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../common/Modal';
import { useCreateEndpoint } from '../../hooks/useEndpoints';

const schema = z.object({
  hostname: z.string().min(1, 'Hostname is required').max(255, 'Hostname too long'),
  fqdn: z.string().optional(),
  ipAddress: z.string().optional(),
  macAddress: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface AddEndpointModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddEndpointModal: React.FC<AddEndpointModalProps> = ({ isOpen, onClose }) => {
  const createMutation = useCreateEndpoint();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      hostname: '',
      fqdn: '',
      ipAddress: '',
      macAddress: '',
      description: '',
      location: '',
    },
  });

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(
      {
        hostname: data.hostname,
        fqdn: data.fqdn || null,
        ipAddress: data.ipAddress || null,
        macAddress: data.macAddress || null,
        description: data.description || null,
        location: data.location || null,
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      }
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Endpoint" subtitle="Manually register a Windows endpoint in management inventory" maxWidth="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Hostname or IP Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              {...register('hostname')}
              placeholder="e.g. WORKSTATION-01 or 192.168.1.105"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
            />
            {errors.hostname && <p className="text-xs text-rose-600 mt-0.5">{errors.hostname.message}</p>}
            <p className="text-[11px] text-slate-500 mt-1">If a hostname is entered, DNS resolution will resolve the IP automatically.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">FQDN (Optional)</label>
            <input
              type="text"
              {...register('fqdn')}
              placeholder="e.g. ws01.corp.enterprise.local"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">MAC Address (Optional)</label>
            <input
              type="text"
              {...register('macAddress')}
              placeholder="e.g. 00:15:5D:01:22:45"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
            <input
              type="text"
              {...register('location')}
              placeholder="e.g. Building A - Floor 3"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
            <input
              type="text"
              {...register('description')}
              placeholder="e.g. Executive Laptop"
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-[#2F3EA0]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-3 py-1.5 text-xs font-medium text-white bg-[#2F3EA0] hover:bg-[#263385] rounded transition-colors disabled:opacity-50"
          >
            {createMutation.isPending ? 'Registering...' : 'Register Endpoint'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
