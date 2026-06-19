interface Window {
  pendo?: {
    track: (eventName: string, properties?: Record<string, any>) => void;
    [key: string]: any;
  };
}
