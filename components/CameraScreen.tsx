
import React, { useRef, useState, useEffect } from 'react';
import { AppSettings, PhotoRecord } from '../types';
import { MapPin, Hash, Loader2, AlertCircle, Camera as CameraIcon } from 'lucide-react';
import { getLocationDescription } from '../services/geminiService';

interface CameraScreenProps {
  settings: AppSettings;
  currentIndex: number;
  onCapture: (photo: PhotoRecord) => void;
}

const CameraScreen: React.FC<CameraScreenProps> = ({ settings, currentIndex, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [coords, setCoords] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    trackLocation();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      // Tenta forçar a câmera traseira
      const constraints = { 
        video: { 
          facingMode: { exact: 'environment' } 
        }, 
        audio: false 
      };
      
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e) {
        // Fallback se 'exact environment' falhar (alguns browsers desktop ou front-only)
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsReady(true);
      }
    } catch (err: any) {
      console.error("Camera error:", err);
      if (err.name === 'NotAllowedError') {
        setError("ACESSO NEGADO: Vá nas configurações do Chrome e permita a Câmera.");
      } else {
        setError("ERRO DE CÂMERA: Verifique se outra aba está usando a câmera.");
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const trackLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.watchPosition((pos) => {
        setCoords({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
      }, (err) => {
        console.error(err);
        if (err.code === 1) {
           setError("GPS NEGADO: Ative a localização nas configurações do seu celular.");
        }
      }, { enableHighAccuracy: true });
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;
    setIsCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Garante proporção correta no celular
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    let addr = "Buscando localização...";
    if (coords) {
      try {
        addr = await getLocationDescription(coords.latitude, coords.longitude);
      } catch (e) {
        addr = `Lat: ${coords.latitude.toFixed(4)}, Lng: ${coords.longitude.toFixed(4)}`;
      }
      setLocationName(addr);
    }

    if (settings.showOverlay) {
      const padding = 40;
      const fontSize = Math.max(20, canvas.width * 0.025);
      
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, canvas.height - (fontSize * 4.5) - (padding * 2), canvas.width, (fontSize * 4.5) + (padding * 2));

      ctx.fillStyle = '#10b981';
      ctx.font = `black ${fontSize * 1.2}px sans-serif`;
      const formattedNum = currentIndex.toString().padStart(3, '0');
      const filename = `${settings.prefix}_${formattedNum}`;
      ctx.fillText(`#${formattedNum}`, padding, canvas.height - (fontSize * 3.2) - padding);

      ctx.fillStyle = 'white';
      ctx.font = `bold ${fontSize * 0.9}px sans-serif`;
      ctx.fillText(filename, padding + (fontSize * 4), canvas.height - (fontSize * 3.2) - padding);
      
      ctx.font = `${fontSize * 0.75}px sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      const now = new Date().toLocaleString('pt-BR');
      ctx.fillText(`${now}`, padding, canvas.height - (fontSize * 2.1) - padding);
      
      if (coords) {
        ctx.fillStyle = '#34d399';
        ctx.fillText(`GPS: ${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`, padding, canvas.height - fontSize - padding);
        ctx.font = `italic ${fontSize * 0.7}px sans-serif`;
        ctx.fillStyle = 'white';
        ctx.fillText(addr, padding, canvas.height - padding);
      }
    }

    const dataUrl = canvas.toDataURL(`image/${settings.format.toLowerCase()}`);
    const formattedNum = currentIndex.toString().padStart(3, '0');
    
    const photo: PhotoRecord = {
      id: crypto.randomUUID(),
      dataUrl,
      timestamp: Date.now(),
      index: currentIndex,
      folderName: settings.folderName,
      coords: coords ? { ...coords } : { latitude: 0, longitude: 0 },
      address: addr,
      filename: `${settings.prefix}_${formattedNum}.${settings.format.toLowerCase()}`
    };

    onCapture(photo);
    setTimeout(() => setIsCapturing(false), 250);
  };

  if (error) {
    return (
      <div className="h-full w-full bg-[#0a0f0e] flex flex-col items-center justify-center p-8 text-center gap-6">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
          <AlertCircle size={40} className="text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-white font-black uppercase tracking-widest">Atenção Necessária</h2>
          <p className="text-neutral-400 text-xs font-bold leading-relaxed">{error}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-black text-[10px] tracking-[0.2em] shadow-lg shadow-emerald-900/20"
        >
          REENTRAR NO APP
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-[#0a0f0e] flex flex-col items-center justify-center">
      <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover transition-opacity duration-500 ${isReady ? 'opacity-100' : 'opacity-0'}`} />
      <canvas ref={canvasRef} className="hidden" />

      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none z-10">
        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2 border border-emerald-500/20 shadow-lg">
          <Hash size={14} className="text-emerald-400" />
          <span className="text-xs font-black tracking-widest text-white">#{currentIndex.toString().padStart(3, '0')}</span>
        </div>
        
        <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2 border border-emerald-500/20 shadow-lg">
          {coords ? (
            <>
              <MapPin size={14} className="text-emerald-400 animate-pulse" />
              <span className="text-[9px] font-mono font-bold text-emerald-100/70">{coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}</span>
            </>
          ) : (
            <>
              <Loader2 size={12} className="animate-spin text-neutral-500" />
              <span className="text-[9px] font-mono text-neutral-500">LOCALIZANDO...</span>
            </>
          )}
        </div>
      </div>

      <div className="absolute bottom-6 w-full flex flex-col items-center gap-4 z-20">
        {locationName && (
           <div className="bg-emerald-950/40 backdrop-blur-md px-4 py-2 rounded-xl border border-emerald-500/10 max-w-[85%] text-center shadow-xl">
              <p className="text-[10px] font-bold text-emerald-200 line-clamp-1 italic">{locationName}</p>
           </div>
        )}

        <button 
          onClick={capturePhoto}
          disabled={!isReady || isCapturing}
          className={`w-16 h-16 rounded-full border-[3px] flex items-center justify-center transition-all ${
            isCapturing ? 'scale-90 bg-white' : 'border-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/20 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
          }`}
        >
          <div className={`w-12 h-12 rounded-full border-2 border-[#0a0f0e]/10 ${isCapturing ? 'bg-transparent' : 'bg-white shadow-inner'}`} />
        </button>
      </div>

      {!isReady && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#0a0f0e] z-30">
          <div className="relative">
            <CameraIcon size={48} className="text-emerald-500/20" />
            <Loader2 size={48} className="animate-spin text-emerald-500 absolute inset-0" />
          </div>
          <div className="text-center">
            <p className="text-emerald-500 font-black text-[11px] uppercase tracking-[0.4em]">Iniciando Lente</p>
            <p className="text-neutral-500 text-[8px] font-bold uppercase mt-1 tracking-widest">Confirme as permissões se solicitado</p>
          </div>
        </div>
      )}

      {isCapturing && (
        <div className="absolute inset-0 bg-white/30 animate-pulse z-50 pointer-events-none" />
      )}
    </div>
  );
};

export default CameraScreen;
