import { useState, useEffect, useRef } from 'react';
import { Shield, Upload, Eye, EyeOff, AlertTriangle } from 'lucide-react';

export default function SecurePDFViewer() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [message, setMessage] = useState('');
  const [showTutorial, setShowTutorial] = useState(true);
  const pdfContainerRef = useRef(null);

  // Function to handle file uploads
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPdfData(e.target.result);
        setMessage('PDF loaded successfully');
        setTimeout(() => setMessage(''), 3000);
      };
      reader.readAsDataURL(file);
    } else {
      setPdfFile(null);
      setPdfData(null);
      setMessage('Please select a valid PDF file');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Anti-screenshot and save protection
  useEffect(() => {
    if (!pdfData) return;

    const preventContextMenu = (e) => e.preventDefault();
    const preventSave = (e) => {
      if ((e.key === 's' || e.key === 'S') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setMessage('Saving is disabled for security reasons');
        setTimeout(() => setMessage(''), 3000);
      }
      
      // Prevent print screen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        setMessage('Screenshots are disabled for security reasons');
        setTimeout(() => setMessage(''), 3000);
      }
    };

    // Disable right-clicking
    document.addEventListener('contextmenu', preventContextMenu);
    // Disable keyboard shortcuts
    document.addEventListener('keydown', preventSave);
    
    // Clean up
    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('keydown', preventSave);
    };
  }, [pdfData]);

  // Watch for fullscreen changes
  useEffect(() => {
    const fullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', fullscreenChange);
    return () => document.removeEventListener('fullscreenchange', fullscreenChange);
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      pdfContainerRef.current.requestFullscreen().catch(err => {
        setMessage(`Error attempting to enable fullscreen: ${err.message}`);
        setTimeout(() => setMessage(''), 3000);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 text-gray-900">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Shield size={24} />
          <h1 className="text-xl font-bold">Secure PDF Viewer</h1>
        </div>
        {pdfData && (
          <button
            onClick={() => setShowControls(!showControls)}
            className="flex items-center bg-blue-700 hover:bg-blue-800 p-2 rounded"
          >
            {showControls ? <EyeOff size={16} /> : <Eye size={16} />}
            <span className="ml-1">{showControls ? "Hide Controls" : "Show Controls"}</span>
          </button>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Controls */}
        {showControls && (
          <div className="bg-white p-4 border-b">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Upload PDF</label>
                <div className="flex">
                  <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-l cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <Upload size={16} className="mr-2" />
                    <span>Select File</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                  <div className="flex-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r bg-white overflow-hidden whitespace-nowrap">
                    {pdfFile ? pdfFile.name : "No file selected"}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Watermark Text</label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={toggleFullscreen}
                  disabled={!pdfData}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PDF Container */}
        <div 
          ref={pdfContainerRef}
          className="flex-1 relative bg-gray-800 overflow-auto"
          style={{ 
            userSelect: 'none' // Prevent text selection
          }}
        >
          {pdfData ? (
            <div className="relative w-full h-full">
              <iframe 
                src={pdfData}
                className="w-full h-full"
                style={{ 
                  pointerEvents: 'none' // Disable user interaction with PDF content
                }}
              />
              {/* Watermark layer */}
              <div className="absolute inset-0 pointer-events-none select-none flex items-center justify-center">
                <div className="text-6xl font-bold text-red-500 opacity-20 transform rotate-45">
                  {watermarkText}
                </div>
              </div>
              {/* Anti-screenshot layer */}
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\' viewBox=\'0 0 100 100\'%3E%3Ctext x=\'50%25\' y=\'50%25\' font-size=\'12\' text-anchor=\'middle\' dy=\'.3em\' fill=\'rgba(150,150,150,0.05)\'%3E" + watermarkText + "%3C/text%3E%3C/svg%3E")',
                }}
              ></div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              {showTutorial ? (
                <div className="bg-white p-6 rounded shadow-lg max-w-lg">
                  <h2 className="text-xl font-bold mb-4 flex items-center">
                    <AlertTriangle className="text-yellow-500 mr-2" />
                    Secure PDF Viewer Tutorial
                  </h2>
                  <div className="space-y-4">
                    <p>This application provides enhanced security for viewing sensitive PDF documents:</p>
                    <ul className="list-disc pl-5 space-y-2">
                      <li>Documents are displayed with custom watermarks</li>
                      <li>Right-click, save and print functionality is disabled</li>
                      <li>Anti-screenshot measures are implemented</li>
                      <li>Print Screen key is monitored and blocked</li>
                    </ul>
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-sm">
                      <p className="font-medium">Important Security Notes:</p>
                      <p className="mt-1">While this application implements various anti-screenshot and save protections, no solution is 100% foolproof against determined users with technical knowledge. For highly sensitive documents, consider additional security measures.</p>
                    </div>
                    <button 
                      onClick={() => setShowTutorial(false)}
                      className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Got it
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-white text-center p-6">
                  <Upload size={48} className="mx-auto mb-4 opacity-50" />
                  <p className="text-xl">Upload a PDF file to get started</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status message */}
      {message && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded shadow-lg">
          {message}
        </div>
      )}
    </div>
  );
}