import { FilterEditor } from '../src/lib';


// import { setUpFilterEditor } from '../src/lib';

export function ready(fn) {
    if (document.readyState !== 'loading') {
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}


(function() {
  ready(() => {
    const editor = new FilterEditor({
      container: '#django-lispy-filter-editor',
      onChange: (filter) => {
        console.log('Filter changed:', filter);
      },
      initialValue: {
        operator: 'and',
        not: true,
        children: [
          {
            field: 'field1',
            operator: 'equals',
            value: 'value1',
            not: true
          },
          {
            field: 'field2',
            operator: 'contains',
            value: 'value2'
          },
          {
            operator: 'or',
            children: [
              {
                field: 'field1',
                operator: 'equals',
                value: 'value1',
                not: true
              }
            ]
          }
        ]
      }
    });
  });
})();
