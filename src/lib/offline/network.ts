export type NetworkState = {
  isOnline: boolean;
  checkedAt: string;
};

export function getCurrentNetworkState(): NetworkState {
  if (typeof navigator === "undefined") {
    return {
      isOnline: true,
      checkedAt: new Date().toISOString(),
    };
  }

  return {
    isOnline: navigator.onLine,
    checkedAt: new Date().toISOString(),
  };
}