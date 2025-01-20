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
      "and": "And",
      "or": "Or",
      "xor": "Xor",
    },
    "delete-condition": "Delete this condition",
    "add-new-condition": "Add a new condition",
    "toggle-not": "Toggle not operator",
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
