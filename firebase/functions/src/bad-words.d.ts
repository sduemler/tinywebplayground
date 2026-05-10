declare module "bad-words" {
  class Filter {
    isProfane(str: string): boolean;
    clean(str: string): string;
  }
  export default Filter;
}
