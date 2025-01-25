import { FilterEditor } from '../dist/lib';

export async function fetchSchema(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Response status: ${response.status}`);
  }

  const json = await response.json();
  return json;
}


// import { setUpFilterEditor } from '../src/lib';

export function ready(fn) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}


(function() {
  ready(async () => {
    // const schema = await fetchSchema('http://127.0.0.1:8000/schema');
    const schema = {
      "models": {
        "fieldsmodel": {
          "__rel": [
            "user"
          ],
          "__verbose_name": "字段模型",
          "id": {
            "verbose_name": "ID",
            "class": "BigAutoField",
            "choices": null
          },
          "char": {
            "verbose_name": "字符",
            "class": "CharField",
            "choices": null
          },
          "integer": {
            "verbose_name": "整数",
            "class": "IntegerField",
            "choices": null
          },
          "datetime": {
            "verbose_name": "日期",
            "class": "DateTimeField",
            "choices": null
          },
          "choice0": {
            "verbose_name": "审核状态",
            "class": "CharField",
            "choices": {
              "": "---------",
              "pending": "审核中",
              "rejected": "审核不通过",
              "approved": "审核通过"
            }
          }
        },
        "user": {
          "__rel": [
            "logentry",
            "fieldsmodel",
            "groups",
            "user_permissions"
          ],
          "__verbose_name": "user",
          "id": {
            "verbose_name": "ID",
            "class": "AutoField",
            "choices": null
          },
          "password": {
            "verbose_name": "password",
            "class": "CharField",
            "choices": null
          },
          "last_login": {
            "verbose_name": "last login",
            "class": "DateTimeField",
            "choices": null
          },
          "is_superuser": {
            "verbose_name": "superuser status",
            "class": "BooleanField",
            "choices": null
          },
          "username": {
            "verbose_name": "username",
            "class": "CharField",
            "choices": null
          },
          "first_name": {
            "verbose_name": "first name",
            "class": "CharField",
            "choices": null
          },
          "last_name": {
            "verbose_name": "last name",
            "class": "CharField",
            "choices": null
          },
          "email": {
            "verbose_name": "email address",
            "class": "EmailField",
            "choices": null
          },
          "is_staff": {
            "verbose_name": "staff status",
            "class": "BooleanField",
            "choices": null
          },
          "is_active": {
            "verbose_name": "active",
            "class": "BooleanField",
            "choices": null
          },
          "date_joined": {
            "verbose_name": "date joined",
            "class": "DateTimeField",
            "choices": null
          }
        }
      },
      "lookups": {
        "BigAutoField": [
          "exact",
          "isnull",
          "gt",
          "gte",
          "lt",
          "lte"
        ],
        "CharField": [
          "exact",
          "isnull",
          "iexact",
          "contains",
          "icontains",
          "startswith",
          "istartswith",
          "endswith",
          "iendswith",
          "regex",
          "iregex"
        ],
        "IntegerField": [
          "exact",
          "isnull",
          "gt",
          "gte",
          "lt",
          "lte"
        ],
        "DateTimeField": [
          "exact",
          "isnull",
          "gt",
          "gte",
          "lt",
          "lte"
        ],
        "AutoField": [
          "exact",
          "isnull",
          "gt",
          "gte",
          "lt",
          "lte"
        ],
        "BooleanField": [
          "exact",
          "isnull"
        ],
        "EmailField": [
          "exact",
          "isnull",
          "iexact",
          "contains",
          "icontains",
          "startswith",
          "istartswith",
          "endswith",
          "iendswith",
          "regex",
          "iregex"
        ]
      }
    };
    
    const editor = new FilterEditor({
      container: '#django-lispy-filter-editor',
      schema: schema,
      mainModel: "fieldsmodel",
      initialExpression: [
        "and", ["not", ["=", "user__password__exact", 1]]
      ]
    });

    // TODO add `export` button
    document.querySelector("#btn-to-json")?.addEventListener('click', () => {
      console.log(editor.toJson());
    })
    
  });
})();
