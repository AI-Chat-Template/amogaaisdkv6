import { create } from "zustand";

interface DialogProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  data: unknown;
  setData(data: unknown): void;
  openModel(data: unknown): void;
}

export const useDialog = create<DialogProps>((set) => ({
  isOpen: false,
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  data: {},
  setData: (data) => set({ data }),
  openModel: (data) => {
    set({ data });
    set({ isOpen: true });
  },
}));
