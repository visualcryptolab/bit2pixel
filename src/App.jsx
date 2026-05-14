import React, { useState, useEffect, useRef } from 'react';
import { Download, Trash2, Info, Image as ImageIcon, ZoomIn, Shuffle, LayoutGrid, Upload } from 'lucide-react';

/**
 * Aplicación Bit2Pixel
 * Permite generar imágenes de píxeles a partir de cadenas binarias (0s y 1s).
 * Incluye herramientas para generar ruido aleatorio, usar iconos predefinidos y subir imágenes.
 */
export default function App() {
  const [input, setInput] = useState('');
  const [selectedSize, setSelectedSize] = useState(32);
  const [zoom, setZoom] = useState(300);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Filtra solo los 0s y 1s de la cadena de entrada
  const bits = input.replace(/[^01]/g, '');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const len = bits.length;
    
    // Pixel blanco por defecto si está vacío
    if (len === 0) {
      canvas.width = 1;
      canvas.height = 1;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1, 1);
      return;
    }

    // Calcula el lado para un cuadrado perfecto basado en los bits actuales
    const side = Math.ceil(Math.sqrt(len));
    canvas.width = side;
    canvas.height = side;

    const imgData = ctx.createImageData(side, side);
    
    for (let i = 0; i < side * side; i++) {
      const bit = i < len ? bits[i] : '0'; 
      const color = bit === '1' ? 0 : 255;
      
      const idx = i * 4;
      imgData.data[idx] = color;     // R
      imgData.data[idx + 1] = color; // G
      imgData.data[idx + 2] = color; // B
      imgData.data[idx + 3] = 255;   // Alpha
    }
    
    ctx.putImageData(imgData, 0, 0);

  }, [bits]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || bits.length === 0) return;
    
    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `bit2pixel-image-${bits.length}.png`;
    link.href = url;
    link.click();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Límite de seguridad para evitar bloqueos del navegador
        if (img.width * img.height > 40000) {
          setError('Image is too large. Max resolution supported is 200x200.');
          setTimeout(() => setError(''), 5000);
          return;
        }
        setError('');

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const data = imageData.data;
        let newBits = '';
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i+1];
          const b = data[i+2];
          const a = data[i+3];
          
          const isWhite = (r === 255 && g === 255 && b === 255) || a === 0;
          newBits += isWhite ? '0' : '1';
        }
        
        setInput(newBits);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const generateRandomBits = () => {
    const total = selectedSize * selectedSize;
    let randomString = '';
    for (let i = 0; i < total; i++) {
      randomString += Math.random() > 0.5 ? '1' : '0';
    }
    setInput(randomString);
  };

  const generateBitsFromCanvas = (drawInstructions) => {
    const size = selectedSize;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = size;
    tempCanvas.height = size;
    const ctx = tempCanvas.getContext('2d');

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#000000';
    
    drawInstructions(ctx, size);

    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    let newBits = '';

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]; 
      newBits += r < 128 ? '1' : '0';
    }

    setInput(newBits);
  };

  const loadPreset = (type) => {
    generateBitsFromCanvas((ctx, s) => {
      const center = s / 2;
      const scale = s / 32;

      switch(type) {
        case 'face':
          // Cara reducida para coincidir con el tamaño de la estrella
          ctx.lineWidth = 1.5 * scale;
          ctx.beginPath(); ctx.arc(center, center, 8 * scale, 0, Math.PI * 2); ctx.stroke();
          ctx.beginPath(); ctx.arc(center - 3 * scale, center - 2 * scale, 1.5 * scale, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(center + 3 * scale, center - 2 * scale, 1.5 * scale, 0, Math.PI * 2); ctx.fill();
          ctx.beginPath(); ctx.arc(center, center, 5 * scale, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
          break;
        case 'heart':
          ctx.beginPath();
          ctx.moveTo(center, 9 * scale);
          ctx.bezierCurveTo(center, 1 * scale, 3 * scale, 1 * scale, 3 * scale, 12 * scale);
          ctx.bezierCurveTo(3 * scale, 20 * scale, center, 27 * scale, center, 29 * scale);
          ctx.bezierCurveTo(center, 27 * scale, 29 * scale, 20 * scale, 29 * scale, 12 * scale);
          ctx.bezierCurveTo(29 * scale, 1 * scale, center, 1 * scale, center, 9 * scale);
          ctx.fill();
          break;
        case 'star':
          const spikes = 5;
          // Radio reducido para que quepa dentro del corazón
          const outerRadius = 7 * scale; 
          const innerRadius = 3 * scale;
          ctx.beginPath();
          let rot = Math.PI / 2 * 3;
          ctx.moveTo(center, center - outerRadius);
          for (let i = 0; i < spikes; i++) {
            ctx.lineTo(center + Math.cos(rot) * outerRadius, center + Math.sin(rot) * outerRadius);
            rot += Math.PI / spikes;
            ctx.lineTo(center + Math.cos(rot) * innerRadius, center + Math.sin(rot) * innerRadius);
            rot += Math.PI / spikes;
          }
          ctx.closePath(); ctx.fill();
          break;
        case 'ghost':
          ctx.beginPath();
          ctx.arc(center, 14 * scale, 10 * scale, Math.PI, 0);
          ctx.rect(center - 10 * scale, 14 * scale, 20 * scale, 10 * scale);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(center - 7 * scale, 24 * scale, 3 * scale, 0, Math.PI); 
          ctx.arc(center, 24 * scale, 3 * scale, 0, Math.PI); 
          ctx.arc(center + 7 * scale, 24 * scale, 3 * scale, 0, Math.PI);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(center - 4 * scale, 12 * scale, 2.5 * scale, 0, Math.PI*2); ctx.fill();
          ctx.beginPath(); ctx.arc(center + 4 * scale, 12 * scale, 2.5 * scale, 0, Math.PI*2); ctx.fill();
          break;
        case 'invader':
          const drawInv = (x, y, w=1, h=1) => ctx.fillRect((x*2*scale) + (5*scale), (y*2*scale) + (6*scale), w*2*scale, h*2*scale);
          drawInv(2, 0); drawInv(8, 0);
          drawInv(3, 1); drawInv(7, 1);
          drawInv(2, 2, 7, 1);
          drawInv(1, 3, 2); drawInv(4, 3, 3); drawInv(8, 3, 2);
          drawInv(0, 4, 11);
          drawInv(0, 5); drawInv(2, 5, 7); drawInv(10, 5);
          drawInv(0, 6); drawInv(2, 6); drawInv(8, 6); drawInv(10, 6);
          drawInv(3, 7, 2); drawInv(6, 7, 2);
          break;
        case 'fish':
          const dF = (x, y, w=1, h=1) => ctx.fillRect((x*2*scale) + (7*scale), (y*2*scale) + (11*scale), w*2*scale, h*2*scale);
          dF(2, 1, 6, 3); dF(3, 0, 4, 1); dF(3, 4, 4, 1);
          dF(0, 0, 1, 2); dF(0, 3, 1, 2); dF(1, 1, 1, 3);
          ctx.fillStyle = '#ffffff';
          dF(6, 1);
          break;
        case 'home':
          ctx.beginPath();
          ctx.moveTo(center, 4 * scale); ctx.lineTo(4 * scale, 15 * scale); ctx.lineTo(28 * scale, 15 * scale); ctx.closePath();
          ctx.fill();
          ctx.fillRect(7 * scale, 15 * scale, 18 * scale, 13 * scale);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(13 * scale, 20 * scale, 6 * scale, 8 * scale); 
          break;
        case 'sword':
          ctx.fillRect(15 * scale, 4 * scale, 2 * scale, 16 * scale);
          ctx.beginPath();
          ctx.moveTo(15 * scale, 4 * scale); ctx.lineTo(16 * scale, 2 * scale); ctx.lineTo(17 * scale, 4 * scale); ctx.fill();
          ctx.fillRect(11 * scale, 20 * scale, 10 * scale, 2 * scale);
          ctx.fillRect(15 * scale, 22 * scale, 2 * scale, 6 * scale);
          ctx.fillRect(14 * scale, 28 * scale, 4 * scale, 2 * scale);
          break;
        case 'apple':
          ctx.beginPath();
          ctx.arc(13 * scale, 18 * scale, 7 * scale, 0, Math.PI * 2);
          ctx.arc(19 * scale, 18 * scale, 7 * scale, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillRect(12 * scale, 12 * scale, 8 * scale, 12 * scale);
          ctx.fillRect(15 * scale, 4 * scale, 2 * scale, 6 * scale);
          ctx.beginPath();
          ctx.moveTo(17 * scale, 6 * scale);
          ctx.quadraticCurveTo(22 * scale, 4 * scale, 24 * scale, 8 * scale);
          ctx.quadraticCurveTo(20 * scale, 10 * scale, 17 * scale, 6 * scale);
          ctx.fill();
          break;
        default: break;
      }
    });
  };

  const sideLength = Math.ceil(Math.sqrt(bits.length));

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto space-y-6">
        
        <header className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-3 text-indigo-600 mb-2">
            <ImageIcon size={40} />
            <h1 className="text-4xl font-black tracking-tight uppercase italic">Bit2Pixel</h1>
          </div>
          <p className="text-slate-500 font-medium">
            Generate pixel art from binary strings. Select size, choose a preset, random bits, or upload.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Herramientas y Entrada */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 flex flex-col space-y-6">
              
              {/* Resolución */}
              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center">
                  <LayoutGrid size={14} className="mr-2" /> Step 1: Choose Resolution
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {[16, 32, 64].map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`py-3 rounded-2xl font-bold text-sm transition-all border-2 ${
                        selectedSize === size 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                          : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                      }`}
                    >
                      {size}x{size}
                    </button>
                  ))}
                </div>
              </section>

              {/* Generación de Contenido */}
              <section>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center">
                  <Shuffle size={14} className="mr-2" /> Step 2: Generate Content
                </h3>
                <div className="space-y-4">
                  <button 
                    onClick={generateRandomBits}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-amber-100 transition-all flex items-center justify-center"
                  >
                    <Shuffle size={18} className="mr-2" /> Random Noise
                  </button>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {['face', 'heart', 'star', 'ghost', 'invader', 'fish', 'home', 'sword', 'apple'].map(type => (
                      <button 
                        key={type}
                        onClick={() => loadPreset(type)}
                        className={`px-2 py-2.5 rounded-xl text-[11px] font-bold uppercase transition-colors border ${
                          type === 'star'
                            ? 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'
                            : type === 'fish' 
                            ? 'bg-cyan-50 text-cyan-700 border-cyan-100 hover:bg-cyan-100' 
                            : type === 'sword' || type === 'apple'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-100'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <hr className="border-slate-100" />

              {/* Editor de Bits */}
              <section className="flex-grow flex flex-col min-h-[250px]">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-sm font-bold text-slate-700">Bitstream Editor</label>
                  <div className="flex items-center space-x-3">
                    <input 
                      type="file" accept="image/*" className="hidden" 
                      ref={fileInputRef} onChange={handleImageUpload}
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="text-indigo-500 hover:text-indigo-600 transition-colors flex items-center text-xs font-bold"
                    >
                      <Upload size={14} className="mr-1" />
                      UPLOAD
                    </button>
                    <button 
                      onClick={() => setInput('')}
                      className="text-slate-400 hover:text-red-500 transition-colors flex items-center text-xs font-bold border-l border-slate-100 pl-3"
                    >
                      <Trash2 size={14} className="mr-1" />
                      RESET
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mb-3 p-3 text-[11px] text-red-600 bg-red-50 border border-red-100 rounded-xl flex items-center">
                    <Info size={14} className="mr-2 shrink-0" />
                    {error}
                  </div>
                )}

                <textarea
                  className="w-full flex-grow p-4 border border-slate-100 rounded-2xl bg-slate-50 font-mono text-[10px] leading-tight resize-none focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner"
                  placeholder="00110110..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  spellCheck="false"
                />
              </section>
            </div>
          </div>

          {/* Previsualización */}
          <div className="lg:col-span-7">
            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200 border border-slate-100 flex flex-col sticky top-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-black text-slate-800 text-xl">Image Preview</h2>
                <div className="flex space-x-2">
                   <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold">
                    {sideLength}x{sideLength} px
                   </div>
                   <div className="bg-slate-50 text-slate-400 px-3 py-1 rounded-full text-xs font-bold">
                    {bits.length} bits
                   </div>
                </div>
              </div>
              
              <div className="aspect-square flex items-center justify-center bg-slate-100 rounded-2xl border-4 border-dashed border-slate-200 overflow-auto p-12 relative shadow-inner">
                {bits.length === 0 ? (
                  <div className="text-center text-slate-300">
                    <ImageIcon size={64} className="mx-auto mb-4 opacity-20" />
                    <p className="font-bold text-lg">Empty canvas</p>
                    <p className="text-sm">Select a tool or upload to begin</p>
                  </div>
                ) : (
                  <div 
                    className="relative shadow-2xl bg-white border-2 border-white flex-shrink-0"
                    style={{ width: `${zoom}px`, height: `${zoom}px` }}
                  >
                    <canvas
                      ref={canvasRef}
                      className="block w-full h-full"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                )}
              </div>

              {bits.length > 0 && (
                <>
                  <div className="mt-8 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <div className="flex items-center">
                        <ZoomIn size={16} className="mr-2 text-indigo-500" />
                        Visual Scale
                      </div>
                      <span>{zoom}px</span>
                    </div>
                    <input 
                      type="range" min="50" max="1000" value={zoom} 
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>

                  <button
                    onClick={handleDownload}
                    className="mt-8 w-full flex items-center justify-center py-4 rounded-2xl font-black text-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 transition-all active:scale-95"
                  >
                    <Download size={22} className="mr-3" />
                    EXPORT PNG
                  </button>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
