import mongoose from 'mongoose';

declare global {
  // eslint-disable-next-line no-var
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

// CSS module declarations
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

export {};
