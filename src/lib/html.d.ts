/**
 * we use webpack's html-loader to allow us import html files as strings inside ts.
 * This declaration is necessary so that TS doesn't freak out about "import xxx from 'xxx.html'" statements
 */
declare module "*.html" {
  const content: string;
  export default content;
}