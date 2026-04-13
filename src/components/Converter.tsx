"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Upload, ArrowRight, Loader2, CheckCircle2, FileText, Zap } from "lucide-react";

interface SampleData {
  id: number;
  title: string;
  raw_text: string;
  normalized_markdown: string;
  hallucination_reduction: number;
}

export default function Converter() {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [result, setResult] = useState<SampleData | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
    },
    multiple: false,
  });

  const handleConvert = async () => {
    if (!file) return;
    setIsConverting(true);
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      // Real API call to the backend
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const res = await fetch(`${backendUrl}/api/convert`, {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) throw new Error("변환 중 오류가 발생했습니다.");
      
      const data: SampleData = await res.json();
      setResult(data);
    } catch (error) {
      console.error("Failed to convert file", error);
      alert("서버 연결을 확인해주세요. (FastAPI 서버가 실행 중인가요?)");
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-stretch justify-center h-full max-w-7xl mx-auto py-12 px-4">
      {/* Left Panel: Upload */}
      <div className="flex-1 flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Upload className="h-5 w-5 text-blue-500" />
          입력 소스
        </h2>
        <div 
          {...getRootProps()} 
          className={`relative flex-1 min-h-[400px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 transition-all cursor-pointer overflow-hidden ${
            isDragActive ? "border-blue-500 bg-blue-500/5" : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]"
          }`}
        >
          <input {...getInputProps()} />
          
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-500/5 to-transparent opacity-50" />
          
          {file ? (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-blue-400" />
              </div>
              <p className="text-white font-medium mb-1">{file.name}</p>
              <p className="text-gray-400 text-sm">{(file.size / 1024).toFixed(2)} KB</p>
              <button 
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="mt-6 text-xs text-gray-500 hover:text-red-400 transition-colors underline underline-offset-4"
              >
                파일 제거
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/5 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Upload className="h-8 w-8 text-gray-400 group-hover:text-blue-400 transition-colors" />
              </div>
              <p className="text-white font-medium mb-2">파일을 드래그하여 놓아주세요</p>
              <p className="text-gray-400 text-sm max-w-xs leading-relaxed">
                PDF, 텍스트 파일을 지원합니다. 데이터는 AI가 분석하기 좋은 형태로 자동 정규화됩니다.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Center: Bridge Button */}
      <div className="flex flex-row lg:flex-col items-center justify-center gap-4 py-4">
        <div className="hidden lg:block w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />
        <button
          disabled={!file || isConverting}
          onClick={handleConvert}
          className={`relative group p-4 rounded-full transition-all flex items-center justify-center shadow-2xl ${
            !file || isConverting 
              ? "bg-gray-800 text-gray-500 cursor-not-allowed" 
              : "bg-blue-600 text-white hover:bg-blue-500 hover:scale-110"
          }`}
        >
          {isConverting ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <>
              <ArrowRight className="h-8 w-8 lg:rotate-0 rotate-90" />
              <div className="absolute -inset-1 bg-blue-500 rounded-full blur opacity-30 group-hover:opacity-60 transition-opacity -z-10" />
            </>
          )}
          
          <span className="absolute -bottom-8 lg:hidden whitespace-nowrap text-xs font-bold uppercase tracking-wider text-blue-500">
            {isConverting ? "정규화 중..." : "변환하기"}
          </span>
        </button>
        <span className="hidden lg:block whitespace-nowrap text-xs font-bold uppercase tracking-wider text-blue-500 vertical-text py-4">
           {isConverting ? "정규화 진행 중..." : "AI 연결 브릿지"}
        </span>
        <div className="hidden lg:block w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent" />
      </div>

      {/* Right Panel: Output */}
      <div className="flex-1 flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-blue-500" />
            정규화된 결과
          </div>
          {result && (
            <div className="flex items-center gap-1.5 bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-500/20">
              <Zap className="h-3 w-3 fill-current" />
              환각(Hallucination) {result.hallucination_reduction}% 감소
            </div>
          )}
        </h2>
        
        <div className="flex-1 min-h-[400px] border border-white/10 rounded-2xl bg-[#0d0d0d] overflow-hidden flex flex-col relative shadow-2xl shadow-blue-500/5">
          {result ? (
            <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-500">
              <div className="border-b border-white/10 px-6 py-3 bg-white/5 flex items-center justify-between">
                <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">ai_readable_standard_v1.md</span>
                <button 
                  onClick={() => navigator.clipboard.writeText(result.normalized_markdown)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-medium"
                >
                  JSON 복사
                </button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="prose prose-invert prose-blue max-w-none">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={atomDark}
                            language={match[1]}
                            PreTag="div"
                            className="rounded-lg !bg-transparent !p-0"
                            {...props}
                          >
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        ) : (
                          <code className="bg-white/10 px-1.5 py-0.5 rounded text-blue-400" {...props}>
                            {children}
                          </code>
                        );
                      },
                      h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-4 border-b border-white/10 pb-2">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xl font-semibold text-blue-400 mt-6 mb-3">{children}</h2>,
                      p: ({ children }) => <p className="text-gray-300 leading-relaxed mb-4">{children}</p>,
                      li: ({ children }) => <li className="text-gray-300 mb-2">{children}</li>,
                      table: ({ children }) => <div className="overflow-x-auto my-6"><table className="min-w-full divide-y divide-white/10 border border-white/10 rounded-lg overflow-hidden">{children}</table></div>,
                      th: ({ children }) => <th className="bg-white/5 px-4 py-2 text-left text-xs font-bold text-blue-400 uppercase tracking-wider">{children}</th>,
                      td: ({ children }) => <td className="px-4 py-2 text-sm text-gray-300 border-t border-white/10">{children}</td>,
                    }}
                  >
                    {result.normalized_markdown}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 grayscale opacity-50">
              <div className="w-16 h-16 bg-white/5 rounded-full border border-dashed border-white/20 flex items-center justify-center mb-4">
                <Zap className="h-8 w-8 text-gray-500" />
              </div>
              <p className="text-gray-500 font-medium">변환 대기 중...</p>
              <p className="text-gray-600 text-sm mt-2">데이터를 연결하여 놀라운 변화를 확인하세요</p>
            </div>
          )}
          
          {/* Scanning Effect Overlay during conversion */}
          {isConverting && (
            <div className="absolute inset-0 pointer-events-none z-20">
              <div className="w-full h-1 bg-blue-500/50 blur-sm animate-scan" />
              <div className="w-full h-full bg-blue-500/5 animate-pulse" />
            </div>
          )}
        </div>
      </div>
      
      <style jsx global>{`
        .vertical-text {
          writing-mode: vertical-rl;
          text-orientation: mixed;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(400px); }
        }
        .animate-scan {
          animation: scan 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
}
