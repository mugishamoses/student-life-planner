import { toast as sonnerToast } from 'sonner@2.0.3';

export const useToast = () => {
  const toast = {
    success: (message: string) => {
      sonnerToast.success(message, {
        duration: 3000,
      });
    },
    error: (message: string) => {
      sonnerToast.error(message, {
        duration: 4000,
      });
    },
    info: (message: string) => {
      sonnerToast.info(message, {
        duration: 3000,
      });
    },
  };

  return { toast };
};
