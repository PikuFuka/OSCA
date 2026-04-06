
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Edit2, Award, MapPin, X, User, Users, Calendar, Home, CreditCard, Phone, HeartPulse, IdCard, Trash2, UserX, Camera, Upload, Printer, RotateCw, QrCode, ArrowLeft, Move, Loader2, Save, Eye, FileText, FileCheck, Clock, Edit2Icon } from 'lucide-react';
import { BARANGAYS, SeniorCitizen, CurrentUser, INITIAL_ID_CONFIG, ViewType } from '../types';
import { seniorsAPI, activityLogsAPI } from '../services/api';
import { TableSkeleton } from './SkeletonLoader';
import ConfirmModal from './ConfirmModal';

// Initial draggable positions from shared config
const initialTextPositions = INITIAL_ID_CONFIG;
const DEFAULT_CAMERA_ZOOM = 1.25;
const MIN_CAMERA_ZOOM = 1;
const MAX_CAMERA_ZOOM = 2.5;
const CAMERA_ZOOM_STEP = 0.05;
const PHOTO_PROCESS_MAX_DIMENSION = 1080;
const MASK_MIN_CONFIDENCE = 0.01;
const MASK_MAX_CONFIDENCE = 0.99;
const MASK_BLUR_PX = 3;
const MASK_EROSION_RADIUS = 1;
const TEMPORAL_MASK_BLEND = 0.7;
const PHOTO_ENHANCEMENT_FILTER = 'brightness(1.2) contrast(1.2) clarity(2)';

type SegmentationFrame = {
  compositedCanvas: HTMLCanvasElement;
};

// We will return the segmentation instance itself since we are doing live video stream.
let selfieSegmentationLoader: Promise<any> | null = null;

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp01((x - edge0) / Math.max(1e-5, edge1 - edge0));
  return t * t * (3 - 2 * t);
};

const erodeAlphaMask = (
  source: Uint8ClampedArray,
  width: number,
  height: number,
  radius: number
) => {
  if (radius <= 0) {
    return source;
  }

  const output = new Uint8ClampedArray(source.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let minAlpha = 255;

      const startY = Math.max(0, y - radius);
      const endY = Math.min(height - 1, y + radius);
      const startX = Math.max(0, x - radius);
      const endX = Math.min(width - 1, x + radius);

      for (let ky = startY; ky <= endY; ky++) {
        for (let kx = startX; kx <= endX; kx++) {
          const neighbor = source[ky * width + kx];
          if (neighbor < minAlpha) {
            minAlpha = neighbor;
          }
        }
      }

      output[y * width + x] = minAlpha;
    }
  }

  return output;
};

const getSelfieSegmentationInstance = async () => {
  if (!selfieSegmentationLoader) {
    selfieSegmentationLoader = import('@mediapipe/selfie_segmentation').then(async mod => {
      const selfieSegmentation = new mod.SelfieSegmentation({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
      });

      selfieSegmentation.setOptions({
        modelSelection: 0,
        selfieMode: true
      });

      await selfieSegmentation.initialize();
      return selfieSegmentation;
    });
  }
  return selfieSegmentationLoader;
};

const DraggableLabel = ({ 
  id, 
  text, 
  config, 
  updateConfig, 
  isSelected, 
  setSelected,
  className = ""
}: { 
  id: string, 
  text: string, 
  config: { x: number, y: number, fontSize: number }, 
  updateConfig: (id: string, newConfig: any) => void,
  isSelected: boolean,
  setSelected: (id: string | null) => void,
  className?: string
}) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelected(id);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = config.x;
    const initialY = config.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      updateConfig(id, { ...config, x: initialX + dx, y: initialY + dy });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleWheel = (e: React.WheelEvent) => {
    if (isSelected) {
        e.stopPropagation();
        // Prevent default zoom behavior if possible, though passive listeners limits this
        const delta = e.deltaY > 0 ? -1 : 1;
        updateConfig(id, { ...config, fontSize: Math.max(8, config.fontSize + delta) });
    }
  }

  return (
    <div 
      className={`absolute cursor-move select-none whitespace-nowrap leading-none ${isSelected ? 'ring-1 ring-blue-500 bg-blue-500/10 z-50' : 'z-20'} ${className}`}
      style={{ 
        left: config.x, 
        top: config.y, 
        fontSize: config.fontSize,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => e.stopPropagation()}
      onWheel={handleWheel}
      title="Drag to move, Scroll/Wheel to resize text"
    >
      {text}
      {isSelected && <Move size={10} className="absolute -top-3 -right-3 text-blue-500" />}
    </div>
  );
};


interface RegistryProps {
  currentUser: CurrentUser;
  notify: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  setView?: (view: ViewType) => void;
}

const StaticLabel = ({ 
  text, 
  config, 
  className = ""
}: { 
  text: string, 
  config: { x: number, y: number, fontSize: number }, 
  className?: string
}) => (
  <div 
    className={`absolute select-none whitespace-nowrap leading-none z-20 ${className}`}
    style={{ 
      left: config.x, 
      top: config.y, 
      fontSize: config.fontSize,
    }}
  >
    {text}
  </div>
);

const InfoField = ({ label, value, className = "" }: { label: string, value: string, className?: string }) => (
  <div className={className}>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="font-bold text-slate-800 text-sm md:text-base">{value || 'N/A'}</p>
  </div>
);

