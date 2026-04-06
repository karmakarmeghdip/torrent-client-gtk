import type { Atom, WritableAtom } from "jotai";

/** Type for Jotai store get function */
export type StoreGet = <T>(atom: Atom<T>) => T;

/** Type for Jotai store set function */
export type StoreSet = <T, A extends unknown[], R>(atom: WritableAtom<T, A, R>, ...args: A) => R;

/** Type for Jotai store reference */
export interface JotaiStore {
  get: StoreGet;
  set: StoreSet;
}

/** Immutable update for Map - returns new Map with updated value */
export function updateMap<K, V>(map: Map<K, V>, key: K, value: V): Map<K, V> {
  const newMap = new Map(map);
  newMap.set(key, value);
  return newMap;
}

/** Immutable delete for Map - returns new Map without key */
export function deleteFromMap<K, V>(map: Map<K, V>, key: K): Map<K, V> {
  const newMap = new Map(map);
  newMap.delete(key);
  return newMap;
}

/** Create immutable array filter */
export function filterArray<T>(array: T[], predicate: (item: T) => boolean): T[] {
  return array.filter(predicate);
}

/** Create immutable array append */
export function appendToArray<T>(array: T[], item: T): T[] {
  return [...array, item];
}

/** Type-safe store reference that can be null */
export type StoreRef = JotaiStore | null;

/** Check if store is initialized */
export function isStoreInitialized(store: StoreRef): store is JotaiStore {
  return store !== null;
}
