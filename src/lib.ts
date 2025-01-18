import type { FilterEditorOptions, LispyExpression, LispyCondition, LogicalOperator, ComparisonOperator } from './types';

export class FilterEditor {
  private static readonly OPERATORS: ComparisonOperator[] = ['=', '!=', '>', '<', '>=', '<='];
  private container: HTMLElement;
  private options: FilterEditorOptions;
  private expression: LispyExpression;

  constructor(options: FilterEditorOptions) {
    this.options = options;
    this.container = typeof options.container === 'string' 
      ? document.querySelector(options.container)! 
      : options.container;
        
    this.expression = options.initialValue || ['and'];
    this.init();
  }

  private init(): void {
    this.render();
    this.attachEventListeners();
  }

  private render(): void {
    this.container.innerHTML = `
    <div class="dlf-root-container">
      ${this.renderExpression(this.expression)}
    </div>
    `;
  }

  private renderExpression(expr: LispyExpression): string {
    const [operator, ...conditions] = expr;
    const children = conditions.map(cond => 
      Array.isArray(cond) && typeof cond[0] === 'string' && ['and', 'or'].includes(cond[0])
        ? this.renderExpression(cond as LispyExpression)
        : this.renderCondition(cond as LispyCondition)
    ).join('');
    
    return `
    <div class="dlf-group dlf-expanded">
      <div class="dlf-group-prefix">
        <select class="select select-sm" data-action="group-operator">
          <option value="and" ${operator === 'and' ? 'selected' : ''}>AND</option>
          <option value="or" ${operator === 'or' ? 'selected' : ''}>OR</option>
        </select>
        <div class="dlf-group-collapse">
          <span class="dlf-parenthesis">(</span>
          <span class="dlf-ellipsis">...</span>
          <span class="dlf-parenthesis">)</span>
        </div>
        <button class="btn btn-xs btn-circle btn-primary" data-action="add-group">
          <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
      <div class="dlf-indent">
        ${children}
      </div>
      <div class="dlf-parenthesis">)</div>
    </div>
    `;
  }

  private renderCondition(condition: LispyCondition): string {
    const [operator, field, value] = condition;
    const fields = this.options.fields.map(f => 
      `<option value="${f.name}" ${f.name === field ? 'selected' : ''}>${f.label}</option>`
    ).join('');
    
    return `
    <div class="dlf-condition group">
      <select class="select select-sm" data-action="field">
        ${fields}
      </select>
      <select class="select select-sm" data-action="operator">
        ${FilterEditor.OPERATORS.map(op => 
          `<option value="${op}" ${op === operator ? 'selected' : ''}>${op}</option>`
        ).join('')}
      </select>
      <input type="text" class="input input-sm" value="${value}" data-action="value">
      <div class="hidden group-hover:flex gap-2">
        <button class="btn btn-xs btn-circle btn-error" data-action="delete">
          <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <button class="btn btn-xs btn-circle btn-primary" data-action="add">
          <svg xmlns="http://www.w3.org/2000/svg" class="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
    `;
  }

  private attachEventListeners(): void {
    this.container.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const button = target.closest('button');
      
      if (target.closest('.dlf-group-collapse')) {
        const group = target.closest('.dlf-group');
        if (group) {
          group.classList.toggle('dlf-expanded');
        }
        return;
      }

      if (!button) return;

      const action = button.dataset.action;
      
      if (action === 'add-group') {
        const group = button.closest('.dlf-group');
        if (group) {
          this.addGroup(group);
        }
        return;
      }

      const condition = button.closest('.dlf-condition');
      if (!condition) return;
      
      if (action === 'delete') {
        this.deleteCondition(condition);
      } else if (action === 'add') {
        this.addCondition(condition);
      }
    });

    // Handle condition and group editing
    this.container.addEventListener('change', (e) => {
      const target = e.target as HTMLElement;
      const action = target.dataset.action;
      if (!action) return;

      if (action === 'group-operator') {
        const group = target.closest('.dlf-group');
        if (!group) return;
        const path = this.findPath(group);
        if (!path) return;

        let current: any = this.expression;
        for (let i = 0; i < path.length - 1; i++) {
          current = current[path[i]];
        }
        current[0] = (target as HTMLSelectElement).value as LogicalOperator;
      } else {
        const condition = target.closest('.dlf-condition');
        if (!condition) return;

        const path = this.findPath(condition);
        if (!path) return;

        let current: any = this.expression;
        for (let i = 0; i < path.length - 1; i++) {
          current = current[path[i]];
        }
        
        const conditionArray = current[path[path.length - 1]] as LispyCondition;
        
        if (action === 'field') {
          conditionArray[1] = (target as HTMLSelectElement).value;
        } else if (action === 'operator') {
          conditionArray[0] = (target as HTMLSelectElement).value as ComparisonOperator;
        } else if (action === 'value') {
          conditionArray[2] = (target as HTMLInputElement).value;
        }
      }

      this.options.onChange?.(this.expression);
    });

    // Handle immediate value updates
    this.container.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.dataset.action === 'value') {
        const condition = target.closest('.dlf-condition');
        if (!condition) return;

        const path = this.findPath(condition);
        if (!path) return;

        let current: any = this.expression;
        for (let i = 0; i < path.length - 1; i++) {
          current = current[path[i]];
        }
        
        const conditionArray = current[path[path.length - 1]] as LispyCondition;
        conditionArray[2] = target.value;
        
        this.options.onChange?.(this.expression);
      }
    });
  }

  private deleteCondition(conditionElement: Element): void {
    const parentGroup = conditionElement.closest('.dlf-group');
    if (!parentGroup) return;

    // Find the path to this condition in the expression tree
    const path = this.findPath(conditionElement);
    if (!path) return;

    // Remove the condition from the expression
    let current: any = this.expression;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current.splice(path[path.length - 1], 1);

    // If group is empty except for operator, remove the group
    if (current.length === 1) {
      const parentPath = path.slice(0, -1);
      let parent: any = this.expression;
      for (let i = 0; i < parentPath.length - 1; i++) {
        parent = parent[path[i]];
      }
      parent.splice(parentPath[parentPath.length - 1], 1);
    }

    this.render();
    this.options.onChange?.(this.expression);
  }

  private addCondition(afterElement: Element): void {
    const path = this.findPath(afterElement);
    if (!path) return;

    const newCondition: LispyCondition = ['=', this.options.fields[0].name, ''];
    
    let current: any = this.expression;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current.splice(path[path.length - 1] + 1, 0, newCondition);

    this.render();
    this.options.onChange?.(this.expression);
  }

  private addGroup(groupElement: Element): void {
    const path = this.findPath(groupElement);
    if (!path) return;

    const newGroup: LispyExpression = ['and', ['=', this.options.fields[0].name, '']];
    
    let current: any = this.expression;
    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current.splice(path[path.length - 1] + 1, 0, newGroup);

    this.render();
    this.options.onChange?.(this.expression);
  }

  private findPath(element: Element): number[] {
    const path: number[] = [];
    let current = element;
    
    while (current && !current.classList.contains('dlf-root-container')) {
      if (current.classList.contains('dlf-condition')) {
        const conditions = Array.from(current.parentElement!.children);
        path.unshift(conditions.indexOf(current) + 1); // +1 because first element is operator
      }
      if (current.classList.contains('dlf-group')) {
        const groups = Array.from(current.parentElement!.children);
        path.unshift(groups.indexOf(current) + 1);
      }
      current = current.parentElement!;
    }
    
    return path;
  }
}
