// ==============================================================================
// ACE PROSOFT V2 — PRODUCT ENTITLEMENT & LICENSE MANAGER
// Filters menus and screens so customers only see their purchased trainers
// ==============================================================================

import type { MenuItem, TopLevelMenu } from '../config/menuData';

export interface CustomerEntitlementProfile {
  collegeName: string;
  department?: string;
  email: string;
  allowedModules: string[];
  issuedAt?: string;
  isOffline?: boolean;
  isUnrestricted?: boolean;
}

const STORAGE_KEY = 'ace_prosoft_customer_profile';

class EntitlementService {
  private profile: CustomerEntitlementProfile | null = null;
  private isLoaded = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.isLoaded) return;

    // 1. Check URL query params (e.g. ?modules=ace101,sim-ace401 for testing/demo)
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlModules = params.get('modules');
      if (urlModules) {
        this.profile = {
          collegeName: params.get('college') || 'Demonstration Mode',
          email: 'demo@ace-instruments.com',
          allowedModules: urlModules.split(',').map((m) => m.trim().toLowerCase()),
        };
        this.isLoaded = true;
        return;
      }

      // 2. Check localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.profile = JSON.parse(stored);
          this.isLoaded = true;
          return;
        }
      } catch (e) {
        console.warn('Failed to parse stored profile:', e);
      }

      // 3. Check Electron IPC / window injection
      const win = window as any;
      if (win.__ACE_INSTALLED_MODULES__) {
        this.profile = win.__ACE_INSTALLED_MODULES__;
        this.isLoaded = true;
        return;
      }

      // 4. Fetch from /api/entitlements in background
      fetch('/api/entitlements')
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.success && data?.profile) {
            this.setProfile(data.profile);
          }
        })
        .catch(() => {});
    }

    this.isLoaded = true;
  }

  private listeners: Array<() => void> = [];

  public subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  /**
   * Sets customer profile upon successful authentication or loading installed_modules.json
   */
  public setProfile(profile: CustomerEntitlementProfile) {
    this.profile = profile;
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    }
    this.notify();
  }

  /**
   * Gets current customer profile
   */
  public getProfile(): CustomerEntitlementProfile | null {
    this.init();
    return this.profile;
  }

  /**
   * Returns list of allowed product codes.
   */
  public getAllowedModules(): string[] | null {
    this.init();
    return this.profile?.allowedModules || null;
  }

  /**
   * Checks if a particular module/trainer is allowed
   */
  public isModuleAllowed(productCode: string): boolean {
    if (!productCode) return false;
    const code = productCode.toLowerCase().trim();

    // Utility actions and info pages are ALWAYS allowed
    if (
      code === 'home' ||
      code.startsWith('about-') ||
      code.startsWith('company-') ||
      code.startsWith('software-') ||
      code.startsWith('version-')
    ) {
      return true;
    }

    const allowed = this.getAllowedModules();

    // If marked unrestricted or wildcard '*', all modules are enabled
    if (this.profile?.isUnrestricted || allowed?.includes('*')) {
      return true;
    }

    // In local dev/evaluation when no restricted license is active, enable all modules
    if (!allowed || allowed.length === 0) {
      return true;
    }

    return allowed.some((m) => {
      const clean = m.toLowerCase().trim();
      return (
        clean === code ||
        code.startsWith(clean) ||
        code.includes(clean) ||
        clean.includes(code)
      );
    });
  }

  /**
   * Enables ONLY the permitted trainer/simulator modules and disables all other packages.
   * Keeps menu structure intact so unpurchased products are displayed greyed-out (disabled).
   */
  public filterMenu(menuList: TopLevelMenu[]): TopLevelMenu[] {
    const applyToItems = (items: MenuItem[]): MenuItem[] => {
      return items.map((item) => {
        if (item.type === 'separator') return { ...item };

        if (item.children && item.children.length > 0) {
          const updatedChildren = applyToItems(item.children);
          // Check if parent product itself is allowed OR if any child is allowed
          const target = item.action || item.id;
          const isParentAllowed = this.isModuleAllowed(target);
          const hasAnyEnabledChild = updatedChildren.some(
            (c) => c.enabled && c.type !== 'separator'
          );
          const isEnabled = isParentAllowed || hasAnyEnabledChild;

          // If the parent trainer is allowed (e.g. ace101), ensure its sub-controllers are enabled too
          const finalChildren = updatedChildren.map((child) => {
            if (isParentAllowed && child.type !== 'separator') {
              return { ...child, enabled: true };
            }
            return child;
          });

          return {
            ...item,
            children: finalChildren,
            enabled: isEnabled,
          };
        }

        // Leaf item
        const target = item.action || item.id;
        const isAllowed = this.isModuleAllowed(target);
        return {
          ...item,
          enabled: isAllowed,
        };
      });
    };

    return menuList.map((menu) => ({
      ...menu,
      items: applyToItems(menu.items),
    }));
  }
}

export const entitlementService = new EntitlementService();
