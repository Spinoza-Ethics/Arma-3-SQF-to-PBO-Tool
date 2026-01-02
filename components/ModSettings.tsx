
import React from 'react';
import { Settings2, Tag, User, Hash, Info, AlertCircle } from 'lucide-react';
import { ModConfig } from '../types';

interface Props {
  config: ModConfig;
  onConfigChange: (config: ModConfig) => void;
}

const ModSettings: React.FC<Props> = ({ config, onConfigChange }) => {
  const update = (key: keyof ModConfig, value: string) => {
    onConfigChange({ ...config, [key]: value });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Settings2 className="text-purple-400" />
        Mod Configuration
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1">
            <Tag size={12} /> Mod Name
          </label>
          <input 
            type="text" 
            value={config.name}
            onChange={(e) => update('name', e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 focus:border-purple-500 outline-none"
            placeholder="My Awesome Mod"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1">
            <Hash size={12} /> Prefix / Tag
          </label>
          <input 
            type="text" 
            value={config.tag}
            onChange={(e) => update('tag', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 focus:border-purple-500 outline-none"
            placeholder="MAM"
          />
          <p className="text-[10px] text-zinc-600 flex items-center gap-1">
            <AlertCircle size={10} /> Letters/Numbers only. No hyphens or spaces.
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1">
            <User size={12} /> Author
          </label>
          <input 
            type="text" 
            value={config.author}
            onChange={(e) => update('author', e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 focus:border-purple-500 outline-none"
            placeholder="Your Name"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1">
            <Info size={12} /> Version
          </label>
          <input 
            type="text" 
            value={config.version}
            onChange={(e) => update('version', e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 focus:border-purple-500 outline-none"
            placeholder="1.0.0"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1">
          Description
        </label>
        <textarea 
          value={config.description}
          onChange={(e) => update('description', e.target.value)}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 h-24 focus:border-purple-500 outline-none resize-none"
          placeholder="What does this mod do?"
        />
      </div>
    </div>
  );
};

export default ModSettings;
