
export interface AppSettings {
  folderName: string;
  prefix: string;
  startIndex: number;
  format: 'JPEG' | 'PNG';
  showOverlay: boolean;
}

export interface PhotoRecord {
  id: string;
  dataUrl: string;
  timestamp: number;
  index: number;
  folderName: string; // Added to identify which "folder" the photo belongs to
  coords: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  filename: string;
}

export enum AppState {
  SETUP = 'SETUP',
  CAMERA = 'CAMERA',
  GALLERY = 'GALLERY'
}
