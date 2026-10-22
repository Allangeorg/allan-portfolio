declare module '*.css';

declare module 'next/image' {
  import { ComponentType, ImgHTMLAttributes } from 'react';
  const Image: ComponentType<
    ImgHTMLAttributes<HTMLImageElement> & {
      fill?: boolean;
      priority?: boolean;
      quality?: number;
      sizes?: string;
    }
  >;
  export default Image;
}

declare module 'framer-motion' {
  import { ComponentType, HTMLAttributes } from 'react';
  export const motion: {
    div: ComponentType<HTMLAttributes<HTMLDivElement> & Record<string, any>>;
    p: ComponentType<HTMLAttributes<HTMLParagraphElement> & Record<string, any>>;
    h2: ComponentType<HTMLAttributes<HTMLHeadingElement> & Record<string, any>>;
    [key: string]: any;
  };
  export const AnimatePresence: ComponentType<any>;
}
