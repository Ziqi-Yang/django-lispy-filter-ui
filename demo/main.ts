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
    const schema = await fetchSchema('http://127.0.0.1:8000/schema');
    
    const editor = new FilterEditor({
      container: '#django-lispy-filter-editor',
      schema: schema,
      mainModel: "fieldsmodel",
      initialExpression: [
        "not", ["and", ["not", ["=", "user__password__gt", 1]]]
      ]
    });
  });
})();
