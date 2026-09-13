import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useImportEndpointsFile } from '../../hooks/useEndpoints';
import { FileUp, FileText } from 'lucide-react';

interface ImportEndpointsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportEndpointsModal: React.FC<ImportEndpointsModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const importMutation = useImportEndpointsFile();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    importMutation.mutate(formData, {
      onSuccess: () => {
        setSelectedFile(null);
        onClose();
      },
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Endpoint Inventory (.txt / .csv)">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-sans">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800">Supported File Format:</p>
          <p>Plain text (.txt) or CSV (.csv) containing <strong>one Hostname or IP address per line</strong>.</p>
          <p className="text-[11px] text-slate-500 font-mono">Example: server01.corp.local or 10.10.10.25</p>
        </div>

        <div className="border-2 border-dashed border-slate-300 hover:border-[#0F6CBD] rounded-lg p-6 text-center bg-slate-50/50 transition-colors">
          <input
            type="file"
            id="endpoint-file-input"
            accept=".txt,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="endpoint-file-input" className="cursor-pointer flex flex-col items-center gap-2">
            <FileUp className="h-8 w-8 text-[#0F6CBD]" />
            <span className="font-semibold text-slate-800 text-xs">
              {selectedFile ? selectedFile.name : 'Click to select .txt or .csv file'}
            </span>
            <span className="text-[11px] text-slate-400">Hostnames will be automatically resolved to IP addresses</span>
          </label>
        </div>

        {selectedFile && (
          <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded text-blue-800 text-xs font-medium">
            <FileText className="h-4 w-4" />
            <span>Ready to import: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 border border-slate-300 rounded font-medium text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!selectedFile || importMutation.isPending}
            className="px-4 py-1.5 font-semibold text-white bg-[#0F6CBD] hover:bg-[#005a9e] rounded transition-colors disabled:opacity-50"
          >
            {importMutation.isPending ? 'Importing & Resolving IPs...' : 'Import Endpoints'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
