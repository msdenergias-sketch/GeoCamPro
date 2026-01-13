
import React, { useState, useEffect } from 'react';
import { AppSettings, PhotoRecord, AppState } from './types';
import SetupScreen from './components/SetupScreen';
import CameraScreen from './components/CameraScreen';
import GalleryScreen from './components/GalleryScreen';
import { Settings, Image as ImageIcon, Camera } from 'lucide-react';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppState>(AppState.SETUP);
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('geocam_settings');
    return saved ? JSON.parse(saved) : {
      folderName: 'Trabalho_01',
      prefix: 'IMG',
      startIndex: 1,
      format: 'JPEG',
      showOverlay: true
    };
  });
  
  const [photos, setPhotos] = useState<PhotoRecord[]>(() => {
    const saved = localStorage.getItem('geocam_photos');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentIndex, setCurrentIndex] = useState(1);

  useEffect(() => {
    localStorage.setItem('geocam_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('geocam_photos', JSON.stringify(photos));
  }, [photos]);

  const handleStart = (newSettings: AppSettings) => {
    setSettings(newSettings);
    // Validação final da sequência antes de iniciar a câmera
    const folderPhotos = photos.filter(p => p.folderName === newSettings.folderName);
    const lastIndex = folderPhotos.length > 0 
      ? Math.max(...folderPhotos.map(p => p.index)) 
      : newSettings.startIndex - 1;
    
    setCurrentIndex(lastIndex + 1);
    setCurrentStep(AppState.CAMERA);
  };

  const handleCapture = (photo: PhotoRecord) => {
    const photoWithFolder = { ...photo, folderName: settings.folderName };
    setPhotos(prev => [photoWithFolder, ...prev]);
    setCurrentIndex(prev => prev + 1);
  };

  const deletePhoto = (id: string) => {
    setPhotos(prev => {
      const updated = prev.filter(p => p.id !== id);
      return updated;
    });
  };

  const deleteFolder = (folderName: string) => {
    setPhotos(prev => {
      const updated = prev.filter(p => p.folderName !== folderName);
      return updated;
    });
    // Se a pasta excluída for a atual, reseta o nome nas configurações
    if (settings.folderName === folderName) {
      setSettings(prev => ({ ...prev, folderName: '' }));
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0f0e] text-white overflow-hidden relative font-sans">
      {/* Content Area */}
      <main className="flex-1 overflow-hidden">
        {currentStep === AppState.SETUP && (
          <SetupScreen 
            onStart={handleStart} 
            initialSettings={settings} 
            existingPhotos={photos}
            onDeleteFolder={deleteFolder}
          />
        )}
        {currentStep === AppState.CAMERA && (
          <CameraScreen 
            settings={settings} 
            currentIndex={currentIndex} 
            onCapture={handleCapture} 
          />
        )}
        {currentStep === AppState.GALLERY && (
          <GalleryScreen 
            photos={photos} 
            onDelete={deletePhoto}
            onDeleteFolder={deleteFolder}
            currentFolder={settings.folderName} 
          />
        )}
      </main>

      {/* Navigation Bar - Compacta, Verde Acinzentada e Luminosa */}
      <nav className="h-[76px] bg-[#141a18] border-t border-emerald-900/30 flex items-center justify-around px-2 pb-safe z-[60] shadow-[0_-4px_20px_rgba(0,0,0,0.6)]">
        <button 
          onClick={() => setCurrentStep(AppState.SETUP)}
          className={`flex flex-col items-center justify-center w-16 h-full transition-all active:scale-90 ${currentStep === AppState.SETUP ? 'text-emerald-400' : 'text-neutral-500'}`}
        >
          <Settings size={20} strokeWidth={2.5} className={currentStep === AppState.SETUP ? 'drop-shadow-[0_0_5px_rgba(52,211,153,0.7)]' : ''} />
          <span className={`text-[9px] font-black uppercase tracking-[0.1em] mt-1 ${currentStep === AppState.SETUP ? 'text-white drop-shadow-[0_0_3px_rgba(255,255,255,0.8)]' : ''}`}>Ajustes</span>
        </button>
        
        <button 
          onClick={() => setCurrentStep(AppState.CAMERA)}
          className="flex flex-col items-center justify-center -mt-8 group"
        >
          <div className={`p-3.5 rounded-full shadow-2xl transition-all border-[5px] border-[#0a0f0e] ${currentStep === AppState.CAMERA ? 'bg-emerald-500 text-[#0a0f0e] scale-110 shadow-emerald-500/40' : 'bg-[#1e2623] text-neutral-400'}`}>
            <Camera size={26} strokeWidth={3} />
          </div>
          <span className={`text-[9px] font-black uppercase tracking-[0.2em] mt-1 ${currentStep === AppState.CAMERA ? 'text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'text-neutral-500'}`}>Câmera</span>
        </button>

        <button 
          onClick={() => setCurrentStep(AppState.GALLERY)}
          className={`flex flex-col items-center justify-center w-16 h-full transition-all active:scale-90 ${currentStep === AppState.GALLERY ? 'text-emerald-400' : 'text-neutral-500'}`}
        >
          <div className="relative">
             <ImageIcon size={20} strokeWidth={2.5} className={currentStep === AppState.GALLERY ? 'drop-shadow-[0_0_5px_rgba(52,211,153,0.7)]' : ''} />
             {photos.length > 0 && (
               <span className="absolute -top-1.5 -right-2.5 bg-emerald-500 text-[#0a0f0e] text-[8px] rounded-full min-w-[16px] h-4 flex items-center justify-center font-black px-1 border border-[#141a18] shadow-sm">
                 {photos.length}
               </span>
             )}
          </div>
          <span className={`text-[9px] font-black uppercase tracking-[0.1em] mt-1 ${currentStep === AppState.GALLERY ? 'text-white drop-shadow-[0_0_3px_rgba(255,255,255,0.8)]' : ''}`}>Galeria</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
