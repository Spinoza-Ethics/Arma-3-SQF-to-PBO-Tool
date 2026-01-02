import React from 'react';
import { FileText, X, Plus, Zap } from 'lucide-react';
import { SQFFile } from '../types';

interface Props {
  files: SQFFile[];
  onFilesChange: (files: SQFFile[]) => void;
}

const FileUploader: React.FC<Props> = ({ files, onFilesChange }) => {
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (!uploaded) return;

    const newFiles: SQFFile[] = [];
    for (let i = 0; i < uploaded.length; i++) {
      const file = uploaded[i];
      const text = await file.text();
      // Extract clean function name from filename
      const baseName = file.name.replace(/\.sqf$/i, '').replace(/[^a-zA-Z0-9_]/g, '_');
      newFiles.push({
        name: file.name,
        content: text,
        type: 'function',
        functionName: baseName
      });
    }
    onFilesChange([...files, ...newFiles]);
    
    // Reset the input to allow re-selecting the same file with fresh content
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    const next = [...files];
    next.splice(index, 1);
    onFilesChange(next);
  };

  const updateFunctionName = (index: number, name: string) => {
    const next = [...files];
    next[index].functionName = name.replace(/[^a-zA-Z0-9_]/g, '');
    onFilesChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FileText className="text-blue-400" />
          Scripts (SQF)
        </h2>
        <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm font-medium">
          <Plus size={18} />
          Add Scripts
          <input type="file" multiple accept=".sqf" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>

      <div className="text-xs text-zinc-400 bg-green-500/10 border border-green-500/20 p-3 rounded-lg flex items-center gap-2">
        <Zap size={14} className="text-green-400" />
        All scripts auto-run at mission start
      </div>

      <div className="grid gap-3">
        {files.length === 0 && (
          <div className="border-2 border-dashed border-zinc-800 rounded-xl p-12 text-center text-zinc-500 italic">
            No scripts added yet. Upload .sqf files to begin.
          </div>
        )}
        {files.map((file, idx) => (
          <div key={idx} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4 group">
            <div className="p-2 bg-zinc-800 rounded">
              <FileText size={16} className="text-zinc-400" />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="font-mono text-sm text-zinc-400 truncate">{file.name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-zinc-500">Script ID:</span>
                <input 
                  type="text" 
                  value={file.functionName || ''}
                  onChange={(e) => updateFunctionName(idx, e.target.value)}
                  className="bg-zinc-800 text-xs px-2 py-1 rounded border border-zinc-700 outline-none focus:border-blue-500 font-mono text-blue-300 w-40"
                />
              </div>
            </div>

            <button 
              onClick={() => removeFile(idx)}
              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded transition"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileUploader;
