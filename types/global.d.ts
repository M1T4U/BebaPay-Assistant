// CSS modules
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// Other file types you might use
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.svg';