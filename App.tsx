
import React, { useState, useRef } from 'react';
import { generateScript, generateImage, ReferenceImage } from './geminiService';
import { ScriptResult, AppStatus, AspectRatio } from './types';

const Header: React.FC = () => (
  <header className="py-8 px-4 text-center badass-gradient shadow-2xl rounded-b-3xl mb-8">
    <div className="max-w-4xl mx-auto flex flex-col items-center">
      <div className="w-24 h-24 mb-4 rounded-full border-4 border-white overflow-hidden bg-slate-200 shadow-xl">
        <img src="https://picsum.photos/id/1025/200/200" alt="Avatar" className="w-full h-full object-cover" />
      </div>
      <h1 className="text-3xl md:text-5xl bangers tracking-wider text-white drop-shadow-lg uppercase leading-tight">
        VIẾT KỊCH BẢN - TẠO ẢNH MINH HỌA PRO
      </h1>
      <p className="mt-2 text-blue-100 font-semibold italic text-lg">
        "Nhanh - Ngầu - Dồn dập - Hài hước"
      </p>
    </div>
  </header>
);

const ResultCard: React.FC<{ title: string; content: string; isCode?: boolean }> = ({ title, content, isCode }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    alert('Đã copy!');
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 mb-6 shadow-lg transition-all hover:border-blue-500/50">
      <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
        <h3 className="text-xl font-bold text-blue-400 uppercase tracking-tight">{title}</h3>
        <button 
          onClick={copyToClipboard}
          className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-md transition-colors font-bold"
        >
          COPY
        </button>
      </div>
      {isCode ? (
        <pre className="bg-slate-950 p-4 rounded-lg text-green-400 overflow-x-auto whitespace-pre-wrap font-mono text-sm leading-relaxed border border-slate-800">
          <code>{content}</code>
        </pre>
      ) : (
        <div className="text-slate-300 whitespace-pre-wrap leading-relaxed">
          {content}
        </div>
      )}
    </div>
  );
};

