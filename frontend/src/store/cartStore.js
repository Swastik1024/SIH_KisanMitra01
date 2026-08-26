import { create } from 'zustand';

const useCartStore = create((set) => ({
  items: [],
  addItem: (product) => set((state) => {
    const existing = state.items.find(item => item.id === product.id);
    if (existing) {
      return { items: state.items.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) };
    }
    return { items: [...state.items, { ...product, quantity: 1 }] };
  }),
  removeItem: (id) => set((state) => ({ items: state.items.filter(item => item.id !== id) })),
  increaseQty: (id) => set((state) => ({ items: state.items.map(item => item.id === id ? { ...item, quantity: item.quantity + 1 } : item) })),
  decreaseQty: (id) => set((state) => ({ items: state.items.map(item => item.id === id ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item) })),
  clearCart: () => set({ items: [] }),
}));

export default useCartStore;
