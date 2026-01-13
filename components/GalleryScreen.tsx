
import React, { useState, useMemo, useEffect } from 'react';
import { PhotoRecord } from '../types';
import { Trash2, Download, ExternalLink, Calendar, MapPin, X, FolderOpen, ChevronDown, MessageCircle, Usb, AlertTriangle } from 'lucide-react';

interface GalleryScreenProps {
  photos: PhotoRecord[];
  onDelete: (id: string) => void;
  onDeleteFolder: (folderName: string) => void;
  currentFolder: string;
}

const GalleryScreen: React.FC<GalleryScreenProps> = ({ photos, onDelete, onDeleteFolder, currentFolder }) => {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoRecord | null>(null);
  const [activeFolder, setActiveFolder] = useState<string>(currentFolder);
  const [showFolderPicker, setShowFolderPicker] = useState(false);

  const folders = useMemo(() => {
    const uniqueFolders = Array.from(new Set(photos.map(p => p.folderName)));
    if (!uniqueFolders.includes(currentFolder)) {
      uniqueFolders.push(currentFolder);
    }
    return uniqueFolders.sort();
  }, [photos, currentFolder]);

  // Se a pasta ativa sumir (foi excluída), volta para a pasta atual ou a primeira disponível
  useEffect(() => {
    if (!folders.includes(activeFolder)) {
      setActiveFolder(folders[0] || currentFolder);
    }
  }, [folders, activeFolder, currentFolder]);

  const filteredPhotos = useMemo(() => {
    return photos.filter(p => p.folderName === activeFolder);
  }, [photos, activeFolder]);

  const exportViaUSB = () => {
    if (filteredPhotos.length === 0) return;
    alert("Iniciando exportação em lote via USB.");
    filteredPhotos.forEach((photo, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = photo.dataUrl;
        link.download = photo.filename;
        link.click();
      }, index * 350);
    });
  };

  const sharePhoto = async (photo: PhotoRecord) => {
    try {
      const response = await fetch(photo.dataUrl);
      const blob = await response.blob();
      const file = new File([blob], photo.filename, { type: blob.type });

      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: 'Registro GeoCam Pro',
          text: `Registro #${photo.index.toString().padStart(3, '0')} - Local: ${photo.address}`,
        });
      } else {
        alert("WhatsApp/Compartilhamento não disponível neste navegador.");
      }
    } catch (err) {
      console.error("Erro ao compartilhar:", err);
    }
  };

  const openInGoogleMaps = (photo: PhotoRecord) => {
    const url = `https://www.google.com/maps?q=${photo.coords.latitude},${photo.coords.longitude}`;
    window.open(url, '_blank');
  };

  const handleDelete = (id: string) => {
    if (confirm('Excluir este registro permanentemente?')) {
      onDelete(id);
      setSelectedPhoto(null);
    }
  };

  const handleDeleteFolder = () => {
    const count = filteredPhotos.length;
    if (confirm(`ATENÇÃO: Deseja excluir permanentemente a pasta "${activeFolder}" e todas as suas ${count} fotos? Esta ação não pode ser desfeita.`)) {
      onDeleteFolder(activeFolder);
      setShowFolderPicker(false);
    }
  };

  return (
    <div className="h-full bg-[#0a0f0e] flex flex-col">
      <header className="p-4 flex flex-col gap-2 bg-[#141a18]/95 backdrop-blur-xl sticky top-0 z-30 border-b border-emerald-900/10 shadow-lg">
        <div className="flex justify-between items-center">
          <div 
            className="flex items-center gap-3 cursor-pointer active:opacity-60 overflow-hidden"
            onClick={() => setShowFolderPicker(!showFolderPicker)}
          >
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl flex-shrink-0">
              <FolderOpen size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-black tracking-tight text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.2)] truncate">{activeFolder}</h2>
                <ChevronDown size={14} className={`text-emerald-500 flex-shrink-0 transition-transform ${showFolderPicker ? 'rotate-180' : ''}`} />
              </div>
              <p className="text-[9px] text-emerald-500/60 font-black uppercase tracking-[0.2em]">
                {filteredPhotos.length} Itens
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={exportViaUSB}
              className="bg-[#1e2623] hover:bg-[#252e2b] text-emerald-400 h-10 px-3 rounded-lg flex items-center gap-2 border border-emerald-900/30 text-[9px] font-black tracking-widest transition-all active:scale-95"
            >
              <Usb size={14} /> <span className="hidden xs:inline">EXPORTAR</span>
            </button>
            <button 
              onClick={handleDeleteFolder}
              title="Excluir Pasta"
              className="bg-red-950/20 text-red-500 h-10 w-10 flex items-center justify-center rounded-lg border border-red-900/20 active:scale-90 transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {showFolderPicker && (
          <div className="mt-2 bg-[#141a18] border border-emerald-900/30 rounded-xl overflow-hidden shadow-2xl animate-in slide-in-from-top-2 border-l-4 border-l-emerald-500">
            <p className="px-4 py-2 text-[8px] font-black text-emerald-500/50 uppercase tracking-[0.2em] border-b border-emerald-900/10">Pastas Disponíveis</p>
            <div className="max-h-[30vh] overflow-y-auto">
              {folders.map(folder => (
                <button
                  key={folder}
                  onClick={() => {
                    setActiveFolder(folder);
                    setShowFolderPicker(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm font-black flex items-center justify-between hover:bg-emerald-950/40 border-b border-emerald-900/5 last:border-0 ${activeFolder === folder ? 'text-emerald-400 bg-emerald-500/5' : 'text-neutral-500'}`}
                >
                  <span className="truncate pr-4">{folder}</span>
                  {activeFolder === folder && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-24 no-scrollbar">
        {filteredPhotos.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 text-center px-8">
            <div className="w-16 h-16 bg-emerald-900/20 rounded-full flex items-center justify-center mb-4">
               <FolderOpen size={32} className="text-emerald-900" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2">Pasta Vazia</p>
            <p className="text-[8px] text-neutral-500 uppercase tracking-widest leading-relaxed">Os registros realizados nesta pasta aparecerão aqui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 xs:grid-cols-3 gap-3">
            {filteredPhotos.map((photo) => (
              <div 
                key={photo.id} 
                className="group relative aspect-square bg-[#141a18] rounded-xl overflow-hidden border border-emerald-900/10 cursor-pointer active:scale-95 transition-all shadow-md"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img src={photo.dataUrl} alt={photo.filename} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute top-2 left-2 bg-emerald-500/90 backdrop-blur-md text-[#0a0f0e] text-[9px] px-2 py-0.5 rounded-full font-black shadow-sm">
                  #{photo.index.toString().padStart(3, '0')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 z-[100] bg-[#0a0f0e] flex flex-col animate-in fade-in zoom-in-98 duration-200">
          <header className="p-4 flex justify-between items-center bg-[#141a18]/95 backdrop-blur-md border-b border-emerald-900/20">
            <button 
              onClick={() => setSelectedPhoto(null)} 
              className="p-2 bg-[#1e2623] rounded-lg text-neutral-300 active:scale-90 transition-all"
            >
              <X size={20} />
            </button>
            <div className="text-center overflow-hidden px-4">
              <h3 className="text-xs font-black text-white truncate">{selectedPhoto.filename}</h3>
              <p className="text-[9px] text-emerald-500/60 font-black uppercase tracking-widest truncate">{selectedPhoto.folderName}</p>
            </div>
            <button 
              onClick={() => handleDelete(selectedPhoto.id)}
              className="p-2 bg-red-950/20 text-red-500 rounded-lg active:scale-90 transition-all"
            >
              <Trash2 size={20} />
            </button>
          </header>

          <div className="flex-1 overflow-hidden p-4 flex items-center justify-center">
            <div className="relative group">
              <img src={selectedPhoto.dataUrl} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-emerald-900/10" alt="Detail" />
            </div>
          </div>

          <footer className="p-6 bg-[#141a18] border-t border-emerald-900/30 space-y-4 rounded-t-[32px] shadow-[0_-10px_30px_rgba(0,0,0,0.6)]">
            <div className="flex items-start gap-4 bg-black/40 p-4 rounded-2xl border border-emerald-900/10">
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
                <MapPin size={18} />
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-xs font-black text-white leading-tight mb-1 truncate">
                  {selectedPhoto.address || 'Localização de Campo'}
                </p>
                <p className="text-[10px] font-mono font-bold text-emerald-500/50">
                  {selectedPhoto.coords.latitude.toFixed(6)}, {selectedPhoto.coords.longitude.toFixed(6)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => openInGoogleMaps(selectedPhoto)}
                className="bg-[#1e2623] hover:bg-[#252e2b] text-white font-black text-[9px] h-12 rounded-xl flex items-center justify-center gap-2 border border-emerald-900/10 transition-all active:scale-95 tracking-widest shadow-md"
              >
                <div className="text-emerald-400"><ExternalLink size={16} /></div>
                MAPS
              </button>
              
              <button 
                onClick={() => sharePhoto(selectedPhoto)}
                className="bg-[#1e2623] hover:bg-[#252e2b] text-emerald-400 font-black text-[9px] h-12 rounded-xl flex items-center justify-center gap-2 border border-emerald-900/10 transition-all active:scale-95 tracking-widest shadow-md"
              >
                <MessageCircle size={16} />
                COMPARTILHAR
              </button>
            </div>

            <button 
              onClick={() => {
                const link = document.createElement('a');
                link.href = selectedPhoto.dataUrl;
                link.download = selectedPhoto.filename;
                link.click();
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black h-14 rounded-xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all text-[10px] tracking-[0.25em] border-b-4 border-emerald-800"
            >
              <Download size={20} /> SALVAR NO DISPOSITIVO
            </button>
          </footer>
        </div>
      )}
    </div>
  );
};

export default GalleryScreen;
