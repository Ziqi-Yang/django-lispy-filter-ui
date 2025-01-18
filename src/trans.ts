import { I18n } from "i18n-js";
import zhCN from '../trans/zh-CN.json';

export const i18n = new I18n({
  "en": { // for all en (en-US, etc.)
    "operator": {
      "not": "Not",
      "and": "And",
      "or": "Or",
      "xor": "Xor",
    },
    "operator-tip": {
      "not": "Not",
      "and": "",
      "or": "",
      "xor": "",
    }
  },
  "zh": { // for all zh (zh-CN, etc.)
    ...zhCN
  }
});

i18n.defaultLocale = 'en';
i18n.enableFallback = true;

export function trans(...params: Parameters<typeof i18n.t>) {
  i18n.locale = navigator.language;
  return i18n.t(...params);
}
