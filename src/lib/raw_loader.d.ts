/**
 * we use webpack's raw-loader to allow us import ts scripts as strings
 * This declaration is necessary so that TS doesn't freak out about "import xxx from 'xxx.exec.ts'" statements
 */
declare module "raw-loader!*" {
  const script: string;
  export default script;
}