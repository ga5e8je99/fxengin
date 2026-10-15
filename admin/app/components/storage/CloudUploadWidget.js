'use client';

import React, { useState, useRef } from 'react';
import { uploadFileDirectToStorage, validateExternalLink } from '../../services/storageService';
import { toast } from 'react-toastify';
import {
  HiOutlineCloudUpload,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineLink,
} from 'react-icons/hi';

export default function CloudUploadWidget({
  value = '',
  onChange,
  folder = 'courses',
  label = 'رفع ملف سحابي مباشر',
  accept = 'video/*,image/*,application/pdf',
  placeholder = 'https://... أو اختر ملفاً للرفع',
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setValidationResult(null);

    toast.info(`جاري رفع "${file.name}" مباشرة إلى التخزين السحابي...`);

    try {
      const result = await uploadFileDirectToStorage(file, {
        folder,
        onProgress: (percent) => setUploadProgress(percent),
      });

      if (result.ok && result.fileUrl) {
        toast.success('تم الرفع السحابي المباشر بنجاح!');
        if (onChange) onChange(result.fileUrl);
      } else {
        toast.error(result.error || 'فشل الرفع السحابي');
      }
    } catch {
      toast.error('حدث خطأ أثناء الرفع السحابي');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleValidateLink = async () => {
    if (!value || !value.trim()) {
      toast.warning('يرجى إدخال الرابط للتحقق منه');
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const res = await validateExternalLink(value.trim());
      if (res.ok && res.data) {
        setValidationResult(res.data);
        if (res.data.isValid) {
          toast.success('الرابط السحابي فعال وصحيح!');
        } else {
          toast.warning('الرابط غير متاح أو لا يستجيب بصورة سليمة');
        }
      } else {
        setValidationResult({ isValid: false, status: res.status });
        toast.error('فشل التحقق من الرابط');
      }
    } catch {
      toast.error('خطأ أثناء فحص الرابط السحابي');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <label className="text-[#A7AFBF] font-medium">{label}</label>
        {value && (
          <button
            type="button"
            onClick={handleValidateLink}
            disabled={isValidating}
            className="text-[11px] text-[#0488F8] hover:underline flex items-center gap-1 font-bold"
          >
            <HiOutlineLink />
            <span>{isValidating ? 'جاري الفحص...' : 'فحص صحة الرابط'}</span>
          </button>
        )}
      </div>

      {/* URL Input with Upload Trigger Button */}
      <div className="flex items-center gap-2">
        <input
          type="url"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 h-10 px-3 rounded-xl bg-[#06142F] border border-[#12315C] text-[#F5F7FA] text-xs font-mono outline-none focus:border-[#0488F8] dir-ltr text-right"
        />

        <input
          type="file"
          ref={fileInputRef}
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="px-3.5 h-10 rounded-xl bg-[#12315C] hover:bg-[#1A4278] text-[#F5F7FA] font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          title="رفع ملف إلى السيرفر"
        >
          <HiOutlineCloudUpload className="text-lg text-[#0488F8]" />
          <span>رفع ملف</span>
        </button>
      </div>

      {/* Progress Bar when uploading */}
      {isUploading && (
        <div className="space-y-1 p-2 rounded-xl bg-[#06142F] border border-[#0488F8]/40 animate-in fade-in">
          <div className="flex items-center justify-between text-[11px] text-[#A7AFBF]">
            <span>جاري رفع وحفظ الملف...</span>
            <span className="font-bold text-[#0488F8] font-tabular">{uploadProgress}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#12315C] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#0488F8] to-[#16C784] transition-all duration-150"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Validation Result Pill */}
      {validationResult && (
        <div
          className={`p-2 rounded-lg flex items-center gap-2 text-[11px] font-medium ${
            validationResult.isValid
              ? 'bg-[#16C784]/15 text-[#16C784] border border-[#16C784]/30'
              : 'bg-[#F6465D]/15 text-[#F6465D] border border-[#F6465D]/30'
          }`}
        >
          {validationResult.isValid ? (
            <HiOutlineCheckCircle className="text-base shrink-0" />
          ) : (
            <HiOutlineExclamationCircle className="text-base shrink-0" />
          )}
          <span>
            {validationResult.isValid
              ? `الرابط متصل بنجاح (HTTP ${validationResult.status || 200}) ${
                  validationResult.contentType ? `• ${validationResult.contentType}` : ''
                }`
              : `الرابط غير متاح أو تالف (HTTP ${validationResult.status || 'Error'})`}
          </span>
        </div>
      )}
    </div>
  );
}
