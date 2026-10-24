import React, { useState } from 'react';
import { College } from '../types';

interface OfflineModalProps {
  college: College | null;
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineModal: React.FC<OfflineModalProps> = ({ college, isOpen, onClose }) => {
  if (!isOpen || !college) return null;

  const [isCopied, setIsCopied] = useState(false);

  const modulesStr = (college.products || []).join(',');

  const generateOfflineJson = () => {
    const payload = {
      licenseType: 'OFFLINE_STANDALONE',
      collegeId: college.id,
      collegeName: college.college_name,
      department: college.department,
      email: college.email,
      maxActivations: college.max_activations,
      allowedModules: college.products || [],
      issuedAt: new Date().toISOString(),
      offlineKey: 'OFFLINE_' + Math.random().toString(36).substring(2, 12).toUpperCase(),
      instructions: 'Place this file as installed_modules.json in the ACE Prosoft app directory or installer package.',
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `installed_modules_${college.email.replace(/[@.]/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const offlineBuildCmd = `node scripts/build-dist.cjs --customer="${college.college_name}" --email="${college.email}" --modules="${modulesStr}"`;

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(offlineBuildCmd);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card offline-modal-card">
        <div className="modal-header">
          <div>
            <h2 className="modal-title">⚡ Offline Installer Generator for {college.college_name}</h2>
            <p className="modal-subtitle">
              Prepare a customer-specific standalone setup package for air-gapped lab PCs without internet.
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="offline-content">
          <div className="offline-summary-box">
            <div className="summary-row">
              <span className="summary-label">Target Customer:</span>
              <span className="summary-value font-bold">{college.college_name}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">College Email:</span>
              <span className="summary-value mono">{college.email}</span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Licensed Modules ({college.products?.length || 0}):</span>
              <span className="summary-value badge-list">
                {(college.products || []).map((code) => (
                  <span key={code} className="offline-badge">{code.toUpperCase()}</span>
                ))}
              </span>
            </div>
          </div>

          <div className="offline-methods-grid">
            {/* Method 1: Download Offline Activation Payload */}
            <div className="method-card">
              <h4 className="method-title">📄 Step 1: Download Customer Profile</h4>
              <p className="method-desc">
                Download the verified customer configuration JSON containing only their licensed trainers.
              </p>
              <button className="btn-secondary" onClick={generateOfflineJson}>
                📥 Download installed_modules.json
              </button>
            </div>

            {/* Method 2: Build Tailored Offline .EXE */}
            <div className="method-card">
              <h4 className="method-title">⚙️ Step 2: Build Standalone .EXE Installer</h4>
              <p className="method-desc">
                Run this command in the project terminal to compile an offline `.exe` tailored exclusively for this college:
              </p>
              <div className="code-snippet-box">
                <code>{offlineBuildCmd}</code>
                <button className="btn-copy-code" onClick={handleCopyCmd}>
                  {isCopied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          <div className="offline-lab-guide">
            <h4 className="guide-title">📌 Lab Deployment Instructions for ACE Technicians:</h4>
            <ol className="guide-list">
              <li>Copy the generated <code>ACE_Prosoft_Setup.exe</code> to a USB Flash Drive.</li>
              <li>Plug the USB into the college lab PCs (no internet or WiFi required).</li>
              <li>Run the installer. It will automatically install and enable <strong>only</strong> the {college.products?.length || 0} purchased trainers.</li>
              <li>All 57+ other products remain completely hidden from the students and faculty.</li>
            </ol>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
