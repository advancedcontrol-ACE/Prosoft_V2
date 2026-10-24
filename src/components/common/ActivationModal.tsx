import React, { useState } from 'react';
import { entitlementService } from '../../services/entitlementService';
import './ActivationModal.css';

interface ActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActivationModal: React.FC<ActivationModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both College Email ID and Password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Try local desktop backend endpoint first
      let res = await fetch('/api/entitlements/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      }).catch(() => null);

      let data = res && res.ok ? await res.json() : null;

      // 2. If local backend route unavailable (e.g. web preview), contact cloud server directly
      if (!data || !data.success) {
        const cloudRes = await fetch('https://ace-processtrainers.vercel.app/api/auth-install', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password: password.trim(), machineName: 'DESKTOP_CLIENT' }),
        });
        data = await cloudRes.json();
      }

      if (data && data.success) {
        entitlementService.setProfile({
          collegeName: data.collegeName || data.profile?.collegeName,
          department: data.department || data.profile?.department,
          email: email.trim(),
          allowedModules: data.allowedModules || data.profile?.allowedModules || [],
          issuedAt: new Date().toISOString(),
        });

        setSuccessMsg(`License activated successfully for ${data.collegeName || 'Institution'}!`);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(data?.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch (err: any) {
      setError('Connection error: ' + (err.message || 'Unable to connect to server.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="activation-modal-overlay" onClick={onClose}>
      <div className="activation-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="activation-modal-header">
          <img src="/images/ace_logo.png" alt="ACE Logo" className="activation-modal-logo" />
          <h2 className="activation-modal-title">ADVANCED CONTROL EQUIPMENTS</h2>
          <p className="activation-modal-subtitle">ACE Prosoft V2 — Product Entitlement & License Activation</p>
        </div>

        {error && (
          <div className="activation-modal-alert error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="activation-modal-alert success">
            <span>✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleActivate} className="activation-modal-form">
          <div className="activation-modal-group">
            <label>College Email ID (Login ID)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter College Email ID"
              autoFocus
              required
            />
          </div>

          <div className="activation-modal-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Password"
              required
            />
          </div>

          <div className="activation-modal-actions">
            <button type="button" className="activation-btn-cancel" onClick={onClose} disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="activation-btn-submit" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Unlock Licensed Packages'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
