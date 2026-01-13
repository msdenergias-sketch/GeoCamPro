
import React, { useState, useEffect, useMemo } from 'react';
import { AppSettings, PhotoRecord } from '../types';
import { Folder, Hash, Type, Camera, Check, History, Plus, X } from 'lucide-react';

interface SetupScreenProps {
  onStart: (settings: AppSettings) => void;
  initialSettings: AppSettings;
  existingPhotos: PhotoRecord[];
  onDeleteFolder: (name: string) => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ onStart, initialSettings, existingPhotos, onDeleteFolder }) => {
  const [settings, setSettings] = useState<AppSettings>(initialSettings);

  // Extrair lista de pastas únicas já utilizadas
  const recentFolders = useMemo(() => {
    const folders: string[] = Array.from(new Set(existingPhotos.map(p => p.folderName)));
    return folders.sort((a, b) => a.localeCompare(b));
  }, [existingPhotos]);

  // Efeito para continuidade automática: sempre que o nome da pasta muda
  useEffect(() => {
    const currentFolder = settings.folderName.trim();
    if (!currentFolder) return;

    const folderPhotos = existingPhotos.filter(
      p => p.folderName.trim().toLowerCase() === currentFolder.toLowerCase()
    );

    if (folderPhotos.length > 0) {
      const maxIdx = Math.max(...folderPhotos.map(p => p.index));
      // Se a pasta existe, sugere o próximo número
      setSettings(prev => ({ ...prev, startIndex: maxIdx + 1 }));
    } else {
      // Se for uma pasta nova, reseta para 1 ou mantém o que o usuário digitar
      setSettings(prev => ({ ...prev, startIndex: 1 }));
    }
  }, [settings.folderName, existingPhotos]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings.folderName.trim()) {
      alert("Por favor, insira um nome para a pasta.");
      return;
    }
    onStart(settings);
  };

  const selectFolder = (name: string) => {
    setSettings(prev => ({ ...prev, folderName: name }));
  };

  const handleDeleteFolder = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    if (confirm(`Excluir permanentemente a pasta "${name}" e todos os seus registros?`)) {
      onDeleteFolder(name);
    }
  };

  return (
    <div className="h-full flex flex-col p-5 bg-[#0a0f0e] overflow-y-auto pb-24">
      {/* Header Profissional */}
      <div className="mt-6 mb-8 flex flex-col items-center text-center">
        <div className="w-14 h-14 bg-[#141a18] rounded-2xl flex items-center justify-center shadow-lg border border-emerald-500/20 mb-3">
          <Camera size={28} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" strokeWidth={2.5} />
        </div>
        <h1 className="text-xl font-black text-white tracking-tight">GeoCam Pro</h1>
        <p className="text-emerald-500/40 text-[8px] font-black uppercase tracking-[0.4em] mt-1">SISTEMA DE GESTÃO DE CAMPO</p>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6">
        {/* Seção de Pasta */}
        <div className="space-y-3">
          <div className="bg-[#141a18] p-4 rounded-2xl border border-emerald-900/20 shadow-inner">
            <div className="flex justify-between items-center mb-3">
              <label className="text-[9px] font-black text-emerald-400/80 uppercase tracking-[0.2em] flex items-center gap-2">
                <Folder size={14} className="text-emerald-500" /> NOME DA PASTA
              </label>
              <Plus size={12} className="text-emerald-500/40" />
            </div>
            <input 
              type="text"
              value={settings.folderName}
              onChange={e => setSettings({...settings, folderName: e.target.value})}
              className="w-full bg-black/40 border-b-2 border-emerald-500/30 py-2 focus:outline-none focus:border-emerald-400 transition-all font-bold text-base text-white"
              placeholder="Digite ou escolha abaixo..."
            />
          </div>

          {/* Navegação entre pastas existentes com opção de exclusão */}
          {recentFolders.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <History size={10} className="text-emerald-500/50" />
                <span className="text-[8px] font-black text-emerald-500/40 uppercase tracking-widest">Pastas Recentes (Navegar / Excluir)</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {recentFolders.map(folder => (
                  <div key={folder} className="relative flex-shrink-0 group">
                    <button
                      key={folder}
                      type="button"
                      onClick={() => selectFolder(folder)}
                      className={`whitespace-nowrap pl-4 pr-8 py-2 rounded-xl text-[10px] font-black border transition-all active:scale-95 ${
                        settings.folderName === folder 
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.2)]' 
                        : 'bg-[#141a18] border-emerald-900/30 text-neutral-500'
                      }`}
                    >
                      {folder}
                    </button>
                    <button 
                      type="button"
                      onClick={(e) => handleDeleteFolder(e, folder)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-red-500/40 hover:text-red-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Configurações de Sequência */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#141a18] p-4 rounded-2xl border border-emerald-900/20">
            <label className="text-[9px] font-black text-emerald-400/80 uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
              <Type size={14} className="text-emerald-500" /> PREFIXO
            </label>
            <input 
              type="text"
              value={settings.prefix}
              onChange={e => setSettings({...settings, prefix: e.target.value})}
              className="w-full bg-transparent border-b border-emerald-500/20 py-1 focus:outline-none focus:border-emerald-400 font-bold text-white text-sm"
            />
          </div>

          <div className="bg-[#141a18] p-4 rounded-2xl border border-emerald-900/20 relative overflow-hidden">
            <div className="absolute top-2 right-2 flex gap-1">
              <div className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
              <div className="w-1 h-1 rounded-full bg-emerald-400" />
            </div>
            <label className="text-[9px] font-black text-emerald-400/80 uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
              <Hash size={14} className="text-emerald-500" /> SEQUÊNCIA
            </label>
            <input 
              type="number"
              value={settings.startIndex}
              onChange={e => setSettings({...settings, startIndex: parseInt(e.target.value) || 1})}
              className="w-full bg-transparent border-b border-emerald-500/20 py-1 focus:outline-none focus:border-emerald-400 font-black text-emerald-400 text-sm"
            />
          </div>
        </div>

        {/* Toggle Overlay */}
        <div className="flex items-center justify-between p-4 bg-[#141a18] rounded-2xl border border-emerald-900/20 shadow-inner">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white">MARCA D'ÁGUA</span>
            <span className="text-[7px] text-emerald-500/40 font-bold uppercase">GPS + Data + Hora</span>
          </div>
          <button 
            type="button"
            onClick={() => setSettings({...settings, showOverlay: !settings.showOverlay})}
            className={`w-9 h-5 rounded-full transition-all relative ${settings.showOverlay ? 'bg-emerald-500' : 'bg-black/40'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform shadow-md ${settings.showOverlay ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Botão Principal */}
        <button 
          type="submit"
          className="mt-auto w-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all text-white font-black py-4 rounded-xl shadow-xl shadow-emerald-900/10 flex items-center justify-center gap-3 tracking-[0.3em] text-[10px] border-b-[4px] border-emerald-800"
        >
          INICIAR TRABALHO <Check size={16} strokeWidth={3} />
        </button>
      </form>
    </div>
  );
};

export default SetupScreen;
