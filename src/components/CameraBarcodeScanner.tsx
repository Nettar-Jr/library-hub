/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { 
  Camera, 
  CameraOff, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  X,
  FlipHorizontal,
  Keyboard,
  Scan
} from 'lucide-react';

export interface CameraBarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose?: () => void;
  title?: string;
  subtitle?: string;
  supportedTypesHelp?: string;
}

export const CameraBarcodeScanner: React.FC<CameraBarcodeScannerProps> = ({
  onScan,
  onClose,
  title = 'Optical Barcode & QR Scanner',
  subtitle = 'Hold a book ISBN barcode or student library card ID in front of your camera',
  supportedTypesHelp = 'Supports EAN-13, EAN-8, Code 128, Code 39, QR codes & Data Matrix'
}) => {
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [manualInput, setManualInput] = useState('');
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = useRef(`qr-reader-${Math.random().toString(36).substring(2, 9)}`).current;
  const isMounted = useRef(true);

  // Sound feedback on successful scan
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // Audio context might be restricted before interaction; non-fatal
    }
  };

  const handleDecoded = (decodedText: string) => {
    if (!decodedText || decodedText === lastScanned) return;
    setLastScanned(decodedText);
    playBeep();
    onScan(decodedText.trim());
  };

  // Enumerate cameras & start scanner
  useEffect(() => {
    isMounted.current = true;

    async function initScanner() {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!isMounted.current) return;

        if (!devices || devices.length === 0) {
          setCameraError('No video input camera devices detected on this computer/phone.');
          setHasPermission(false);
          return;
        }

        setCameras(devices);
        setHasPermission(true);

        // Prefer environment-facing (back) camera on mobile, otherwise first camera
        const backCam = devices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('rear') ||
          d.label.toLowerCase().includes('environment')
        );
        const chosenId = backCam ? backCam.id : devices[0].id;
        setSelectedCameraId(chosenId);

        startCameraWithId(chosenId);
      } catch (err: any) {
        if (!isMounted.current) return;
        console.warn('Camera enumeration error:', err);
        setHasPermission(false);
        setCameraError(
          err.message || 'Camera permission was denied. Please allow camera access in browser settings or use manual/hardware barcode entry.'
        );
      }
    }

    initScanner();

    return () => {
      isMounted.current = false;
      stopScanner();
    };
  }, []);

  const startCameraWithId = async (cameraId: string) => {
    try {
      stopScanner();
      setCameraError(null);

      const html5QrCode = new Html5Qrcode(containerId, {
        formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
        ],
        verbose: false,
      });

      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        cameraId,
        {
          fps: 15,
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.floor(minEdge * 0.78),
              height: Math.floor(minEdge * 0.45), // Wider rectangle tailored for horizontal linear barcodes
            };
          },
          aspectRatio: 1.333333,
        },
        (decodedText) => {
          handleDecoded(decodedText);
        },
        () => {
          // Frame rejected (no code detected in frame) - silent
        }
      );

      if (isMounted.current) {
        setIsScanning(true);
      }
    } catch (err: any) {
      if (isMounted.current) {
        setIsScanning(false);
        setCameraError(err.message || 'Unable to start camera stream.');
      }
    }
  };

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      scannerRef.current.stop().then(() => {
        scannerRef.current?.clear();
      }).catch((e) => {
        console.warn('Error stopping scanner:', e);
      });
    }
  };

  const switchCamera = (newId: string) => {
    setSelectedCameraId(newId);
    startCameraWithId(newId);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleDecoded(manualInput.trim());
    setManualInput('');
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 text-white shadow-2xl space-y-4 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl">
            <Camera className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-display font-extrabold text-sm sm:text-base text-slate-100 flex items-center gap-2">
              {title}
            </h3>
            <p className="text-[11px] text-slate-400 leading-snug">
              {subtitle}
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={() => {
              stopScanner();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            aria-label="Close scanner"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Video Viewport Container */}
      <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-cyan-500/40 min-h-[260px] flex items-center justify-center">
        {/* HTML5 QR Container element */}
        <div id={containerId} className="w-full h-full overflow-hidden" />

        {/* Optical HUD Target reticle overlay */}
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            {/* Corner guides */}
            <div className="relative w-64 h-32 border-2 border-cyan-400/80 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              {/* Animated red laser line */}
              <div className="absolute left-1 right-1 h-0.5 bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse top-1/2 -translate-y-1/2" />
              <div className="absolute top-1 left-2 text-[9px] font-mono text-cyan-300 uppercase tracking-widest bg-black/60 px-1.5 py-0.5 rounded">
                Align Barcode Here
              </div>
            </div>
            <div className="mt-2 text-[10px] font-mono text-cyan-400/90 bg-slate-950/80 px-2.5 py-1 rounded-full border border-cyan-500/30">
              Live Camera Feed · Auto-Decoding
            </div>
          </div>
        )}

        {/* Camera error / Permission banner */}
        {cameraError && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs p-6 flex flex-col items-center justify-center text-center space-y-3 z-20">
            <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-2xl text-rose-400">
              <CameraOff className="w-8 h-8" />
            </div>
            <div className="space-y-1 max-w-sm">
              <p className="text-xs font-bold text-rose-200">Camera Access Not Available</p>
              <p className="text-[11px] text-slate-400">{cameraError}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (selectedCameraId) startCameraWithId(selectedCameraId);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Camera Handshake</span>
            </button>
          </div>
        )}
      </div>

      {/* Camera Selection Controls & Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          {cameras.length > 1 && (
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700">
              <FlipHorizontal className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={selectedCameraId}
                onChange={(e) => switchCamera(e.target.value)}
                className="bg-transparent text-slate-200 text-[11px] font-mono outline-none cursor-pointer"
              >
                {cameras.map((cam, idx) => (
                  <option key={cam.id} value={cam.id} className="bg-slate-900 text-white">
                    {cam.label || `Camera ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}
          <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
            {supportedTypesHelp}
          </span>
        </div>

        {lastScanned && (
          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-mono bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-xl">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Scanned: {lastScanned}</span>
          </div>
        )}
      </div>

      {/* Secondary Manual / USB Barcode Input Fallback */}
      <form onSubmit={handleManualSubmit} className="pt-2 border-t border-slate-800 flex gap-2">
        <div className="relative flex-1">
          <Keyboard className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Type or use USB barcode gun (e.g. 9780143127741 or LIB-STUD-0001)..."
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 outline-none focus:border-cyan-500 transition"
          />
        </div>
        <button
          type="submit"
          disabled={!manualInput.trim()}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition flex items-center gap-1.5"
        >
          <Scan className="w-3.5 h-3.5" />
          <span>Parse</span>
        </button>
      </form>
    </div>
  );
};
