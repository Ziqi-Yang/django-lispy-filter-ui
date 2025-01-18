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
      fields: [
        { name: 'char__startswith', label: 'Starts with', type: 'string' },
        { name: 'char__endswith', label: 'Ends with', type: 'string' },
        { name: 'char__contains', label: 'Contains', type: 'string' }
      ],
      initialValue: ['or', 
        ['=', 'char__startswith', 'f'],
        ['=', 'char__startswith', 'f1']
      ]
    });
  });
})();
