import React, { useState } from 'react';
import './ClientInstallPage.css';

interface AuthResponse {
  success: boolean;
  collegeName?: string;
  department?: string;
  allowedModules?: string[];
  error?: string;
}

const INSTALLER_URL =
  'https://github.com/meenasundaratgmaildotcom/ACE-Prosoft-Releases/releases/download/v2.0.0/ACE.Prosoft.V2.Setup.2.0.0.exe';

export const ClientInstallPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authData, setAuthData] = useState<AuthResponse | null>(null);

  const handleAuthenticateAndInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both your College Email ID and Password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth-install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          machineName: window.navigator.userAgent.includes('Windows') ? 'WINDOWS_CLIENT' : 'WEB_CLIENT',
        }),
      });

      const data: AuthResponse = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Authentication failed. Please verify your credentials.');
        setIsLoading(false);
        return;
      }

      setAuthData(data);
      setIsLoading(false);
    } catch (err: any) {
      setError('Connection error: ' + (err.message || 'Unable to connect to activation server.'));
      setIsLoading(false);
    }
  };

  const triggerDownloads = (data: AuthResponse) => {
    // 1. Download installed_modules.json license file
    const licenseJson = JSON.stringify(
      {
        success: true,
        collegeName: data.collegeName,
        department: data.department,
        email: email.trim(),
        allowedModules: data.allowedModules,
        timestamp: new Date().toISOString(),
        isOnlineActivated: true,
      },
      null,
      2
    );

    const blob = new Blob([licenseJson], { type: 'application/json' });
    const licenseUrl = URL.createObjectURL(blob);
    const licenseLink = document.createElement('a');
    licenseLink.href = licenseUrl;
    licenseLink.download = 'installed_modules.json';
    document.body.appendChild(licenseLink);
    licenseLink.click();
    document.body.removeChild(licenseLink);
    URL.revokeObjectURL(licenseUrl);

    // 2. Trigger official installer download
    setTimeout(() => {
      const installerLink = document.createElement('a');
      installerLink.href = INSTALLER_URL;
      installerLink.setAttribute('download', 'ACE.Prosoft.V2.Setup.2.0.0.exe');
      document.body.appendChild(installerLink);
      installerLink.click();
      document.body.removeChild(installerLink);
    }, 600);
  };

  return (
    <div className="install-page-container">
      <div className="install-card">
        {/* Header */}
        <div className="install-header">
          <img
            src="/images/ace_logo.png"
            alt="ACE Logo"
            className="install-logo"
            onError={(e) => {
              // Fallback to text if image not loaded
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <h1 className="install-title">ADVANCED CONTROL EQUIPMENTS</h1>
          <p className="install-subtitle">ACE Prosoft V2 — Online Client Setup & Activation</p>
        </div>

        {!authData ? (
          /* Authentication & Installation Form (Single Window) */
          <form onSubmit={handleAuthenticateAndInstall} className="install-form">
            {error && (
              <div className="install-alert-error">
                <span className="install-alert-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className="install-form-group">
              <label htmlFor="install-email" className="install-label">
                College Email ID (Login ID)
              </label>
              <input
                id="install-email"
                type="email"
                className="install-input"
                placeholder="Enter College Email ID"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                required
              />
            </div>

            <div className="install-form-group">
              <label htmlFor="install-password" className="install-label">
                Password
              </label>
              <div className="install-password-wrapper">
                <input
                  id="install-password"
                  type={showPassword ? 'text' : 'password'}
                  className="install-input"
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="install-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="install-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="install-spinner"></span>
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>Authenticate & Start Installation</span>
                </>
              )}
            </button>

            <div className="install-footer-note">
              <span>🔒 Direct online setup • No PowerShell required • Licensed Lab Deployment</span>
            </div>
          </form>
        ) : (
          /* Success Screen with License and Downloads */
          <div className="install-success-content">
            <div className="install-success-banner">
              <span className="install-success-icon">✓</span>
              <div>
                <h3 className="install-success-title">Authentication Successful!</h3>
                <p className="install-success-desc">
                  {authData.collegeName} {authData.department ? `(${authData.department})` : ''}
                </p>
              </div>
            </div>

            <div className="install-modules-section">
              <h4 className="install-modules-heading">
                Authorized Lab Modules ({authData.allowedModules?.length || 0})
              </h4>
              <div className="install-modules-grid">
                {authData.allowedModules?.map((mod) => (
                  <div key={mod} className="install-module-tag">
                    <span className="install-module-dot"></span>
                    <span>{mod.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="install-steps-card">
              <div className="install-step-item" style={{ background: '#0f172a', border: '1px solid #3b82f6' }}>
                <span className="install-step-num" style={{ background: '#2563eb' }}>⚡</span>
                <div>
                  <strong>Direct 1-Step Windows Online Installer (Recommended)</strong>
                  <p style={{ marginBottom: '8px' }}>
                    To launch the setup wizard directly on your screen without any browser "Save As" prompts:
                  </p>
                  <p style={{ margin: 0 }}>
                    Press <kbd style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '4px', border: '1px solid #475569' }}>Win</kbd> + <kbd style={{ background: '#1e293b', padding: '2px 6px', borderRadius: '4px', border: '1px solid #475569' }}>R</kbd> and paste:
                  </p>
                  <code style={{ display: 'block', marginTop: '6px', padding: '8px 10px', background: '#1e293b', borderRadius: '6px', color: '#38bdf8', fontSize: '0.84rem', userSelect: 'all' }}>
                    mshta https://ace-processtrainers.vercel.app/install.hta
                  </code>
                </div>
              </div>

              <div className="install-step-item">
                <span className="install-step-num">⬇️</span>
                <div>
                  <strong>Browser Setup Download</strong>
                  <p style={{ marginBottom: '10px' }}>
                    Windows security prevents web browsers from auto-running <code>.exe</code> files. Click below to download the setup file, then click it in your browser downloads to install:
                  </p>
                  <a
                    href="https://github.com/meenasundaratgmaildotcom/ACE-Prosoft-Releases/releases/download/v2.0.0/ACE.Prosoft.V2.Setup.2.0.0.exe"
                    className="install-download-btn"
                    download="ACE.Prosoft.V2.Setup.2.0.0.exe"
                  >
                    Download ACE Prosoft V2 Setup (123 MB)
                  </a>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="install-reset-btn"
              onClick={() => {
                setAuthData(null);
                setPassword('');
              }}
            >
              Sign In with Another Account
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
