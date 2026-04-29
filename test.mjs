import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { temporal } from 'zundo';

const useStore = create(temporal(persist(() => ({ count: 0 }), { name: 'test' })));
console.log(Object.keys(useStore.temporal));
console.log(typeof useStore.temporal.getState);
