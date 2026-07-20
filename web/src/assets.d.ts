/* SVG files are imported as raw text via the esbuild `text` loader (see the
   build script in package.json); assets/leaf.svg is the brand-mark source. */
declare module "*.svg" {
    const content: string;
    export default content;
}