const ImageModal: React.FC<{ url: string | null; onClose: () => void }> = ({ url, onClose }) => {
  if (!url) return null;

  return (
    <div 
      className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <button 
        className="absolute top-6 right-6 text-white text-4xl hover:text-blue-400 transition-colors z-[210]"
        onClick={onClose}
      >
        &times;
      </button>
      <div className="relative max-w-5xl w-full flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
        <img 
          src={url} 
          alt="Preview" 
          className="max-h-[85vh] max-w-full rounded-xl shadow-2xl border border-slate-700 object-contain animate-in zoom-in-95 duration-300"
        />
        <a 
          href={url} 
          download="tnsolve_hq_scene.png"
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold uppercase tracking-widest shadow-lg transition-all active:scale-95"
        >
          TẢI ẢNH CHẤT LƯỢNG CAO
        </a>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [result, setResult] = useState<ScriptResult | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [imgProgress, setImgProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  
  // Reference Image State
  const [referenceImg, setReferenceImg] = useState<ReferenceImage | null>(null);
  const [refImgPreview, setRefImgPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setRefImgPreview(base64String);
        setReferenceImg({
          data: base64String.split(',')[1],
          mimeType: file.type
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const clearReferenceImg = () => {
    setReferenceImg(null);
    setRefImgPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    setStatus(AppStatus.LOADING);
    setError(null);
    setGeneratedImages([]);
    
    try {
      const data = await generateScript(topic);
      setResult(data);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError('Đã có lỗi xảy ra khi tạo kịch bản. Hãy thử lại sau!');
      setStatus(AppStatus.ERROR);
    }
  };

  const handleGenerateImages = async () => {
    if (!result || result.imagePrompts.length === 0) return;
    
    setStatus(AppStatus.GENERATING_IMAGES);
    setImgProgress(0);
    const newImages: string[] = [];
    
    try {
      for (let i = 0; i < result.imagePrompts.length; i++) {
        setImgProgress(i + 1);
        const imgUrl = await generateImage(result.imagePrompts[i], aspectRatio, referenceImg || undefined);
        newImages.push(imgUrl);
      }
      setGeneratedImages(newImages);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError('Lỗi khi tạo hình ảnh. Vui lòng kiểm tra API Key hoặc thử lại.');
      setStatus(AppStatus.SUCCESS); 
    }
  };

  // Helper for aspect ratio display classes
  const getAspectClass = (ratio: AspectRatio) => {
    if (ratio === '1:1') return 'aspect-square';
    if (ratio === '16:9') return 'aspect-video';
    if (ratio === '9:16') return 'aspect-[9/16]';
    return 'aspect-square';
  };

  const getGridCols = (ratio: AspectRatio) => {
    if (ratio === '9:16') return 'grid-cols-2 md:grid-cols-4 lg:grid-cols-8';
    if (ratio === '16:9') return 'grid-cols-1 md:grid-cols-2';
    return 'grid-cols-2 md:grid-cols-4';
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-950">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4">
        {/* Input Section */}
        <div className="bg-slate-900 rounded-2xl p-6 shadow-2xl mb-12 border border-slate-800 focus-within:border-blue-500 transition-all">
          <label className="block text-blue-500 font-bold mb-2 uppercase text-xs tracking-widest">Chủ đề Video của bạn</label>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ví dụ: Bí kíp sống sót qua mùa deadline..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all placeholder:text-slate-600"
            />
            <button
              onClick={handleGenerate}
              disabled={status === AppStatus.LOADING || status === AppStatus.GENERATING_IMAGES}
              className={`md:w-48 py-4 rounded-xl font-extrabold uppercase tracking-widest transition-all ${
                status === AppStatus.LOADING 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95'
              }`}
            >
              {status === AppStatus.LOADING ? 'ĐANG BIÊN TẬP...' : 'TẠO KỊCH BẢN'}
            </button>
          </div>
        </div>

        {/* Status Messaging */}
        {status === AppStatus.LOADING && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-pulse">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-[0_0_20px_rgba(37,99,235,0.5)]"></div>
            <p className="text-blue-400 font-bold uppercase tracking-widest text-sm">Đang xào nấu content siêu ngầu...</p>
          </div>
        )}

        {status === AppStatus.GENERATING_IMAGES && (
          <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
              <div className="w-20 h-20 border-b-4 border-r-4 border-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tighter">AI ĐANG VẼ...</h2>
              <p className="text-blue-400 font-mono text-lg mb-4">Phân cảnh: {imgProgress} / 8 {referenceImg ? '(Sử dụng ảnh mẫu)' : ''}</p>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-500" 
                  style={{ width: `${(imgProgress / 8) * 100}%` }}
                ></div>
              </div>
              <p className="mt-4 text-slate-500 text-xs italic tracking-wide">Vui lòng không đóng trình duyệt lúc này!</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-950/50 border border-red-800 text-red-400 p-4 rounded-xl mb-8 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {/* Results Section */}
        {(status === AppStatus.SUCCESS || status === AppStatus.GENERATING_IMAGES) && result && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* Action Bar for Image Gen & Reference Image */}
            <div className="mb-12 flex flex-col items-center gap-8">
              
              {/* Reference Image Uploader & Ratio Selector */}
              {generatedImages.length === 0 && (
                <div className="w-full flex flex-col md:flex-row gap-6">
                  {/* Uploader */}
                  <div className="flex-1 bg-slate-900/50 border border-dashed border-slate-700 p-6 rounded-3xl flex flex-col items-center gap-4 transition-all hover:border-blue-500/50">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Ảnh tham chiếu (Tùy chọn)</h4>
                    {refImgPreview ? (
                      <div className="relative group">
                        <img src={refImgPreview} alt="Reference Preview" className="w-32 h-32 object-cover rounded-2xl border-2 border-blue-500 shadow-xl" />
                        <button 
                          onClick={clearReferenceImg}
                          className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-lg hover:bg-red-500"
                        >
                          &times;
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-32 h-32 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-600 hover:text-blue-500 hover:border-blue-500/50 transition-all bg-slate-950/50"
                      >
                        <span className="text-3xl">📸</span>
                        <span className="text-[10px] font-bold">UPLOAD</span>
                      </button>
                    )}
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                  </div>

                  {/* Ratio Selector */}
                  <div className="flex-1 bg-slate-900/50 border border-slate-700 p-6 rounded-3xl flex flex-col items-center gap-4">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tỉ lệ khung hình</h4>
                    <div className="flex gap-3 w-full">
                      {(['1:1', '9:16', '16:9'] as AspectRatio[]).map((ratio) => (
                        <button
                          key={ratio}
                          onClick={() => setAspectRatio(ratio)}
                          className={`flex-1 py-4 rounded-xl border-2 font-black transition-all ${
                            aspectRatio === ratio
                              ? 'bg-blue-600 border-blue-400 text-white shadow-lg'
                              : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <div className={`border-2 border-current rounded-sm ${
                              ratio === '1:1' ? 'w-4 h-4' : 
                              ratio === '16:9' ? 'w-6 h-3' : 'w-3 h-6'
                            }`}></div>
                            <span className="text-xs">{ratio}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {generatedImages.length === 0 ? (
                <button 
                  onClick={handleGenerateImages}
                  className="group bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-tighter shadow-2xl flex items-center gap-4 transition-all hover:scale-105 active:scale-95"
                >
                  <span className="text-3xl group-hover:animate-bounce">🎨</span>
                  {referenceImg ? 'VẼ 8 CẢNH THEO MẪU' : 'TẠO BỘ ẢNH MINH HỌA'}
                </button>
              ) : (
                <div className="bg-green-900/20 border border-green-500/50 text-green-400 px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl">
                  <span className="text-xl">✅</span> ĐÃ HOÀN THÀNH BỘ ẢNH!
                </div>
              )}
            </div>

            {/* Image Gallery */}
            {generatedImages.length > 0 && (
              <div className="mb-12">
                <div className="flex justify-between items-end mb-6">
                  <h3 className="text-2xl font-black text-white flex items-center gap-3 italic">
                    <span className="w-8 h-8 bg-blue-600 flex items-center justify-center rounded-lg text-sm not-italic">🖼️</span>
                    GALLERY MINH HỌA 3D
                  </h3>
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Đang xem tỉ lệ: {aspectRatio}</p>
                    <p className="text-[10px] text-blue-500 font-bold tracking-widest">Click vào ảnh để xem chi tiết</p>
                  </div>
                </div>
                <div className={`grid gap-4 ${getGridCols(aspectRatio)}`}>
                  {generatedImages.map((url, idx) => (
                    <div 
                      key={idx} 
                      className={`group relative ${getAspectClass(aspectRatio)} bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg hover:border-blue-500 transition-all cursor-zoom-in`}
                      onClick={() => setSelectedImage(url)}
                    >
                      <img src={url} alt={`Scene ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                        <p className="text-[10px] text-white font-bold uppercase mb-1">Cảnh {idx + 1}</p>
                        <div className="flex gap-2">
                          <span className="text-[10px] bg-blue-600 text-white font-black py-1 px-2 rounded flex-1 text-center">XEM CHI TIẾT</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <ResultCard title="PHẦN 1: NỘI DUNG ĐỌC - TTS CONTENT" content={result.ttsContent} isCode />
            <ResultCard title="PHẦN 2: MÔ TẢ CẢNH - TIẾNG VIỆT" content={result.sceneDescriptions} />
            <ResultCard 
              title="PHẦN 3: PROMPT TẠO ẢNH - TIẾNG ANH" 
              content={result.imagePrompts.map((p, i) => `${i + 1}. ${p}`).join('\n\n')} 
              isCode 
            />
            <ResultCard title="PHẦN 4: BÀI ĐĂNG FACEBOOK" content={result.facebookPost} />
          </div>
        )}

        {/* Placeholder for Initial View */}
        {status === AppStatus.IDLE && (
          <div className="text-center py-24 opacity-20 select-none grayscale transition-all hover:grayscale-0 hover:opacity-40">
            <div className="text-9xl mb-6">📽️</div>
            <p className="text-2xl font-black italic tracking-widest uppercase">Input đi chờ chi!</p>
          </div>
        )}
      </main>
      
      {/* Full Screen Image Modal */}
      <ImageModal url={selectedImage} onClose={() => setSelectedImage(null)} />

      {/* Footer Branding */}
      <footer className="fixed bottom-0 w-full bg-slate-900/90 backdrop-blur-md border-t border-slate-800 py-3 text-center text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold z-50">
        Được tạo bởi thầy Hồ Định - 0846666637 • Gemini 2.5/3.0
      </footer>
    </div>
  );
};

export default App;
