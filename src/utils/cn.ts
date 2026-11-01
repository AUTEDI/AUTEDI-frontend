/** 조건부 className을 공백으로 이어 붙인다. */
export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}
