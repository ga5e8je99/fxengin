import { toast } from 'react-toastify';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi';

/**
 * FXENGIN Custom Toast Utility
 * Follows FXENGIN Design System (design.md):
 * - Dark-first, surface-elevated background (#0A1B3D)
 * - Semantic border accents (Success: #16C784, Error: #F6465D, Info: #0488F8, Warning: #FBBF24)
 * - Noto Sans Arabic / Inter typography
 */

export const showToast = {
  success: (message, options = {}) => {
    return toast.success(message, {
      icon: () => <FiCheckCircle size={18} color="#16C784" />,
      ...options,
    });
  },

  error: (message, options = {}) => {
    return toast.error(message, {
      icon: () => <FiAlertCircle size={18} color="#F6465D" />,
      ...options,
    });
  },

  info: (message, options = {}) => {
    return toast.info(message, {
      icon: () => <FiInfo size={18} color="#0488F8" />,
      ...options,
    });
  },

  warning: (message, options = {}) => {
    return toast.warning(message, {
      icon: () => <FiAlertTriangle size={18} color="#FBBF24" />,
      ...options,
    });
  },

  custom: (content, options = {}) => {
    return toast(content, options);
  },

  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },
};

export default showToast;
