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
    "fieldSelector": {
      "placeholder": "Select a field"
    },
    "lookup": {
      "exact": "equals",
      "iexact": "equals (case-insensitive)",
      "isnull": "is null",
      "gt": "is greater than",
      "gte": "is greater than or equal to",
      "lt": "is less than",
      "lte": "is less than or equal to",
      "contains": "contains",
      "icontains": "contains(case-insensitive)",
      "startswith": "starts with",
      "istartswith": "starts with(case-insensitive)",
      "endswith": "ends with",
      "iendswith": "ends with(case-insensitive)",
      "regex": "matches(regular expression)",
      "iregex": "matches(regular expression, case-insensitive)",
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