const MemberRegistry: React.FC<RegistryProps> = ({ currentUser, notify, setView }) => {
  const [seniors, setSeniors] = useState<SeniorCitizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterBarangay, setFilterBarangay] = useState('All Barangays');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedSenior, setSelectedSenior] = useState<SeniorCitizen | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<SeniorCitizen>>({});

  // Fetch seniors from API
  const fetchSeniors = async (background = false) => {
    if (!background) {
      setLoading(true);
    }
    try {
      const response = await seniorsAPI.getAll({
        search: debouncedSearch,
        barangay: filterBarangay === 'All Barangays' ? undefined : filterBarangay,
        page: page,
        fresh: true,
      });
      
      if (response && response.data) {
        // Laravel Paginate returns data in 'data' field
        setSeniors(response.data);
        setTotalPages(response.last_page || 1);
        setTotalCount(response.total || 0);
      } else {
        setSeniors(Array.isArray(response) ? response : []);
        setTotalPages(1);
        setTotalCount(Array.isArray(response) ? response.length : 0);
      }
    } catch (error: any) {
      if (!background) {
        notify('Failed to load member records from the server.', 'error');
      }
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchSeniors();
  }, [debouncedSearch, filterBarangay, page]);

  const [idModalOpen, setIdModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedSeniorForView, setSelectedSeniorForView] = useState<any>(null);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [viewingDocId, setViewingDocId] = useState<number | null>(null);
  const [idGenerationSenior, setIdGenerationSenior] = useState<SeniorCitizen | null>(null);

  // Helper functions
  const handleViewDocument = async (seniorId: string, docId: number, docType: string) => {
    setViewingDocId(docId);
    try {
      const blob = await seniorsAPI.viewDocument(seniorId, docId);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      // Revoke after some time to free memory
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (error) {
      notify("Failed to open document. Please try again.", "error");
    } finally {
      setViewingDocId(null);
    }
  };

  const handleViewDetails = async (senior: SeniorCitizen) => {
    setFetchingDetails(true);
    setViewModalOpen(true);
    setSelectedSeniorForView(null);
    try {
      const data = await seniorsAPI.getById(senior.id as any);
      setSelectedSeniorForView(data);
    } catch (error) {
      notify("Failed to load member details.", "error");
      setViewModalOpen(false);
    } finally {
      setFetchingDetails(false);
    }
  };

  const getMemberOscaId = (senior: any) => {
    return senior?.oscaId || senior?.osca_id || senior?.id || '';
  };

  const openEditMember = async (senior: SeniorCitizen) => {
    setIsProcessing(true);
    try {
      const fullData = await seniorsAPI.getById(senior.id as any);
      const merged = { ...senior, ...fullData } as any;
      setSelectedSenior(merged);
      setEditFormData({
        oscaId: getMemberOscaId(merged),
        firstName: merged.firstName || merged.first_name || '',
        middleName: merged.middleName || merged.middle_name || '',
        lastName: merged.lastName || merged.last_name || '',
        extensionName: merged.extensionName || merged.extension_name || '',
        dateOfBirth: merged.dateOfBirth || merged.date_of_birth || '',
        pensionStatus: merged.pensionStatus || merged.pension_status || '',
        barangay: merged.barangay || '',
        streetAddress: merged.streetAddress || merged.street_address || '',
        contactNumber: merged.contactNumber || merged.contact_number || '',
      });
    } catch (error: any) {
      // Fallback to current row data if detail fetch fails.
      setSelectedSenior(senior);
      setEditFormData({
        oscaId: getMemberOscaId(senior),
        firstName: senior.firstName || '',
        middleName: senior.middleName || '',
        lastName: senior.lastName || '',
        extensionName: senior.extensionName || '',
        dateOfBirth: senior.dateOfBirth || '',
        pensionStatus: senior.pensionStatus || '',
        barangay: senior.barangay || '',
        streetAddress: senior.streetAddress || '',
        contactNumber: senior.contactNumber || '',
      });
      notify('Loaded limited details. Some fields may need manual update.', 'warning');
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateAge = (dob: string): number => {
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  const mapPensionStatus = (status: string): string => {
    const map: Record<string, string> = {
      'indigent': 'Indigent',
      'pensioner': 'Pensioner',
      'national_social_pensioner': 'Social Pensioner',
      'local_social_pensioner': 'Social Pensioner',
    };
    return map[status] || 'None';
  };
  const [idPhoto, setIdPhoto] = useState<string | null>(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isPhotoProcessing, setIsPhotoProcessing] = useState(false);
  const [cameraZoom, setCameraZoom] = useState(DEFAULT_CAMERA_ZOOM);
  const [isIdFlipped, setIsIdFlipped] = useState(false);
  const [mobileStep, setMobileStep] = useState<'photo' | 'preview'>('photo');
  const [useWhiteBackground, setUseWhiteBackground] = useState(true);
  const useWhiteBackgroundRef = useRef(true);

  const toggleWhiteBackground = () => {
    setUseWhiteBackground(prev => {
      const next = !prev;
      useWhiteBackgroundRef.current = next;
      return next;
    });
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement>(null);
  const segmentationLoopRef = useRef<number | null>(null);
  const liveMaskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const photoMaskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const temporalMaskRef = useRef<Uint8ClampedArray | null>(null);

  const buildRefinedMaskCanvas = (
    segmentationMask: CanvasImageSource,
    width: number,
    height: number,
    useTemporalSmoothing: boolean,
    canvasRef: React.MutableRefObject<HTMLCanvasElement | null>
  ): HTMLCanvasElement | null => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }

    const canvas = canvasRef.current;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      return null;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.filter = MASK_BLUR_PX > 0 ? `blur(${MASK_BLUR_PX}px)` : 'none';
    ctx.drawImage(segmentationMask, 0, 0, width, height);
    ctx.filter = 'none';

    const maskImageData = ctx.getImageData(0, 0, width, height);
    const alphaMask = new Uint8ClampedArray(width * height);

    for (let i = 0, px = 0; i < maskImageData.data.length; i += 4, px++) {
      const confidence = maskImageData.data[i] / 255;
      const softened = smoothstep(MASK_MIN_CONFIDENCE, MASK_MAX_CONFIDENCE, confidence);
      alphaMask[px] = Math.round(softened * 255);
    }

    const erodedAlpha = erodeAlphaMask(alphaMask, width, height, MASK_EROSION_RADIUS);

    if (useTemporalSmoothing && temporalMaskRef.current && temporalMaskRef.current.length === erodedAlpha.length) {
      for (let i = 0; i < erodedAlpha.length; i++) {
        erodedAlpha[i] = Math.round(
          erodedAlpha[i] * TEMPORAL_MASK_BLEND + temporalMaskRef.current[i] * (1 - TEMPORAL_MASK_BLEND)
        );
      }
    }

    temporalMaskRef.current = new Uint8ClampedArray(erodedAlpha);

    for (let i = 0, px = 0; i < maskImageData.data.length; i += 4, px++) {
      maskImageData.data[i] = 255;
      maskImageData.data[i + 1] = 255;
      maskImageData.data[i + 2] = 255;
      maskImageData.data[i + 3] = erodedAlpha[px];
    }

    ctx.putImageData(maskImageData, 0, 0);
    return canvas;
  };

  // Draggable Text Configuration
  const [textConfig, setTextConfig] = useState(initialTextPositions);
  const [selectedField, setSelectedField] = useState<string | null>(null);

  const updateTextConfig = (id: string, newConfig: any) => {
    setTextConfig(prev => ({ ...prev, [id]: newConfig }));
  };

  // Confirmation state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: 'Delete' | 'Decease' | null;
    senior: SeniorCitizen | null;
  }>({ isOpen: false, type: null, senior: null });

  const itemsPerPage = 8;
  const isAdmin = currentUser.role === 'Admin';
  const isStaff = currentUser.role === 'Staff';
  const canGenerateID = isAdmin || isStaff;

  // Debounce search term to improve performance on large lists
  useEffect(() => {
    // If the search term is changed by the user, we wait for a brief moment
    // before triggering the actually filtering/fetching.
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to first page on new search
    }, 150); // Reduced delay to 150ms for snappier feedback

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // No need for client-side filtering and pagination as we use server-side
  const displayedSeniors = seniors;

  const handleAction = async () => {
    const { type, senior } = confirmState;
    if (!senior || !type) return;

    setIsProcessing(true);
    try {
      if (type === 'Delete') {
        await seniorsAPI.delete(senior.id as any);
        setSeniors(prev => prev.filter(s => s.id !== senior.id));
        setTotalCount(prev => prev - 1);
        notify(`Record for ${senior.name} has been permanently deleted.`, 'error');
      } else if (type === 'Decease') {
        await seniorsAPI.markDeceased(senior.id as any, new Date().toISOString().split('T')[0]);
        setSeniors(prev => prev.map(s => s.id === senior.id ? { ...s, status: 'Deceased' } : s));
        notify(`Status for ${senior.name} marked as Deceased.`, 'warning');
      }
    } catch (error: any) {
      console.error(error);
      notify(`Failed to perform ${type.toLowerCase()} action.`, 'error');
    } finally {
      setIsProcessing(false);
      setConfirmState({ isOpen: false, type: null, senior: null });
    }
  };

  const handleGenerateID = (senior: SeniorCitizen) => {
    setIdGenerationSenior(senior);
    setIdPhoto(senior.idPhoto || null);
    setTextConfig(INITIAL_ID_CONFIG);
    setIsWebcamActive(false);
    setIsIdFlipped(false);
    setMobileStep('photo'); // Reset to photo step on mobile
    setIdModalOpen(true);
    // Preload the model to reduce delay on first capture/upload.
    void getSelfieSegmentationInstance().catch(() => undefined);
  };

  const startWebcam = async () => {
    setIsWebcamActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Use front camera if available
          width: { ideal: 1080 },
          height: { ideal: 720 },
        }
      });

      setCameraZoom(DEFAULT_CAMERA_ZOOM);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Setup live segmented background
        const selfieSegmentation = await getSelfieSegmentationInstance();
        
        selfieSegmentation.onResults((results: any) => {
          if (!liveCanvasRef.current) return;
          const canvas = liveCanvasRef.current;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          
          canvas.width = results.image.width;
          canvas.height = results.image.height;
          
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          if (useWhiteBackgroundRef.current) {
            // 1. Draw the raw captured image with filters applied
            ctx.filter = PHOTO_ENHANCEMENT_FILTER;
            ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
            
            // 2. Use a soft alpha matte so hair/clothing edges blend naturally.
            ctx.filter = 'none';
            ctx.globalCompositeOperation = 'destination-in';
            const refinedMask = buildRefinedMaskCanvas(
              results.segmentationMask,
              canvas.width,
              canvas.height,
              true,
              liveMaskCanvasRef
            );
            if (refinedMask) {
              ctx.drawImage(refinedMask, 0, 0, canvas.width, canvas.height);
            } else {
              ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);
            }
            
            // 3. Draw a solid white background behind the now-transparent background
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Reset
            ctx.globalCompositeOperation = 'source-over';
          } else {
            // Just draw the raw webcam feed with enhancement
            ctx.filter = PHOTO_ENHANCEMENT_FILTER;
            ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
            ctx.filter = 'none';
          }
        });

        // Use requestAnimationFrame for processing video frames
        let lastTime = -1;
        const processStream = async () => {
          if (!videoRef.current || videoRef.current.paused || videoRef.current.ended) return;
          
          // Only process if the video has a new frame
          if (videoRef.current.currentTime !== lastTime) {
            lastTime = videoRef.current.currentTime;
            try {
              await selfieSegmentation.send({ image: videoRef.current });
            } catch (e) {
              console.error('Frame processing error', e);
            }
          }
          segmentationLoopRef.current = requestAnimationFrame(processStream);
        };
        
        videoRef.current.onloadeddata = () => {
          processStream();
        };
      }
    } catch (err) {
      notify("Error accessing camera. Please check permissions.", "error");
      setIsWebcamActive(false);
    }
  };

  const capturePhoto = async () => {
    if (liveCanvasRef.current && canvasRef.current && videoRef.current) {
      const liveCanvas = liveCanvasRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      if (context) {
        // Exact 1:1 output with center crop and zoom support.
        const zoom = Math.max(1, Number(cameraZoom) || 1);
        const sourceSize = Math.min(liveCanvas.width, liveCanvas.height) / zoom;
        const startX = (liveCanvas.width - sourceSize) / 2;
        const startY = (liveCanvas.height - sourceSize) / 2;

        context.drawImage(liveCanvas, startX, startY, sourceSize, sourceSize, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        stopWebcam();
        setMobileStep('preview');

        setIdPhoto(dataUrl);
        notify("Photo captured successfully.", "success");
      }
    }
  };

  const loadImage = (source: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Invalid image file.'));
      img.src = source;
    });
  };

  const flattenImageOnWhite = (source: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Unable to process image.'));
          return;
        }

        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Invalid image file.'));
      img.src = source;
    });
  };

  const resizeImageForProcessing = (source: string, maxDimension: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        const scale = Math.min(1, maxDimension / Math.max(width, height));

        if (scale === 1) {
          resolve(source);
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));

        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Unable to resize image.'));
          return;
        }

        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Invalid image file.'));
      img.src = source;
    });
  };

  const compositeWithWhiteUsingMask = async (originalSource: string): Promise<string> => {
    const originalImg = await loadImage(originalSource);
    const selfieSegmentation = await getSelfieSegmentationInstance();
    
    return new Promise<string>((resolve, reject) => {
      selfieSegmentation.onResults((results) => {
        try {
          const width = results.image.width;
          const height = results.image.height;
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Unable to render context');

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // 1. Draw raw image with filter
          ctx.filter = PHOTO_ENHANCEMENT_FILTER;
          ctx.drawImage(results.image, 0, 0, width, height);

          // 2. Use destination-in with a refined soft mask to improve edges.
          ctx.filter = 'none';
          ctx.globalCompositeOperation = 'destination-in';
          const refinedMask = buildRefinedMaskCanvas(
            results.segmentationMask,
            width,
            height,
            false,
            photoMaskCanvasRef
          );
          if (refinedMask) {
            ctx.drawImage(refinedMask, 0, 0, width, height);
          } else {
            ctx.drawImage(results.segmentationMask, 0, 0, width, height);
          }

          // 3. Draw white background behind
          ctx.globalCompositeOperation = 'destination-over';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);

          // Reset
          ctx.globalCompositeOperation = 'source-over';
          resolve(canvas.toDataURL('image/png'));
        } catch (error) {
          reject(error);
        }
      });

      selfieSegmentation.send({ image: originalImg }).catch(reject);
    });
  };

  const processPhotoWithWhiteBackground = async (source: string): Promise<string> => {
    try {
      const optimizedSource = await resizeImageForProcessing(source, PHOTO_PROCESS_MAX_DIMENSION);
      return compositeWithWhiteUsingMask(optimizedSource);
    } catch (error) {
      return flattenImageOnWhite(source);
    }
  };

  const stopWebcam = () => {
    if (segmentationLoopRef.current) {
      cancelAnimationFrame(segmentationLoopRef.current);
      segmentationLoopRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsWebcamActive(false);
    setCameraZoom(DEFAULT_CAMERA_ZOOM);
    temporalMaskRef.current = null;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = async () => {
        setIsPhotoProcessing(true);
        try {
          let processedImage;
          if (useWhiteBackgroundRef.current) {
             processedImage = await processPhotoWithWhiteBackground(reader.result as string);
          } else {
             processedImage = reader.result as string;
          }
          setIdPhoto(processedImage);
          setMobileStep('preview'); // Move to preview on mobile
          notify("Image uploaded successfully. Click 'Save' to update profile.", "success");
        } catch (error) {
          notify("Failed to process uploaded image.", "error");
        } finally {
          setIsPhotoProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const savePhoto = async () => {
    if (!idPhoto || !idGenerationSenior) return;
    try {
      setLoading(true);
      await seniorsAPI.updatePhoto(idGenerationSenior.id, idPhoto);
      notify("Profile photo updated successfully in registry.", "success");
      // Update local state for the senior list
      setSeniors(prev => prev.map(s => s.id === idGenerationSenior.id ? { ...s, idPhoto: idPhoto } : s));
    } catch (error: any) {
      console.error(error); notify("Failed to save photo.", "error");
    } finally {
      setLoading(false);
    }
  };

  const closeIdModal = () => {
    if (isPhotoProcessing) return;
    stopWebcam();
    setIdModalOpen(false);
    setIdGenerationSenior(null);
  };

  const handlePrint = async () => {
      notify("Opening print preview...", "info");

      // Log the printing action
      if (idGenerationSenior) {
        try {
          await activityLogsAPI.log({
            action: 'PRINTED_ID',
            target_type: 'Senior',
            target_id: idGenerationSenior.id,
            details: {
              osca_id: idGenerationSenior.id,
              name: formatIdDisplayName(idGenerationSenior)
            }
          });
        } catch (err) {
          // Silent fail on log action
        }
      }

      // Set document title to senior's name for the print dialog / "Save as PDF"
      const originalTitle = document.title;
      if (idGenerationSenior) {
        document.title = formatIdDisplayName(idGenerationSenior);
      }

      const restoreTitle = () => {
        document.title = originalTitle;
        window.removeEventListener('afterprint', restoreTitle);
      };
      window.addEventListener('afterprint', restoreTitle);

      setTimeout(() => {
        window.print();
      }, 500);
  };

  const ProfileDetail = ({ icon: Icon, label, value, colorClass = "text-slate-800" }: any) => (
    <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-100 transition-colors">
      <div className="mt-0.5 text-slate-400"><Icon size={18} /></div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{label}</p>
        <p className={`text-base font-bold ${colorClass}`}>{value}</p>
      </div>
    </div>
  );

  // Helper to map pensionStatus string to display category
  const getDisplayCategory = (status: string) => {
    if (!status) return 'Indigent';
    const s = status.toLowerCase();
    if (s.includes('national') || s === 'social pensioner') return 'National';
    if (s.includes('local')) return 'Local';
    if (s.includes('pensioner') && !s.includes('social')) return 'Pensioner';
    if (s === 'none') return 'None';
    if (s.includes('indigent')) return 'Indigent';
    return 'None'; // Default to None if unknown
  };

  const getCategoryStyle = (category: string) => {
    switch(category) {
      case 'National': return 'bg-blue-100 text-blue-900';
      case 'Local': return 'bg-purple-100 text-purple-900';
      case 'Pensioner': return 'bg-amber-100 text-amber-900';
      case 'None': return 'bg-slate-100 text-slate-600';
      case 'Indigent': return 'bg-red-100 text-slate-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const formatIdDisplayName = (senior: SeniorCitizen) => {
    const lastName = senior.lastName?.trim() || '';
    const firstName = senior.firstName?.trim() || '';
    const middleName = senior.middleName?.trim() || '';
    const extensionName = senior.extensionName?.trim() || '';

    const orderedName = [
      lastName ? `${lastName},` : '',
      firstName,
      extensionName,
      middleName,
    ].filter(Boolean).join(' ');

    return orderedName || senior.name;
  };
  
  return (
    <div className="space-y-6 md:space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-10">
        <div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">Member Registry</h2>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-3 bg-white/50 w-fit px-3 py-1 rounded-full border border-slate-200 shadow-sm">Official Records</p>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center gap-5 w-full xl:w-auto">
          <div className="w-full xl:w-[450px]">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-systemBlue/5 rounded-lg flex items-center justify-center text-slate-400 group-focus-within:text-systemBlue transition-colors">
                <Search size={18} />
              </div>
              <input 
                id="registry-search"
                name="registrySearch"
                type="text" 
                placeholder="Search name, ID, or barangay..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 bg-white/80 backdrop-blur-md border border-slate-200 rounded-ios text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-systemBlue/50 focus:ring-4 focus:ring-systemBlue/10 transition-all font-semibold shadow-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md p-2 rounded-ios border border-slate-200 shadow-sm">
            <div className="w-10 h-10 bg-systemBlue/10 rounded-ios flex items-center justify-center shrink-0 border border-systemBlue/10">
              <MapPin size={20} className="text-systemBlue" />
            </div>
            <select 
              id="registry-barangay-filter"
              name="registryBarangayFilter"
              value={filterBarangay}
              onChange={(e) => { setFilterBarangay(e.target.value); setPage(1); }}
              className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer w-full min-w-[180px] pr-8"
            >
              <option className="bg-white">All Barangays</option>
              {BARANGAYS.map(b => (
                <option key={b} value={b} className="bg-white">{b}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Note banner directing admin/staff to For Approvals */}
      {setView && (
        <div className="bg-systemBlue/5 border border-systemBlue/10 rounded-ios p-6 mb-10 flex flex-col md:flex-row md:items-center gap-5 backdrop-blur-sm shadow-sm">
          <div className="w-12 h-12 bg-systemBlue text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-systemBlue/20">
            <FileCheck size={24} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">Queue Management</h4>
            <p className="text-sm font-medium text-slate-600 leading-relaxed">
              Only validated members appear in this registry. Pending applicants or updates are stored in the{' '}
              <button
                onClick={() => setView(ViewType.APPROVAL)}
                className="text-systemBlue font-bold decoration-2 underline underline-offset-4 hover:text-blue-700 transition-colors"
              >
                Approval Queue
              </button>
              .
            </p>
          </div>
        </div>
      )}
      
      <div className="ios-card shadow-xl shadow-slate-200/50">
        <div className="w-full overflow-x-hidden">
          {loading ? (
            <TableSkeleton />
          ) : (
            <table className="ios-table w-full table-fixed">
              <thead>
                <tr>
                  <th className="px-4 lg:px-6 py-4 lg:py-5 w-[30%]">Member Identity</th>
                  <th className="px-4 lg:px-6 py-4 lg:py-5 w-[12%] text-center">Age / Locality</th>
                  <th className="px-4 lg:px-6 py-4 lg:py-5 w-[14%] text-center">Category</th>
                  <th className="px-4 lg:px-6 py-4 lg:py-5 w-[12%] text-center">Status</th>
                  <th className="px-4 lg:px-6 py-4 lg:py-5 w-[14%] text-center">Modified</th>
                  <th className="px-2 lg:px-3 py-4 lg:py-5 w-[18%] text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedSeniors.length > 0 ? displayedSeniors.map((senior) => {
                  const category = getDisplayCategory(senior.pensionStatus);
                  return (
                  <tr key={senior.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="px-4 lg:px-6 py-4 lg:py-5 align-middle">
                      <div className="flex items-center gap-3 lg:gap-4">
                        <div className="relative">
                          {senior.idPhoto ? (
                            <img src={senior.idPhoto} alt={senior.name} loading="lazy" className="w-11 h-11 lg:w-12 lg:h-12 rounded-ios object-cover border border-slate-200 shadow-sm shrink-0 bg-slate-50" />
                          ) : (
                            <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-ios bg-systemBlue/20 flex items-center justify-center text-systemBlue font-bold border border-slate-200 shadow-sm shrink-0 text-sm">
                              {senior.name.split(' ').map(n => n[0]).join('')}
                            </div>
                          )}
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-systemGray-50 ${
                            senior.status === 'Active' ? 'bg-emerald-500' : 
                            senior.status === 'Pending' ? 'bg-amber-500' : 
                            'bg-slate-500'
                          }`}></div>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-base truncate tracking-tight">{senior.name}</p>
                          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mt-1 font-mono truncate">{getMemberOscaId(senior)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 lg:py-5 align-middle text-center">
                      <div className="flex flex-col">
                        <span className="text-base font-bold text-slate-900">{senior.age}</span>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 truncate">{senior.barangay}</span>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 lg:py-5 align-middle">
                      <div className="flex items-center justify-center">
                        <span className={`text-[10px] font-bold uppercase whitespace-nowrap px-3 py-1.5 rounded-full border ${getCategoryStyle(category)}`}>
                          {category}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 lg:py-5 align-middle">
                      <div className="flex items-center justify-center">
                        <span className={`inline-flex items-center justify-center text-[10px] font-bold uppercase tracking-widest whitespace-nowrap px-3 py-1 rounded-full border ${
                          senior.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                          senior.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                          senior.status === 'Deceased' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                          'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {senior.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 lg:py-5 align-middle text-center">
                       <p className="text-[11px] font-bold text-slate-500 tabular-nums">
                         {senior.updatedAt ? new Date(senior.updatedAt).toLocaleString('en-US', { 
                           month: 'short', 
                           day: '2-digit', 
                           year: 'numeric',
                           hour: '2-digit',
                           minute: '2-digit'
                         }) : 'N/A'}
                       </p>
                    </td>
                    <td className="px-2 lg:px-3 py-4 lg:py-5 align-middle text-center">
                      <div className="flex flex-nowrap items-center justify-center gap-0.5 lg:gap-1">
                        <button
                           onClick={() => handleViewDetails(senior)}
                           className="w-6 h-6 lg:w-8 lg:h-8 bg-systemBlue/5 hover:bg-systemBlue text-systemBlue hover:text-white rounded-ios border border-systemBlue/10 flex items-center justify-center transition-all duration-300 shadow-sm"
                           title="Inspect"
                        >
                           <Eye size={12} />
                        </button>

                        {canGenerateID && (
                          <button
                            onClick={() => openEditMember(senior)}
                            className="w-6 h-6 lg:w-8 lg:h-8 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-ios border border-emerald-100 flex items-center justify-center transition-all duration-300 shadow-sm"
                            title="Edit"
                          >
                            <Edit2 size={12} />
                          </button>
                        )}

                        {canGenerateID && (
                          <button 
                            disabled={senior.status !== 'Active'}
                            onClick={() => handleGenerateID(senior)} 
                            className={`w-6 h-6 lg:w-8 lg:h-8 border rounded-ios flex items-center justify-center transition-all duration-300 shadow-sm ${
                              senior.status !== 'Active' 
                                ? 'bg-slate-50 opacity-30 cursor-not-allowed text-slate-400 border-slate-200' 
                                : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-600 hover:text-white hover:border-amber-600'
                            }`} 
                            title={senior.status === 'Active' ? "Issue ID" : "Approval Restricted"}
                          >
                            <IdCard size={12} />
                          </button>
                        )}
                        
                        {isAdmin && (
                          <>
                             {senior.status !== 'Deceased' && (
                               <button
                                 onClick={() => setConfirmState({ isOpen: true, type: 'Decease', senior })}
                                 className="w-6 h-6 lg:w-8 lg:h-8 bg-slate-100 hover:bg-slate-900 text-slate-500 hover:text-white rounded-ios border border-slate-200 flex items-center justify-center transition-all duration-300 shadow-sm"
                                 title="Mark as Deceased"
                               >
                                 <UserX size={12} />
                               </button>
                             )}
                             <button 
                               onClick={() => setConfirmState({ isOpen: true, type: 'Delete', senior })} 
                               className="w-6 h-6 lg:w-8 lg:h-8 bg-rose-50 hover:bg-rose-600 text-rose-500 hover:text-white rounded-ios border border-rose-100 flex items-center justify-center transition-all duration-300 shadow-sm" 
                               title="Delete"
                             >
                               <Trash2 size={12} />
                             </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                }) : (
                   <tr>
                    <td colSpan={6} className="px-10 py-40 text-center">
                      <div className="flex flex-col items-center gap-6">
                        <div className="w-20 h-20 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 animate-pulse"><Search size={40} /></div>
                        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">No records identified in current dataset</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-6 md:px-10 md:py-8 bg-slate-50/70 flex flex-col sm:flex-row items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest border-t border-slate-200 gap-6">
          <p className="px-4 py-2 bg-white rounded-full border border-slate-200">Dataset Range: {displayedSeniors.length} / {totalCount} records</p>
          <div className="flex items-center gap-6">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-6 py-2.5 bg-white border border-slate-200 rounded-ios text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-20 transition-all font-bold">Previous</button>
            <span className="text-systemBlue px-4">Page {page} <span className="opacity-30 mx-2">/</span> {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-6 py-2.5 bg-white border border-slate-200 rounded-ios text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-20 transition-all font-bold">Next</button>
          </div>
        </div>
      </div>

      {/* ID Generation Modal */}
      {idModalOpen && idGenerationSenior && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="hidden print:flex flex-col items-center justify-start gap-0 p-0 bg-white w-full">
            <style>{`
              @media print {
                @page { 
                  size: portrait;
                  margin: 15mm; 
                }
                body * { visibility: hidden; }
                .print-container, .print-container * { visibility: visible; }
                .print-container { 
                  position: absolute; 
                  left: 0; 
                  top: 0; 
                  width: 100%;
                  display: flex !important;
                  flex-direction: row !important;
                  align-items: center !important;
                  justify-content: center !important;
                  padding: 20px 0;
                  gap: 0mm !important;
                }
                .print-card {
                  width: 3.5in !important;
                  height: 2.3in !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  position: relative;
                  overflow: hidden;
                  border: 0.1mm solid #ccc;
                }
                .print-content {
                  width: 480px;
                  height: 300px;
                  transform: scale(calc(3.5in / 480px), calc(2.3in / 300px));
                  transform-origin: top left;
                }
              }
            `}</style>
            
            <div className="print-container">
              {/* BACK CARD (PRINT) - Left side */}
              <div className="print-card">
                <div className="print-content">
                  <img src="img/BACK.jpg" className="absolute inset-0 w-full h-full object-cover z-0" alt="" />
                </div>
              </div>

              {/* FRONT CARD (PRINT) - Right side */}
              <div className="print-card">
                 <div className="print-content">
                    {/* Background Image Tag for better print reliability */}
                    <img src="img/FRONT.jpg" className="absolute inset-0 w-full h-full object-cover z-0" alt="" />
                    
                    <div className="absolute inset-0 z-10">
                        <div className="absolute [left:12px] [top:139px] [width:125px] [height:127px] overflow-hidden flex items-center justify-center">
                          {idPhoto && <img src={idPhoto} className="w-full h-full object-cover" />}
                        </div>
                        
                        <div className="absolute inset-0 z-20">
                          <StaticLabel text={formatIdDisplayName(idGenerationSenior)} config={textConfig.name} className="font-black text-slate-900 uppercase" />
                          <StaticLabel text={`Brgy. ${idGenerationSenior.barangay}`} config={textConfig.barangay} className="font-black text-slate-900 uppercase" />
                          <StaticLabel text="Pagsanjan, Laguna" config={textConfig.city} className="font-black text-slate-900 uppercase" />
                          <StaticLabel text={String(idGenerationSenior.age)} config={textConfig.age} className="font-black text-slate-900" />
                          <StaticLabel 
                            text={idGenerationSenior.dateOfBirth 
                              ? new Date(idGenerationSenior.dateOfBirth).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                              : new Date(new Date().getFullYear() - idGenerationSenior.age, 0, 1).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                            config={textConfig.dob} 
                            className="font-black text-slate-900" 
                          />
                        <StaticLabel 
                          text={(idGenerationSenior as any).sex || idGenerationSenior.gender} 
                          config={textConfig.gender} 
                          className="font-black text-slate-900 uppercase" 
                        />
                          <StaticLabel text={new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })} config={textConfig.dateIssued} className="font-black text-slate-900" />
                          <StaticLabel text={idGenerationSenior.id} config={textConfig.id} className="font-black text-rose-600 tracking-tighter" />
                        </div>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] w-full max-w-5xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] print:hidden">
             <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-systemBlue text-white rounded-xl">
                   <IdCard size={24} />
                 </div>
                 <div>
                   <h3 className="text-lg font-black text-slate-900">Generate Member ID</h3>
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preview and Issue OSCA ID</p>
                 </div>
               </div>
               <button onClick={closeIdModal} disabled={isPhotoProcessing} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"><X size={24} /></button>
             </div>

             <div className="flex flex-col lg:flex-row flex-1 overflow-hidden relative">
                {isPhotoProcessing && (
                  <div className="fixed inset-0 z-[120] bg-slate-900/45 backdrop-blur-md flex items-center justify-center p-6">
                    <div className="w-full max-w-sm bg-[#FFFBF1] rounded-3xl shadow-2xl border border-white/60 px-6 py-7 text-center">
                      <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-white/70 border border-slate-200/80 flex items-center justify-center shadow-sm">
                        <img src="img/pjn_logo.png" alt="Pagsanjan Logo" className="w-10 h-10 object-contain" />
                      </div>

                      <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-3">
                        <Loader2 size={14} className="animate-spin text-blue-900" />
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-900">Processing</span>
                      </div>

                      <p className="text-lg font-black tracking-tight text-slate-900">Processing photo...</p>
                      <p className="text-sm font-medium text-slate-600 mt-1">Applying background cleanup and finalizing ID image.</p>
                    </div>
                  </div>
                )}
                {/* Left Panel: Photo Capture */}
                <div className={`w-full lg:w-1/3 bg-slate-50 p-6 border-r border-slate-100 overflow-y-auto transition-all ${mobileStep === 'photo' ? 'block' : 'hidden lg:block'}`}>
                   <h4 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4">Member Photo</h4>
                   <div className="aspect-square bg-slate-200 rounded-2xl mb-4 overflow-hidden relative border-2 border-slate-300 flex items-center justify-center">
                      {isWebcamActive ? (
                        <>
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="hidden"
                          />
                          <canvas
                            ref={liveCanvasRef}
                            className="w-full h-full object-cover"
                            style={{ transform: `scaleX(-1) scale(${cameraZoom})` }}
                          />
                          {/* ID Photo Guide Overlay */}
                          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-60">
                             <svg viewBox="0 0 200 200" className="w-full h-full text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" preserveAspectRatio="xMidYMid meet">
                               {/* Face Oval */}
                               <ellipse cx="100" cy="85" rx="38" ry="50" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4,4" />
                               
                               {/* Ears */}
                               <path d="M 62 80 C 55 75, 55 95, 62 90" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4,4" />
                               <path d="M 138 80 C 145 75, 145 95, 138 90" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4,4" />

                               {/* Eyes Guide Line */}
                               <line x1="80" y1="80" x2="120" y2="80" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.7" />
                               
                               {/* Nose Guide */}
                               <path d="M 100 80 L 100 95" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.7" />
                               
                               {/* Mouth Guide */}
                               <path d="M 90 105 Q 100 110 110 105" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.7" />

                               {/* Shoulders */}
                               <path d="M 20 200 Q 20 145 100 145 Q 180 145 180 200" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4,4" />
                             </svg>
                          </div>
                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider">
                              Auto {cameraZoom.toFixed(2)}x | 1:1
                            </div>
                          <canvas ref={canvasRef} className="hidden" width={400} height={400} />
                        </>
                      ) : idPhoto ? (
                        <img src={idPhoto} alt="Member" className="w-full h-full object-cover" />
                      ) : (
                        <User size={64} className="text-slate-400" />
                      )}
                   </div>
                   <div className="space-y-3">
                      {!isWebcamActive ? (
                         <>
                          <button onClick={startWebcam} disabled={isPhotoProcessing} className="w-full py-3 bg-systemBlue text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"><Camera size={18} /> Open Webcam</button>
                           <div className="relative">
                            <input id="member-id-upload" name="memberIdPhoto" type="file" accept="image/*" disabled={isPhotoProcessing} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" onChange={handleFileUpload} />
                            <button disabled={isPhotoProcessing} className="w-full py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"><Upload size={18} /> Upload Image</button>
                           </div>
                         </>
                      ) : (
                         <div className="grid grid-cols-2 gap-3">
                           <button onClick={stopWebcam} disabled={isPhotoProcessing} className="py-3 bg-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button>
                           <button onClick={capturePhoto} disabled={isPhotoProcessing} className="py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed">Capture</button>
                         </div>
                      )}

                      {isWebcamActive && (
                        <div className="bg-white border border-slate-200 rounded-xl p-3 space-y-3">
                          <button 
                            onClick={toggleWhiteBackground}
                            className={`w-full py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors ${
                              useWhiteBackground 
                                ? 'bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200' 
                                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            AI White Background: {useWhiteBackground ? 'ON' : 'OFF'}
                          </button>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Zoom</span>
                              <span className="text-xs font-black text-blue-900">{cameraZoom.toFixed(2)}x</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setCameraZoom(prev => Math.max(MIN_CAMERA_ZOOM, Number((prev - CAMERA_ZOOM_STEP).toFixed(2))))}
                              className="w-9 h-9 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-black hover:bg-slate-100"
                              aria-label="Zoom out"
                            >
                              -
                            </button>
                            <input
                              type="range"
                              min={MIN_CAMERA_ZOOM}
                              max={MAX_CAMERA_ZOOM}
                              step={CAMERA_ZOOM_STEP}
                              value={cameraZoom}
                              onChange={(e) => setCameraZoom(Number(e.target.value))}
                              className="w-full accent-blue-900"
                            />
                            <button
                              type="button"
                              onClick={() => setCameraZoom(prev => Math.min(MAX_CAMERA_ZOOM, Number((prev + CAMERA_ZOOM_STEP).toFixed(2))))}
                              className="w-9 h-9 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-black hover:bg-slate-100"
                              aria-label="Zoom in"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => setCameraZoom(DEFAULT_CAMERA_ZOOM)}
                            className="w-full py-2 rounded-lg bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider hover:bg-blue-100"
                          >
                            Reset to Auto Zoom
                          </button>
                        </div>
                        </div>
                      )}
                      
                      {/* Explicit button to proceed on mobile if photo exists but user navigated back */}
                      {idPhoto && !isWebcamActive && (
                        <div className="space-y-2">
                          <button 
                             onClick={savePhoto} 
                            disabled={isPhotoProcessing}
                            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                              <Save size={18} /> Save to Profile
                           </button>
                           <button 
                             onClick={() => setMobileStep('preview')} 
                             className="w-full py-3 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl font-bold flex lg:hidden items-center justify-center gap-2 hover:bg-blue-100 transition-all"
                           >
                             Proceed to Preview <ArrowLeft size={16} className="rotate-180" />
                           </button>
                        </div>
                      )}
                   </div>
                </div>

                {/* Right Panel: ID Preview */}
                <div className={`flex-1 p-6 lg:p-10 flex flex-col items-center justify-start lg:justify-center bg-slate-100 overflow-y-auto ${mobileStep === 'preview' ? 'block' : 'hidden lg:flex'}`}>
                   {/* Mobile Back Button */}
                   <button 
                      onClick={() => setMobileStep('photo')}
                      className="lg:hidden absolute top-4 left-4 p-2 bg-white text-slate-500 rounded-full shadow-md z-20 flex items-center gap-2 px-4 hover:bg-slate-50"
                   >
                      <ArrowLeft size={16} /> <span className="text-xs font-bold uppercase">Retake Photo</span>
                   </button>

                   <div 
                      className="origin-top sm:origin-center transition-transform duration-300 mb-8 sm:mb-0 mt-8 sm:mt-0 scale-[0.55] sm:scale-75 md:scale-90 lg:scale-100"
                   >
                      <div 
                        className="w-[480px] h-[300px] bg-white rounded-xl shadow-2xl relative overflow-hidden flex flex-col shrink-0 print:shadow-none cursor-pointer ring-4 ring-transparent"
                        onClick={() => setIsIdFlipped(!isIdFlipped)}
                      >
                          {/* Hint Label */}
                          <div className="absolute top-3 right-3 z-30 bg-black/60 text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest pointer-events-none backdrop-blur-sm flex items-center gap-1">
                            <RotateCw size={10} /> {isIdFlipped ? 'Show Front' : 'Show Back'}
                          </div>
                          
                          {!isIdFlipped ? (
                            <>
                              {/* FRONT LAYOUT USING IMAGE TEMPLATE */}
                              <div className="absolute inset-0 bg-[url('img/FRONT.jpg')] bg-cover bg-no-repeat bg-center z-10">
                                {/* Photo Area inside the circular watermark box */}
                                <div className="absolute [left:11px] [top:138px] [width:128px] [height:128px] overflow-hidden flex items-center justify-center">
                                  {idPhoto ? (
                                    <img src={idPhoto} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center p-2 opacity-10">
                                      <User size={48} />
                                    </div>
                                  )}
                                </div>

                                {/* Draggable Values */}
                                <div className="absolute inset-0 z-20" onClick={() => setSelectedField(null)}>
                                  <DraggableLabel 
                                    id="name" 
                                    text={formatIdDisplayName(idGenerationSenior)} 
                                    config={textConfig.name} 
                                    updateConfig={updateTextConfig}
                                    isSelected={selectedField === 'name'}
                                    setSelected={setSelectedField}
                                    className="font-black text-slate-900 uppercase"
                                  />
                                  
                                  <DraggableLabel 
                                    id="barangay" 
                                    text={`Brgy. ${idGenerationSenior.barangay}`} 
                                    config={textConfig.barangay} 
                                    updateConfig={updateTextConfig}
                                    isSelected={selectedField === 'barangay'}
                                    setSelected={setSelectedField}
                                    className="font-black text-slate-900 uppercase"
                                  />
                                  
                                  <DraggableLabel 
                                    id="city" 
                                    text="Pagsanjan, Laguna" 
                                    config={textConfig.city} 
                                    updateConfig={updateTextConfig}
                                    isSelected={selectedField === 'city'}
                                    setSelected={setSelectedField}
                                    className="font-black text-slate-900 uppercase"
                                  />
                                  
                                  <DraggableLabel 
                                    id="age" 
                                    text={String(idGenerationSenior.age)} 
                                    config={textConfig.age} 
                                    updateConfig={updateTextConfig}
                                    isSelected={selectedField === 'age'}
                                    setSelected={setSelectedField}
                                    className="font-black text-slate-900"
                                  />
                                  
                                  <DraggableLabel 
                                    id="dob" 
                                    text={idGenerationSenior.dateOfBirth 
                                      ? new Date(idGenerationSenior.dateOfBirth).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
                                      : new Date(new Date().getFullYear() - idGenerationSenior.age, 0, 1).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                                    config={textConfig.dob} 
                                    updateConfig={updateTextConfig}
                                    isSelected={selectedField === 'dob'}
                                    setSelected={setSelectedField}
                                    className="font-black text-slate-900"
                                  />
                                  
                                  <DraggableLabel 
                                    id="gender" 
                                    text={(idGenerationSenior as any).sex || idGenerationSenior.gender} 
                                    config={textConfig.gender} 
                                    updateConfig={updateTextConfig}
                                    isSelected={selectedField === 'gender'}
                                    setSelected={setSelectedField}
                                    className="font-black text-slate-900 uppercase"
                                  />
                                  
                                  <DraggableLabel 
                                    id="dateIssued" 
                                    text={new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                                    config={textConfig.dateIssued} 
                                    updateConfig={updateTextConfig}
                                    isSelected={selectedField === 'dateIssued'}
                                    setSelected={setSelectedField}
                                    className="font-black text-slate-900"
                                  />

                                  <DraggableLabel 
                                    id="id" 
                                    text={idGenerationSenior.id} 
                                    config={textConfig.id} 
                                    updateConfig={updateTextConfig}
                                    isSelected={selectedField === 'id'}
                                    setSelected={setSelectedField}
                                    className="font-black text-rose-600 tracking-tighter"
                                  />
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              {/* BACK LAYOUT USING IMAGE TEMPLATE - BLANK */}
                              <div className="absolute inset-0 bg-[url('img/BACK.jpg')] bg-cover bg-no-repeat bg-center z-10">
                              </div>
                            </>
                          )}
                      </div>
                   </div>

                   <div className="flex flex-col sm:flex-row gap-3 mt-4 w-full sm:w-auto">
                     <button 
                       onClick={handlePrint}
                       className="w-full sm:w-auto px-8 py-4 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl"
                     >
                        <Printer size={18} /> Print Card
                     </button>
                   </div>
                </div>
             </div>
          </div>
        </div>,
        document.getElementById('modal-root') || document.body
      )}

      {/* Senior Profile Modal (Edit) */}
      {selectedSenior && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col my-auto max-h-full">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-900 rounded-xl">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Edit Member Profile</h3>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{getMemberOscaId(selectedSenior)}</p>
                </div>
              </div>
              <button onClick={() => setSelectedSenior(null)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors"><X size={24} /></button>
            </div>
            <div className="overflow-y-auto p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-8 mb-8 items-start">
                {selectedSenior.idPhoto ? (
                  <img src={selectedSenior.idPhoto} alt={selectedSenior.name} loading="lazy" className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] object-cover shadow-xl shadow-blue-100 mx-auto md:mx-0 bg-slate-100" />
                ) : (
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-[2rem] bg-systemBlue text-white flex items-center justify-center text-3xl md:text-4xl font-black shrink-0 shadow-xl shadow-blue-100 mx-auto md:mx-0">
                    {selectedSenior.name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
                <div className="flex-1 space-y-4 text-center md:text-left w-full">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-2">{formatIdDisplayName(selectedSenior)}</h2>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wide ${
                        selectedSenior.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                      }`}>{selectedSenior.status}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Registration Date</p>
                    <p className="text-sm font-bold text-slate-800">{selectedSenior.joinedDate}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-100 pb-2"><Edit2 size={16} /> Edit Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label htmlFor="edit-oscaId" className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1 block">OSCA ID (Can be updated)</label>
                      <input id="edit-oscaId" name="oscaId" type="text" value={editFormData.oscaId || ''} onChange={e => setEditFormData(prev => ({ ...prev, oscaId: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-blue-50 border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-900 font-bold text-blue-900" />
                    </div>
                    <div>
                      <label htmlFor="edit-firstName" className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">First Name</label>
                      <input id="edit-firstName" name="firstName" type="text" value={editFormData.firstName || ''} onChange={e => setEditFormData(prev => ({ ...prev, firstName: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 font-medium text-slate-700" />
                    </div>
                    <div>
                      <label htmlFor="edit-middleName" className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Middle Name</label>
                      <input id="edit-middleName" name="middleName" type="text" value={editFormData.middleName || ''} onChange={e => setEditFormData(prev => ({ ...prev, middleName: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 font-medium text-slate-700" />
                    </div>
                    <div>
                      <label htmlFor="edit-lastName" className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Last Name</label>
                      <input id="edit-lastName" name="lastName" type="text" value={editFormData.lastName || ''} onChange={e => setEditFormData(prev => ({ ...prev, lastName: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 font-medium text-slate-700" />
                    </div>
                    <div>
                      <label htmlFor="edit-extensionName" className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Extension Name</label>
                      <select id="edit-extensionName" name="extensionName" value={editFormData.extensionName || ''} onChange={e => setEditFormData(prev => ({ ...prev, extensionName: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 font-medium text-slate-700">
                        <option value="">None</option>
                        <option value="Jr.">Jr.</option>
                        <option value="Sr.">Sr.</option>
                        <option value="III">III</option>
                        <option value="IV">IV</option>
                        <option value="V">V</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="edit-dateOfBirth" className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Birthday</label>
                      <input id="edit-dateOfBirth" name="dateOfBirth" type="date" value={editFormData.dateOfBirth || ''} onChange={e => setEditFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 font-medium text-slate-700" />
                    </div>
                    <div>
                      <label htmlFor="edit-pensionStatus" className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Pension Status</label>
                      <select id="edit-pensionStatus" name="pensionStatus" value={editFormData.pensionStatus || ''} onChange={e => setEditFormData(prev => ({ ...prev, pensionStatus: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 font-medium text-slate-700">
                        <option value="Indigent">Indigent</option>
                        <option value="Pensioner">Pensioner</option>
                        <option value="National Social Pensioner">National Social Pensioner</option>
                        <option value="Local Social Pensioner">Local Social Pensioner</option>
                        <option value="None">None</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="edit-barangay" className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Barangay</label>
                      <select id="edit-barangay" name="barangay" value={editFormData.barangay || ''} onChange={e => setEditFormData(prev => ({ ...prev, barangay: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 font-medium text-slate-700">
                        {BARANGAYS.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="edit-contactNumber" className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Contact Number</label>
                      <input id="edit-contactNumber" name="contactNumber" type="text" value={editFormData.contactNumber || ''} onChange={e => setEditFormData(prev => ({ ...prev, contactNumber: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 font-medium text-slate-700" />
                    </div>
                    <div className="md:col-span-2">
                      <label htmlFor="edit-streetAddress" className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Street Address</label>
                      <input id="edit-streetAddress" name="streetAddress" type="text" value={editFormData.streetAddress || ''} onChange={e => setEditFormData(prev => ({ ...prev, streetAddress: e.target.value }))} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 font-medium text-slate-700" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 z-10 flex-wrap">
              <button onClick={() => setSelectedSenior(null)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors flex-1 md:flex-none">Cancel</button>
              <button
                disabled={isProcessing}
                onClick={async () => {
                  setIsProcessing(true);
                  try {
                    await seniorsAPI.update(selectedSenior.id, editFormData);
                    notify("Profile updated successfully.", "success");
                    setSelectedSenior(null);
                    fetchSeniors();
                  } catch (error: any) {
                    console.error(error); notify("Failed to update profile.", "error");
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                className="px-8 py-3 rounded-xl bg-systemBlue text-white font-bold hover:bg-blue-800 transition-colors shadow-lg shadow-blue-100 flex items-center justify-center gap-2 flex-1 md:flex-none disabled:opacity-70"
              >
                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Edit2 size={18} />}
                {isProcessing ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>,
        document.getElementById('modal-root') || document.body
      )}

      {/* View Information & Documents Modal */}
      {viewModalOpen && createPortal(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8 flex items-center justify-between border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-systemBlue flex items-center justify-center text-white">
                  <Eye size={24} />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">Member Details</h3>
                  <p className="text-sm font-bold text-slate-400">View information and documents</p>
                </div>
              </div>
              <button 
                onClick={() => setViewModalOpen(false)}
                className="p-3 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-2xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-10">
              {fetchingDetails ? (
                <div className="h-64 flex flex-col items-center justify-center gap-4 text-slate-400">
                  <Loader2 className="animate-spin" size={48} />
                  <p className="font-bold animate-pulse">Fetching member data...</p>
                </div>
              ) : selectedSeniorForView ? (
                <div className="space-y-12">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-1 space-y-6">
                      <div className="aspect-square rounded-[3rem] bg-slate-100 border-4 border-white shadow-xl shadow-slate-200 overflow-hidden relative">
                        {selectedSeniorForView.idPhoto ? (
                          <img src={selectedSeniorForView.idPhoto} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-systemBlue text-white text-5xl font-black">
                            {selectedSeniorForView.firstName?.[0]}{selectedSeniorForView.lastName?.[0]}
                          </div>
                        )}
                        <div className="absolute top-4 right-4">
                           <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-lg ${
                            selectedSeniorForView.status === 'Active' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                          }`}>{selectedSeniorForView.status}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-center lg:text-left">
                        <h2 className="text-3xl font-black text-slate-900 leading-none">
                          {formatIdDisplayName(selectedSeniorForView)}
                        </h2>
                        <p className="text-blue-600 font-black text-sm uppercase tracking-widest">{selectedSeniorForView.oscaId}</p>
                      </div>
                      
                      <div className="p-5 bg-blue-50 rounded-[2rem] border border-blue-100">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Date Joined</p>
                        <p className="text-blue-900 font-bold">{selectedSeniorForView.joinedDate}</p>
                      </div>
                    </div>

                    <div className="lg:col-span-2 space-y-8">
                       <section>
                         <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-5 pb-2 border-b border-slate-100">
                           <User size={14} /> Personal Information
                         </h4>
                         <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                            <InfoField label="Sex" value={selectedSeniorForView.sex} />
                            <InfoField label="Age" value={`${selectedSeniorForView.age} Years Old`} />
                            <InfoField label="Date of Birth" value={new Date(selectedSeniorForView.dateOfBirth).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
                            <InfoField label="Place of Birth" value={selectedSeniorForView.placeOfBirth} />
                            <InfoField label="Marital Status" value={selectedSeniorForView.civilStatus || 'N/A'} />
                            <InfoField label="Pension Status" value={mapPensionStatus(selectedSeniorForView.pensionStatus)} />
                            <InfoField label="RRN" value={selectedSeniorForView.rrn || 'None'} />
                            <InfoField label="National ID" value={selectedSeniorForView.nationalId || 'None'} />
                         </div>
                       </section>

                       <section>
                         <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-5 pb-2 border-b border-slate-100">
                           <MapPin size={14} /> Contact & Address
                         </h4>
                         <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                            <InfoField label="Barangay" value={selectedSeniorForView.barangay} />
                            <InfoField label="Street Address" value={selectedSeniorForView.streetAddress} className="col-span-2" />
                            <InfoField label="Contact Number" value={selectedSeniorForView.contactNumber || 'None'} />
                            <InfoField label="Emergency Contact" value={selectedSeniorForView.emergencyContact || 'None'} />
                         </div>
                       </section>

                       <section>
                         <h4 className="flex items-center justify-between text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-5 pb-2 border-b border-slate-100">
                           <span className="flex items-center gap-2">
                             <Users size={14} /> Family Information
                           </span>
                           <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-600 font-black">
                             {selectedSeniorForView.familyMembers?.length || 0} MEMBERS
                           </span>
                         </h4>
                         {selectedSeniorForView.familyMembers && selectedSeniorForView.familyMembers.length > 0 ? (
                           <div className="space-y-4">
                             {selectedSeniorForView.familyMembers.map((member: any, idx: number) => (
                               <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:grid sm:grid-cols-3 gap-y-3 gap-x-6">
                                  <div className="col-span-full border-b border-slate-200/50 pb-2 mb-1 flex items-center justify-between">
                                    <p className="font-black text-blue-900 flex items-center gap-2">
                                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                                      {member.name}
                                    </p>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white px-2 py-0.5 rounded-lg border border-slate-100">{member.relationship}</span>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Age</p>
                                    <p className="text-xs font-bold text-slate-700">{member.age} yrs</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Status</p>
                                    <p className="text-xs font-bold text-slate-700">{member.civil_status}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Occupation</p>
                                    <p className="text-xs font-bold text-slate-700 truncate">{member.occupation || 'N/A'}</p>
                                  </div>
                               </div>
                             ))}
                           </div>
                         ) : (
                           <div className="p-8 py-10 rounded-3xl bg-slate-50/50 border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                             <Users size={24} className="opacity-20 mb-2" />
                             <p className="text-xs font-bold italic tracking-wide">No family members listed</p>
                           </div>
                         )}
                       </section>
                    </div>
                  </div>

                  <section>
                    <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 pb-2 border-b border-slate-100">
                      <FileText size={14} /> Uploaded Documents
                    </h4>
                    {selectedSeniorForView.documents && selectedSeniorForView.documents.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedSeniorForView.documents.map((doc: any) => (
                          <a 
                            key={doc.id}
                            href={seniorsAPI.getDocumentUrl(selectedSeniorForView.oscaId, doc.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-50 hover:border-blue-100 hover:bg-blue-50/30 transition-all group w-full text-left"
                          >
                            <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                              <FileText size={24} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="font-black text-slate-800 truncate">{doc.type}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{doc.fileName}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 group-hover:text-blue-500">
                              <Eye size={20} />
                            </div>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="p-10 rounded-[2rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-400 space-y-2">
                        <FileText size={40} className="opacity-20" />
                        <p className="font-bold text-sm">No documents uploaded for this member</p>
                      </div>
                    )}
                  </section>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-400 font-bold">
                  No data available
                </div>
              )}
            </div>

            <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setViewModalOpen(false)}
                className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
              >
                Close View
              </button>
            </div>
          </div>
        </div>,
        document.getElementById('modal-root') || document.body
      )}

      {/* Confirm Action Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.type === 'Delete' ? 'Permanently Delete Record?' : 'Mark as Deceased?'}
        message={
          confirmState.type === 'Delete' 
            ? `Are you sure you want to remove ${confirmState.senior?.name} from the registry? This action is irreversible.`
            : `Are you sure you want to mark ${confirmState.senior?.name} as deceased? This will deactivate their ID and stop all benefits.`
        }
        variant={confirmState.type === 'Delete' ? 'danger' : 'warning'}
        confirmLabel={confirmState.type === 'Delete' ? 'Delete Record' : 'Confirm Status Change'}
        onConfirm={handleAction}
        onCancel={() => setConfirmState({ isOpen: false, type: null, senior: null })}
        loading={isProcessing}
      />
    </div>
  );
};

export default MemberRegistry;

