
import React, { useState } from 'react';
import { Package, Terminal, Github, ExternalLink, CheckCircle2, Loader2, FolderOpen, Zap, Cpu } from 'lucide-react';
import JSZip from 'jszip';
import { ModConfig, SQFFile } from './types';
import FileUploader from './components/FileUploader';
import ModSettings from './components/ModSettings';
import { generateConfigCPP } from './utils/generator';
import { generateModMetadata } from './services/geminiService';
import { createPBO, PBOFile } from './utils/pbo';

const App: React.FC = () => {
  const [files, setFiles] = useState<SQFFile[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [config, setConfig] = useState<ModConfig>({
    name: 'My Custom Mod',
    tag: 'MCM',
    author: 'Developer',
    version: '1.0.0',
    description: 'Generated with Arma 3 Mod Architect'
  });

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // Sanitizing names for Arma 3 compatibility
  // 1. Remove non-alphanumeric (except underscore)
  // 2. Collapse underscores
  // 3. Ensure no starting digit
  const sanitize = (str: string) => {
    let s = str.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    if (!s) s = 'mod';
    if (/^[0-9]/.test(s)) s = 'mod_' + s;
    return s;
  };

  const internalAddonName = sanitize(config.name);
  const modFolderName = `@${config.name.replace(/[^a-zA-Z0-9]/g, '_')}`;

  const handleGenerate = async () => {
    if (files.length === 0) {
      alert("Please add some SQF files first!");
      return;
    }

    setIsGenerating(true);
    
    try {
      const analysis = await generateModMetadata(files, config);
      setAiAnalysis(analysis);

      // Virtual File System for PBO
      const pboFiles: PBOFile[] = [];
      
      // Pass the fully sanitized internalAddonName to the generator so config.cpp matches the PBO prefix exactly
      const configCPP = generateConfigCPP(config, files, internalAddonName);
      
      // Add UTF-8 BOM (\uFEFF) to config.cpp to ensure Arma reads it correctly as UTF-8
      pboFiles.push({ name: "config.cpp", content: '\uFEFF' + configCPP });
      
      // $PBOPREFIX$ file is also required by some loaders
      pboFiles.push({ name: "$PBOPREFIX$", content: internalAddonName });

      // All scripts auto-run at mission start via postInit = 1
      files.forEach(f => {
        if (f.functionName) {
          // CfgFunctions expects fn_ prefix by convention
          pboFiles.push({ name: `functions/fn_${f.functionName}.sqf`, content: f.content });
        }
      });

      // Pack the PBO directly in the browser!
      const pboBinary = await createPBO(pboFiles, internalAddonName);

      // Create ZIP for download
      const zip = new JSZip();
      const root = zip.folder(modFolderName);
      if (!root) return;
      
      const addons = root.folder("addons");
      if (!addons) return;

      // Put the finished PBO in the addons folder
      addons.file(`${internalAddonName}.pbo`, pboBinary);
      
      root.file("README.md", `# ${config.name}\n\nAuthor: ${config.author}\nVersion: ${config.version}\n\n${config.description}\n\n## AI Analysis\n${analysis}`);

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${modFolderName}.zip`;
      link.click();
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error(error);
      alert("Something went wrong during generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 text-center md:text-left">
        <div className="flex-1">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
              <Package size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-black tracking-tight bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              MOD ARCHITECT
            </h1>
          </div>
          <p className="text-zinc-400 max-w-xl">
            Auto-generate and pack <span className="text-blue-400 font-bold">.pbo</span> files directly in your browser. 
            No Windows tools, no command line, no frustration.
          </p>
        </div>
        
        <div className="flex flex-col items-center md:items-end gap-2">
           <button 
            disabled={isGenerating}
            onClick={handleGenerate}
            className="group relative flex items-center gap-2 bg-white text-black px-10 py-4 rounded-2xl font-black hover:bg-blue-50 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 shadow-xl shadow-white/5"
          >
            {isGenerating ? (
              <Loader2 className="animate-spin text-blue-600" size={24} />
            ) : (
              <Zap className="text-blue-600 fill-blue-600" size={24} />
            )}
            {isGenerating ? 'PACKING PBO...' : 'GENERATE & PACK MOD'}
          </button>
          <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">Standalone PBO Packing Included</span>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-8">
          <section className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-md shadow-inner">
            <ModSettings config={config} onConfigChange={setConfig} />
          </section>

          <section className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 backdrop-blur-md shadow-inner">
            <FileUploader files={files} onFilesChange={setFiles} />
          </section>
        </div>

        <div className="lg:col-span-5 space-y-8">
          <section className="bg-blue-600/10 border border-blue-500/30 rounded-3xl p-8 space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform">
               <Cpu size={120} />
            </div>
            
            <h3 className="font-black text-xl flex items-center gap-2 text-blue-300">
              <CheckCircle2 size={24} className="text-blue-400" /> Mac & PC Friendly
            </h3>
            
            <div className="space-y-6 text-sm text-zinc-300 relative z-10">
              <p className="leading-relaxed">
                The hardest part of modding is packing the files. This app uses a <b>built-in PBO engine</b> to do the work for you.
              </p>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-xl bg-blue-600/30 text-blue-300 flex-shrink-0 flex items-center justify-center font-black">1</div>
                  <p><b>Download:</b> You'll get a ZIP containing the <b>{modFolderName}</b> folder.</p>
                </div>
                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-xl bg-blue-600/30 text-blue-300 flex-shrink-0 flex items-center justify-center font-black">2</div>
                  <p><b>Extract:</b> Unzip it anywhere (e.g., your Desktop).</p>
                </div>
                <div className="flex gap-4">
                  <div className="h-8 w-8 rounded-xl bg-blue-600/30 text-blue-300 flex-shrink-0 flex items-center justify-center font-black">3</div>
                  <div className="space-y-2">
                    <p><b>Load:</b> Open Arma 3 Launcher → <b>Mods</b> → <b>+ Local Mod</b>.</p>
                    <div className="flex items-center gap-3 p-3 bg-zinc-950/80 border border-blue-500/30 rounded-xl text-blue-200 shadow-xl">
                       <FolderOpen size={20} className="text-blue-400" />
                       <span className="font-mono">Select <b>{modFolderName}</b></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-2">
                <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Internal structure auto-created:</p>
                <div className="font-mono text-[10px] space-y-1 text-zinc-400 opacity-80">
                  <div>{modFolderName}/</div>
                  <div className="pl-4">addons/</div>
                  <div className="pl-8 text-blue-400">{internalAddonName}.pbo (The magic file)</div>
                </div>
              </div>
            </div>
          </section>

          {aiAnalysis && (
            <section className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-8 space-y-4">
               <h3 className="font-bold flex items-center gap-2 text-zinc-200">
                <Terminal size={20} className="text-purple-400" /> Readme Insight
              </h3>
              <div className="text-xs font-mono text-zinc-400 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap scrollbar-hide">
                {aiAnalysis}
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="mt-20 py-12 border-t border-zinc-900 flex flex-col items-center gap-6">
        <div className="flex items-center gap-8 text-zinc-500">
          <a href="#" className="hover:text-blue-400 transition flex items-center gap-2 text-sm">
            <Github size={18} /> Source Code
          </a>
          <a href="https://community.bistudio.com/wiki/PBO_File_Format" target="_blank" className="hover:text-blue-400 transition flex items-center gap-2 text-sm">
            <ExternalLink size={18} /> PBO Spec
          </a>
        </div>
        <p className="text-zinc-600 text-xs tracking-widest uppercase font-bold">
          Zero-Tool Arma 3 Modding &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};

export default App;
