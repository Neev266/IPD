import React, { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { UploadCloud, FileText, FileCode, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface NewDraftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateBlank: () => void;
  onCreateFromImport: (fileName: string, parsedHtml: string, cloudinaryUrl: string) => void;
}

type DialogMode = "choice" | "upload";

export default function NewDraftDialog({
  isOpen,
  onClose,
  onCreateBlank,
  onCreateFromImport,
}: NewDraftDialogProps) {
  const [mode, setMode] = useState<DialogMode>("choice");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    if (isUploading) return; // Prevent closing while processing
    setMode("choice");
    setErrorMsg(null);
    onClose();
  };

  const selectFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (isUploading) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFileUpload(files[0]);
    }
  };

  const processFileUpload = async (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "pdf" && extension !== "docx") {
      toast.error("Invalid file format. Only PDF and Word (.docx) documents are supported.");
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);
    setUploadStep("Connecting to conversion server...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      // Simulate steps for a better visual experience
      setTimeout(() => {
        setUploadStep("Uploading file to Cloudinary storage...");
      }, 800);

      setTimeout(() => {
        setUploadStep(
          file.type === "application/pdf"
            ? "Converting PDF to editable document format..."
            : "Parsing Word document structures..."
        );
      }, 2000);

      const response = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to process and convert file.");
      }

      const data = await response.json();
      toast.success("Document successfully uploaded and converted!");
      
      // Pass the returned details up
      onCreateFromImport(data.fileName, data.html, data.cloudinaryUrl, data.cloudinaryPublicId);
      handleClose();
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMsg(err.message || "Could not connect to the backend server. Make sure it is running on port 5000.");
    } finally {
      setIsUploading(false);
      setUploadStep("");
    }
  };

  // Mock callback for demo mode
  const handleUseDemo = () => {
    setIsUploading(true);
    setErrorMsg(null);
    setUploadStep("Simulating Cloudinary upload and OCR parsing...");

    setTimeout(() => {
      const mockHtml = `
        <h1 style="font-size:32px;font-weight:600;color:#111;margin-bottom:8px;line-height:1.3">Employment Agreement (Demo)</h1>
        <p style="font-family:'Inter',sans-serif;font-size:10px;font-weight:600;letter-spacing:.12em;color:#999;text-transform:uppercase;margin-bottom:0">Simulated Upload & Convert</p>
        <hr style="border:none;border-top:1px solid #d8d3c7;margin:24px 0" />
        <h2 style="font-size:18px;font-weight:700;color:#111;margin-top:24px;margin-bottom:8px">1. Title and Position</h2>
        <p style="font-size:14px;color:#333;line-height:1.6;margin-bottom:20px;text-align:justify">The Executive shall serve as the Vice President of Technology of the Company. In this role, the Executive shall perform all duties customary to the position and as assigned by the Chief Executive Officer or Board of Directors.</p>
        <h2 style="font-size:18px;font-weight:700;color:#111;margin-top:24px;margin-bottom:8px">2. Term of Employment</h2>
        <p style="font-size:14px;color:#333;line-height:1.6;margin-bottom:20px;text-align:justify">The Executive's employment under this Agreement shall commence on August 1st, 2026, and continue indefinitely until terminated by either party in accordance with the provisions detailed in Section 7.</p>
        <h2 style="font-size:18px;font-weight:700;color:#111;margin-top:24px;margin-bottom:8px">3. Confidentiality and Intellectual Property</h2>
        <p style="font-size:14px;color:#333;line-height:1.6;margin-bottom:20px;text-align:justify">The Executive agrees to hold all proprietary technical designs, source code, and business planning strategies in the strictest confidence. Any invention or modification developed during the term of employment belongs solely to the Employer.</p>
      `;
      onCreateFromImport("demo_employment_agreement.pdf", mockHtml, "local-file://demo_employment_agreement.pdf");
      toast.success("Loaded demo converted document successfully!");
      setIsUploading(false);
      handleClose();
    }, 1500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] border-[#e6e2da] bg-[#fbfaf8] p-6 shadow-2xl rounded-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="font-serif text-[24px] font-medium text-[#222]">
            {mode === "choice" ? "Create New Draft" : "Upload Document"}
          </DialogTitle>
          <DialogDescription className="font-sans text-[13px] text-[#666]">
            {mode === "choice"
              ? "Start drafting from scratch or import an existing document to make it editable."
              : "Upload a PDF or Word (.docx) file. We'll upload it to Cloudinary and convert it."}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {mode === "choice" ? (
            <motion.div
              key="choice"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-2 gap-4 mt-2"
            >
              {/* Option 1: Blank Draft */}
              <button
                onClick={() => {
                  onCreateBlank();
                  handleClose();
                }}
                className="flex flex-col items-center justify-center p-6 bg-white border border-[#e6e2da] rounded-xl hover:border-[#b5af9f] hover:bg-[#f6f4eb] transition-all duration-300 group shadow-sm text-center"
              >
                <div className="w-12 h-12 rounded-full bg-[#f3f0e8] flex items-center justify-center mb-4 group-hover:bg-white transition-colors">
                  <FileText className="w-6 h-6 text-[#555]" />
                </div>
                <h3 className="font-serif text-[16px] font-semibold text-[#222] mb-1">
                  Blank Draft
                </h3>
                <p className="font-sans text-[11px] text-[#888] leading-relaxed">
                  Start drafting on a clean page from scratch
                </p>
              </button>

              {/* Option 2: Upload Doc */}
              <button
                onClick={() => setMode("upload")}
                className="flex flex-col items-center justify-center p-6 bg-white border border-[#e6e2da] rounded-xl hover:border-[#b5af9f] hover:bg-[#f6f4eb] transition-all duration-300 group shadow-sm text-center"
              >
                <div className="w-12 h-12 rounded-full bg-[#f3f0e8] flex items-center justify-center mb-4 group-hover:bg-white transition-colors">
                  <UploadCloud className="w-6 h-6 text-[#555]" />
                </div>
                <h3 className="font-serif text-[16px] font-semibold text-[#222] mb-1">
                  Import Document
                </h3>
                <p className="font-sans text-[11px] text-[#888] leading-relaxed">
                  Upload PDF/Word to edit and store on Cloudinary
                </p>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 mt-1"
            >
              {/* Back button */}
              {!isUploading && (
                <button
                  onClick={() => {
                    setMode("choice");
                    setErrorMsg(null);
                  }}
                  className="flex items-center gap-1.5 text-xs text-[#888] hover:text-[#333] transition-colors"
                >
                  <ArrowLeft size={14} /> Back to options
                </button>
              )}

              {/* Upload Drop Zone / Progress */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={!isUploading ? selectFile : undefined}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all ${
                  isUploading
                    ? "border-[#d8d3c7] bg-[#fbfaf8] cursor-default"
                    : "border-[#d3ccbf] bg-white hover:border-[#b5af9f] hover:bg-[#f6f4eb] cursor-pointer"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.docx"
                  className="hidden"
                  disabled={isUploading}
                />

                {isUploading ? (
                  <div className="space-y-4 py-4 flex flex-col items-center">
                    <Loader2 className="w-10 h-10 text-[#353b49] animate-spin" />
                    <div className="space-y-1">
                      <p className="font-serif text-[15px] font-medium text-[#222] flex items-center justify-center gap-1.5">
                        <Sparkles size={16} className="text-[#a49a85] animate-pulse" />
                        Processing Document
                      </p>
                      <p className="font-sans text-[12px] text-[#888] animate-pulse">
                        {uploadStep}
                      </p>
                    </div>
                  </div>
                ) : errorMsg ? (
                  <div className="space-y-4 flex flex-col items-center">
                    <div className="text-red-500 font-sans text-xs bg-red-50 border border-red-200 p-4 rounded-lg max-w-sm text-left leading-relaxed">
                      <strong>Failed to convert:</strong> {errorMsg}
                    </div>
                    <div className="flex gap-2.5">
                      <button
                        onClick={selectFile}
                        className="bg-[#353b49] text-white rounded-lg py-2 px-4 font-sans text-xs font-semibold hover:bg-[#2b303b] transition-colors"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={handleUseDemo}
                        className="bg-white border border-[#e6e2da] text-[#555] rounded-lg py-2 px-4 font-sans text-xs font-semibold hover:bg-[#f6f4eb] transition-colors"
                      >
                        Use Demo Document
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-12 h-12 rounded-full bg-[#f3f0e8] flex items-center justify-center mx-auto mb-2">
                      <UploadCloud className="w-6 h-6 text-[#777]" />
                    </div>
                    <div>
                      <p className="font-serif text-[15px] text-[#222] font-semibold">
                        Drag and drop your file here
                      </p>
                      <p className="font-sans text-xs text-[#888] mt-1">
                        or click to browse from files (PDF or DOCX)
                      </p>
                    </div>
                    <div className="flex justify-center gap-4 text-[10px] font-sans font-semibold tracking-wider text-[#999] uppercase pt-2">
                      <span className="flex items-center gap-1">
                        <FileCode size={12} /> PDF Document
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText size={12} /> Word .docx
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
